
# Shift - Autonomous DeFi Portfolio Rebalancing


**Live Demo:** [https://shift-black.vercel.app/](https://shift-black.vercel.app/)

Shift is an autonomous DeFi portfolio management system that leverages machine learning and Trusted Execution Environments (TEE) to make intelligent rebalancing decisions based on real-time market volatility predictions.

## 🎯 Overview

DeFi liquidity providers struggle to manage volatile positions in 24/7 markets. Manual rebalancing is impractical, while existing automated solutions require trust in centralized services and lack predictive intelligence to optimize returns.

Shift combines on-chain liquidity management with off-chain AI inference to automatically optimize your DeFi positions. The system monitors market volatility using trained ML model, executes rebalancing strategies when conditions warrant intervention.

### Key Features

- 🤖 **AI-Powered Predictions** - ONNX-based volatility forecasting for crypto pairs
- 🔒 **Secure Execution** - Rebalancing runs in iExec Trusted Execution Environments
- ⚡ **Autonomous Rebalancing** - Automated Uniswap position management based on ML signals
- 🌐 **Multi-Chain Support** - Built on Arbitrum Sepolia testnet
- 📊 **Real-Time Analytics** - Live market data from Binance API

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│                    (Next.js Frontend)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Arbitrum Sepolia                           │
│              (Smart Contracts & Wallet)                      │
└───────────┬──────────────────────────────┬──────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────┐        ┌─────────────────────────────┐
│                     │        |  Shift-TEE                  │
│  (ML Inference)     │───────▶│  (Rebalancing Logic)       │
│                     │        │                             │
│ • Volatility Model  │        │ • Uniswap Position Analysis │
│ • ONNX Runtime      │        │ • Rebalancing Execution     │
│ • Market Data       │        │ • Parameter Comparison      │
└─────────────────────┘        └─────────────────────────────┘
```

### Components

1. **Client (Frontend)** - Next.js web application for user interaction
2. **Shift-Agent-TEE** - ML inference engine running volatility predictions
3. **Shift-TEE** - Autonomous agent that executes rebalancing logic

## 🚀 Quick Start

### Live Demo

Visit [https://shift-black.vercel.app/](https://shift-black.vercel.app/)

1. Connect your Web3 wallet
2. Switch to **Arbitrum Sepolia** network
3. Start managing your positions

### Local Development

#### Prerequisites

- Node.js 16+ and npm
- Git
- MetaMask or compatible Web3 wallet
- Arbitrum Sepolia testnet ETH

#### Installation

```bash
# Clone the repository
git clone https://github.com/Kagwep/shift

# Navigate to frontend
cd shift/client

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔧 Deployment

### Frontend Deployment (Vercel)

The frontend is automatically deployed to Vercel when pushing to the main branch.

Manual deployment:
```bash
cd client
vercel --prod
```

### TEE Agent Deployment (iExec)

#### Shift-Agent-TEE (ML Inference)

```bash
cd shift-agent-tee

# Create configuration
cat > iapp.config.json << EOF
{
  "defaultChain": "bellecour",
  "projectName": "shift-agent-TEE",
  "template": "JavaScript",
  "appSecret": null,
  "walletPrivateKey": "YOUR_PRIVATE_KEY_HERE"
}
EOF

# Deploy to iExec
iexec app deploy
```

#### Shift-TEE (Rebalancing Agent)

```bash
cd shift-TEE

# Create configuration
cat > iapp.config.json << EOF
{
  "defaultChain": "bellecour",
  "projectName": "shift-TEE",
  "template": "JavaScript",
  "appSecret": null,
  "walletPrivateKey": "YOUR_PRIVATE_KEY_HERE"
}
EOF

# Deploy to iExec
iexec app deploy
```

## 🧠 ML Inference

### Volatility Prediction Model

The system uses a trained ONNX model to predict 5-day volatility for crypto trading pairs.

**Sample Prediction Output:**

```json
{
  "success": true,
  "prediction": {
    "predicted_volatility_5d": 2.7293996810913086,
    "annualized_volatility": 43.327876707999636,
    "volatility_level": "MODERATE",
    "trading_pair": "LINKUSDT/ETHUSDT",
    "features": {
      "realized_vol": 0.5377559065818787,
      "returns_squared": 2.951780319213867
    },
    "timestamp": "2026-02-04T22:11:14.214211",
    "data_source": "Binance API"
  },
  "input_parameters": {
    "days": 30
  },
  "message": "Volatility prediction completed successfully"
}
```

### Volatility Levels

- **LOW** - < 2% (Stable market conditions)
- **MODERATE** - 2-5% (Normal volatility)
- **HIGH** - 5-10% (Elevated risk)
- **EXTREME** - > 10% (High risk conditions)

## 📁 Project Structure

```
shift/
├── client/                    # Next.js frontend application
│   ├── src/
│   ├── public/
│   └── package.json
│
├── shift-agent-TEE/          # ML inference engine
│   ├── src/
│   │   ├── app.py           # Main prediction script
│   │   └── crypto_vol_model.onnx  # Trained ONNX model
│   ├── Dockerfile
│   ├── requirements.txt
│   └── iexec.json
│
├── shift-TEE/                # Rebalancing logic agent
│   ├── src/
│   ├── Dockerfile
│   └── iexec.json
│
├── input/                    # Input data and configs
├── mock/                     # Mock data for testing
└── output/                   # Generated outputs
```

## 🔐 Environment Variables

### Client (Frontend)

Create `.env.local` in the `client/` directory:

```env
NEXT_PUBLIC_CHAIN_ID=421614
NEXT_PUBLIC_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
```

### TEE Agents

Configuration is managed via `iapp.config.json` in each TEE directory.

## 🛠️ Technology Stack

### Frontend
- **Next.js** - React framework
- **Wagmi/Viem** - Web3 interactions
- **TailwindCSS** - Styling
- **Vercel** - Hosting

### Backend (TEE)
- **iExec** - Decentralized cloud computing
- **Python 3.9** - Runtime environment
- **ONNX Runtime** - ML inference
- **Pandas/NumPy** - Data processing

### Blockchain
- **Arbitrum Sepolia** - L2 testnet
- **Solidity** - Smart contracts

## 📊 How It Works

1. **Market Monitoring** - Shift-Agent-TEE continuously fetches market data from Binance API
2. **Volatility Prediction** - The ONNX model processes historical price data to forecast volatility
3. **Decision Making** - Shift-TEE compares predicted metrics against user-defined parameters
4. **Execution** - If rebalancing conditions are met, the agent executes position adjustments
5. **Verification** - All operations run in TEE for verifiable, secure computation

## 🔒 Protected Data Address

The following protected data structure should be submitted to iExec for secure TEE execution:

```json
{
  "privateKey": "yourprivatekey",
  "providerUrl": "https://your/rpc",
  "chainId": 421614,
  "nftManagerAddress": "",
  "tokenAAddress": "",
  "tokenBAddress": "",
  "poolAddress": ""
}
```
## 🧪 Testing & Sample Data

### Sample Protected Data Address
`0xBEbC90aD4498fB473467e4947ab3C6E89FA07F6e`

### Sample App Address
`0x7d7876B63b744ECB663b6E0826c7e0F56AAB7d36`

## 🎯 Roadmap

### Current Development

- [ ] Improve UI/UX design
- [ ] Connect Shift-Agent-TEE to Shift-TEE
- [ ] Enhanced parameter customization
- [ ] Multi-pair support

### Future Plans

- [ ] Mainnet deployment
- [ ] Advanced ML models (sentiment analysis, momentum indicators)
- [ ] Gas optimization strategies
- [ ] TEE inference integration
- [ ] Risk management dashboard

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Live Demo:** [https://shift-black.vercel.app/](https://shift-black.vercel.app/)
- **GitHub:** [https://github.com/Kagwep/shift](https://github.com/Kagwep/shift)
- **iExec Documentation:** [https://docs.iex.ec/](https://docs.iex.ec/)
- **Arbitrum Sepolia:** [https://sepolia.arbiscan.io/](https://sepolia.arbiscan.io/)

## 💬 Support

For questions and support, please open an issue on GitHub or reach out to the maintainers.

---
