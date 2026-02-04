import json
import os
import sys
import numpy as np
import pandas as pd
import onnxruntime as ort
import requests
import time
import datetime
from typing import Dict, Tuple

# iExec environment variables
IEXEC_OUT = os.getenv('IEXEC_OUT')
IEXEC_IN = os.getenv('IEXEC_IN')

# Global variables for model
session = None
input_name = None
output_name = None

def initialize_model(model_path: str = 'crypto_vol_model.onnx'):
    """Initialize ONNX model"""
    global session, input_name, output_name
    
    if session is not None:
        return
    
    try:
        # Model is in the same directory as app.py (/app/src/)
        model_path = os.path.join(os.path.dirname(__file__), 'crypto_vol_model.onnx')
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at: {model_path}")
        
        session = ort.InferenceSession(model_path)
        input_name = session.get_inputs()[0].name
        output_name = session.get_outputs()[0].name
        print(f"✓ Model loaded successfully from {model_path}")
        
    except Exception as e:
        raise Exception(f"Failed to load model: {e}")

def get_crypto_data(symbol: str, days: int = 30) -> pd.DataFrame:
    """Get recent data from Binance API"""
    base_url = "https://api.binance.com/api/v3/klines"
    
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
        
        df = pd.DataFrame(data, columns=[
            'timestamp', 'open', 'high', 'low', 'close', 'volume',
            'close_time', 'quote_asset_volume', 'number_of_trades',
            'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
        ])
        
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
    
    for symbol in crypto_symbols:
        try:
            crypto_data = get_crypto_data(symbol, days)
            crypto_symbol = symbol
            print(f"✓ Fetched {symbol} data")
            break
        except Exception as e:
            print(f"✗ {symbol} failed: {e}")
            continue
    
    if crypto_data is None:
        raise Exception("All crypto symbols failed to fetch data")
    
    try:
        eth_data = get_crypto_data(eth_symbol, days)
        print(f"✓ Fetched {eth_symbol} data")
    except Exception as e:
        raise Exception(f"ETH data fetch failed: {e}")
    
    trading_pair = f"{crypto_symbol}/ETHUSDT"
    return crypto_data, eth_data, trading_pair

def prepare_features(crypto_data: pd.DataFrame, eth_data: pd.DataFrame) -> np.ndarray:
    """Prepare features for prediction"""
    crypto_clean = crypto_data[['Date', 'Open']].rename(columns={'Open': 'CRYPTO'})
    eth_clean = eth_data[['Date', 'Open']].rename(columns={'Open': 'ETH'})
    
    df = pd.merge(crypto_clean, eth_clean, on='Date')
    df = df.dropna().sort_values('Date')
    
    if len(df) < 15:
        raise ValueError(f"Insufficient data: {len(df)} points (need at least 15)")
    
    df['price'] = df['ETH'] / df['CRYPTO']
    returns = 100 * df['price'].pct_change().dropna()
    
    if len(returns) < 10:
        raise ValueError("Insufficient returns data for calculation")
    
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
        prediction = session.run(
            [output_name], 
            {input_name: features}
        )[0]
        
        predicted_vol = float(prediction[0][0])
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

# ============================================================================
# Main iExec TEE Execution
# ============================================================================

computed_json = {}

try:
    print("=" * 60)
    print("Crypto Volatility Prediction - iExec TEE")
    print("=" * 60)
    
    # Get 'days' parameter from command line
    days = 30  # default
    
    args = sys.argv[1:]
    if len(args) > 0:
        try:
            days = int(args[0])
            print(f"📅 Days parameter: {days}")
        except ValueError:
            print(f"⚠️  Invalid days argument '{args[0]}', using default: {days}")
    else:
        print(f"📅 Using default days: {days}")
    
    # Initialize model
    print("\n🔧 Initializing model...")
    initialize_model()
    
    # Get crypto data
    print(f"\n📊 Fetching market data (last {days} days)...")
    crypto_data, eth_data, trading_pair = get_crypto_pair_data(days)
    
    # Prepare features
    print(f"\n🔬 Preparing features for {trading_pair}...")
    features = prepare_features(crypto_data, eth_data)
    
    # Make prediction
    print("\n🎯 Running prediction...")
    result = make_prediction(features, trading_pair)
    
    print(f"\n✅ Prediction complete!")
    print(f"   Trading Pair: {result['trading_pair']}")
    print(f"   Volatility Level: {result['volatility_level']}")
    print(f"   5-day Volatility: {result['predicted_volatility_5d']:.2f}%")
    print(f"   Annualized Volatility: {result['annualized_volatility']:.2f}%")
    
    # Write result to file
    result_json = {
        'success': True,
        'prediction': result,
        'input_parameters': {
            'days': days
        },
        'message': 'Volatility prediction completed successfully'
    }
    
    with open(IEXEC_OUT + '/result.json', 'w') as f:
        json.dump(result_json, f, indent=2)
    
    print(f"\n💾 Results saved to: {IEXEC_OUT}/result.json")
    
    computed_json = {
        'deterministic-output-path': IEXEC_OUT + '/result.json'
    }
    
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    computed_json = {
        'deterministic-output-path': IEXEC_OUT,
        'error-message': str(e)
    }
    
finally:
    # Always write computed.json (required by iExec)
    with open(IEXEC_OUT + '/computed.json', 'w') as f:
        json.dump(computed_json, f)
    print(f"✓ Computed manifest written")