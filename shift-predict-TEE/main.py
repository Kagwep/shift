import json
import numpy as np
import pandas as pd
import onnxruntime as ort
import requests
import time
import datetime
from typing import Dict, Tuple
import os
from flask import Flask, request, jsonify

# Initialize Flask app
app = Flask(__name__)

# Global variables for model reuse
session = None
input_name = None
output_name = None

def initialize_model(model_path: str = None):
    """Initialize ONNX model (called once at startup)"""
    global session, input_name, output_name
    
    if session is not None:
        return  # Already initialized
    
    try:
        # Use bundled model file in same directory
        if model_path is None:
            model_path = 'crypto_vol_model.onnx'
        
        # Check if model file exists
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        session = ort.InferenceSession(model_path)
        input_name = session.get_inputs()[0].name
        output_name = session.get_outputs()[0].name
        print(f"Model loaded successfully from {model_path}")
        
    except Exception as e:
        print(f"Failed to load model: {e}")
        raise

def get_crypto_data(symbol: str, days: int = 30) -> pd.DataFrame:
    """Get recent data from Binance API"""
    base_url = "https://api.binance.com/api/v3/klines"
    
    # Calculate time range
    end_time = int(time.time() * 1000)
    start_time = end_time - (days * 24 * 60 * 60 * 1000)
    
    params = {
        'symbol': symbol,
        'interval': '1d',
        'startTime': start_time,
        'endTime': end_time,
        'limit': 1000
    }
    
    try:
        response = requests.get(base_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if not data:
            raise ValueError(f"No data returned for {symbol}")
        
        # Convert to DataFrame
        df = pd.DataFrame(data, columns=[
            'timestamp', 'open', 'high', 'low', 'close', 'volume',
            'close_time', 'quote_asset_volume', 'number_of_trades',
            'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
        ])
        
        # Process data
        df['Date'] = pd.to_datetime(df['timestamp'], unit='ms')
        df['Open'] = df['open'].astype(float)
        df['Close'] = df['close'].astype(float)
        
        df = df[['Date', 'Open', 'Close']].sort_values('Date')
        
        return df
        
    except Exception as e:
        raise Exception(f"Failed to fetch {symbol}: {str(e)}")

def get_crypto_pair_data(days: int = 30) -> Tuple[pd.DataFrame, pd.DataFrame, str]:
    """Get crypto pair data with fallback options"""
    crypto_symbols = ["LINKUSDT", "UNIUSDT", "AAVEUSDT", "SUSHIUSDT", "1INCHUSDT"]
    eth_symbol = "ETHUSDT"
    
    crypto_data = None
    crypto_symbol = None
    
    # Try crypto symbols in order
    for symbol in crypto_symbols:
        try:
            crypto_data = get_crypto_data(symbol, days)
            crypto_symbol = symbol
            break
        except Exception as e:
            print(f"{symbol} failed: {e}")
            continue
    
    if crypto_data is None:
        raise Exception("All crypto symbols failed to fetch data")
    
    # Get ETH data
    try:
        eth_data = get_crypto_data(eth_symbol, days)
    except Exception as e:
        raise Exception(f"ETH data fetch failed: {e}")
    
    trading_pair = f"{crypto_symbol}/ETHUSDT"
    return crypto_data, eth_data, trading_pair

def prepare_features(crypto_data: pd.DataFrame, eth_data: pd.DataFrame) -> np.ndarray:
    """Prepare features for prediction"""
    # Merge data
    crypto_clean = crypto_data[['Date', 'Open']].rename(columns={'Open': 'CRYPTO'})
    eth_clean = eth_data[['Date', 'Open']].rename(columns={'Open': 'ETH'})
    
    df = pd.merge(crypto_clean, eth_clean, on='Date')
    df = df.dropna().sort_values('Date')
    
    if len(df) < 15:
        raise ValueError(f"Insufficient data: {len(df)} points (need at least 15)")
    
    # Calculate price ratio
    df['price'] = df['ETH'] / df['CRYPTO']
    
    # Calculate returns
    returns = 100 * df['price'].pct_change().dropna()
    
    if len(returns) < 10:
        raise ValueError("Insufficient returns data for calculation")
    
    # Calculate features (last 5 days)
    recent_returns = returns.tail(10)
    
    realized_vol = recent_returns.rolling(5).std().iloc[-1]
    returns_squared = recent_returns.iloc[-1] ** 2
    
    if pd.isna(realized_vol) or pd.isna(returns_squared):
        raise ValueError("NaN values in calculated features")
    
    features = np.array([[realized_vol, returns_squared]], dtype=np.float32)
    
    return features

def classify_volatility(vol: float) -> str:
    """Classify volatility level"""
    if vol < 2:
        return "LOW"
    elif vol < 5:
        return "MODERATE" 
    elif vol < 10:
        return "HIGH"
    else:
        return "EXTREME"

def make_prediction(features: np.ndarray, trading_pair: str) -> Dict:
    """Make volatility prediction using ONNX model"""
    global session, input_name, output_name
    
    if session is None:
        raise Exception("Model not initialized")
    
    try:
        # Run prediction
        prediction = session.run(
            [output_name], 
            {input_name: features}
        )[0]
        
        predicted_vol = float(prediction[0][0])
        
        # Calculate additional metrics
        annual_vol = predicted_vol * np.sqrt(252)
        vol_level = classify_volatility(predicted_vol)
        
        result = {
            'predicted_volatility_5d': predicted_vol,
            'annualized_volatility': annual_vol,
            'volatility_level': vol_level,
            'trading_pair': trading_pair,
            'features': {
                'realized_vol': float(features[0][0]),
                'returns_squared': float(features[0][1])
            },
            'timestamp': datetime.datetime.now().isoformat(),
            'data_source': 'Binance API'
        }
        
        return result
        
    except Exception as e:
        raise Exception(f"Prediction failed: {str(e)}")

# Flask API Routes
@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Crypto Volatility Prediction API',
        'model_loaded': session is not None,
        'timestamp': datetime.datetime.now().isoformat()
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    try:
        # Get request data
        data = request.get_json() if request.is_json else {}
        days = data.get('days', 30)
        
        print(f"Starting volatility prediction (last {days} days)")
        
        # Get latest crypto data
        crypto_data, eth_data, trading_pair = get_crypto_pair_data(days)
        print(f"Fetched data for {trading_pair}")
        
        # Prepare features
        features = prepare_features(crypto_data, eth_data)
        print(f"Features prepared")
        
        # Make prediction
        result = make_prediction(features, trading_pair)
        print(f"Prediction complete: {result['volatility_level']} volatility")
        
        return jsonify({
            'success': True,
            'prediction': result,
            'message': 'Volatility prediction completed successfully'
        })
        
    except Exception as e:
        print(f"Prediction failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Volatility prediction failed'
        }), 500

@app.route('/predict', methods=['GET'])
def predict_get():
    """GET endpoint for prediction (with query params)"""
    try:
        days = int(request.args.get('days', 30))
        
        print(f"Starting volatility prediction (last {days} days)")
        
        # Get latest crypto data
        crypto_data, eth_data, trading_pair = get_crypto_pair_data(days)
        print(f"Fetched data for {trading_pair}")
        
        # Prepare features
        features = prepare_features(crypto_data, eth_data)
        print(f"Features prepared")
        
        # Make prediction
        result = make_prediction(features, trading_pair)
        print(f"Prediction complete: {result['volatility_level']} volatility")
        
        return jsonify({
            'success': True,
            'prediction': result,
            'message': 'Volatility prediction completed successfully'
        })
        
    except Exception as e:
        print(f"Prediction failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Volatility prediction failed'
        }), 500

if __name__ == '__main__':
    # Initialize model at startup
    print("Initializing crypto volatility prediction model...")
    initialize_model()
    print("Model initialized successfully!")
    
    # Run Flask app
    print("Starting Flask API server...")
    app.run(host='0.0.0.0', port=8000, debug=False)