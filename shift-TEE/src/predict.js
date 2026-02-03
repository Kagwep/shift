export class VolatilityPredictionAction {
    predictionApiUrl = "https://o9r0ju4pg2.execute-api.eu-north-1.amazonaws.com/dev/lipo_volatility_predict";
    
    constructor(apiUrl) {
        if (apiUrl) {
            this.predictionApiUrl = apiUrl;
        }
    }
    
    // Method to handle volatility predictions
    async fetchVolatilityPrediction(tokenPair,days) {
        try {
            // AWS endpoint uses POST instead of GET
            const response = await fetch(this.predictionApiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    days: days.toString() 
                })
            });
            
            if (!response.ok) {
                throw new Error(`Prediction API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // AWS response has extra wrapper, but maintains same 'prediction' structure
            // So existing code that uses response.prediction will still work!
            return data;
            
        } catch (error) {
            console.error("Error fetching volatility prediction:", error);
            throw new Error(`Failed to fetch volatility prediction: ${error.message}`);
        }
    }
    
    // Method to validate and normalize token pair
    validateTokenPair(tokenPair) {
        const supportedPairs = ["LINKUSDT", "UNIUSDT", "AAVEUSDT", "SUSHIUSDT", "1INCHUSDT"];
        const normalizedPair = tokenPair?.toUpperCase();
        
        if (!supportedPairs.includes(normalizedPair)) {
            return "LINKUSDT"; // Default fallback
        }
        
        return normalizedPair;
    }
    
    // Method to format volatility level for display
    formatVolatilityLevel(level) {
        switch (level.toUpperCase()) {
            case 'LOW':
                return '🟢 Low Risk';
            case 'MODERATE':
                return '🟡 Moderate Risk';
            case 'HIGH':
                return '🔴 High Risk';
            default:
                return `📊 ${level}`;
        }
    }
    
    // Method to format prediction response for display
    formatPredictionResponse(prediction) {
        const { prediction: pred } = prediction;
        
        return `📈 **Volatility Analysis for ${pred.trading_pair}**
        
🎯 **Key Metrics:**
• Annualized Volatility: ${pred.annualized_volatility.toFixed(2)}%
• 5-Day Predicted Volatility: ${pred.predicted_volatility_5d.toFixed(2)}%
• Risk Level: ${this.formatVolatilityLevel(pred.volatility_level)}

📊 **Technical Features:**
• Realized Volatility: ${pred.features.realized_vol.toFixed(4)}
• Returns Squared: ${pred.features.returns_squared.toFixed(4)}

📅 **Analysis Date:** ${new Date(pred.timestamp).toLocaleString()}
🔍 **Data Source:** ${pred.data_source}

💡 **Risk Assessment:** ${this.getVolatilityInsight(pred.volatility_level, pred.annualized_volatility)}`;
    }
    
    // Method to provide volatility insights
    getVolatilityInsight(level, annualizedVol) {
        switch (level.toUpperCase()) {
            case 'LOW':
                return "This asset shows relatively stable price movements, suitable for conservative strategies.";
            case 'MODERATE':
                return "Balanced risk-reward profile with moderate price fluctuations expected.";
            case 'HIGH':
                return "High volatility detected - consider risk management strategies and position sizing.";
            default:
                return `Current volatility of ${annualizedVol.toFixed(1)}% suggests careful position management.`;
        }
    }
}