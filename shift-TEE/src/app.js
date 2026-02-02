import fs from 'node:fs/promises';
import figlet from 'figlet';
import { IExecDataProtectorDeserializer } from '@iexec/dataprotector-deserializer';

const main = async () => {
  const { IEXEC_OUT } = process.env;

  let computedJsonObj = {};

  try {
    let messages = [];

    // Example of process.argv:
    // [ '/usr/local/bin/node', '/app/src/app.js', 'Bob' ]
    const args = process.argv.slice(2);
    console.log(`Received ${args.length} args`);
    messages.push(args.join(' '));

    try {
      const deserializer = new IExecDataProtectorDeserializer();
      // The protected data mock created for the purpose of this Hello World journey
      // contains an object with a key "secretText" which is a string
      const protectedText = await deserializer.getValue('secretText', 'string');
      console.log('Found a protected data');
      messages.push(protectedText);
    } catch (e) {
      console.log('It seems there is an issue with your protected data:', e);
    }

    // Transform input text into an ASCII Art text
    const asciiArtText = figlet.textSync(
      `Hello, ${messages.join(' ') || 'World'}!`
    );

    // Write result to IEXEC_OUT
    await fs.writeFile(`${IEXEC_OUT}/result.txt`, asciiArtText);

    // Build the "computed.json" object
    computedJsonObj = {
      'deterministic-output-path': `${IEXEC_OUT}/result.txt`,
    };
  } catch (e) {
    // Handle errors
    console.log(e);

    // Build the "computed.json" object with an error message
    computedJsonObj = {
      'deterministic-output-path': IEXEC_OUT,
      'error-message': 'Oops something went wrong',
    };
  } finally {
    // Save the "computed.json" file
    await fs.writeFile(
      `${IEXEC_OUT}/computed.json`,
      JSON.stringify(computedJsonObj)
    );
  }
};

main();


// here we want to use the rebalncer or prediction lets first start with rebalncer

// to use it in nrmal usage should be something like 

// Simple example - no agent, just direct usage

import { ethers } from "ethers";
import { UniswapV3PositionManager } from "./UniswapV3PositionManager";
import { VolatilityPredictionAction } from "./VolatilityPredictionAction";
import { rebalance } from "./rebalancer";
import { ADDRESSES } from "./addresses"; // or wherever your ADDRESSES object is

async function simpleRebalance() {
    // 1. Your inputs (what you want)
    const config = {
        privateKey: "0x...",
        providerUrl: "https://eth-sepolia.g.alchemy.com/v2/YOUR-KEY",
        chainId: 11155111, // Sepolia
        tokenPair: "LINKUSDT",
        action: "auto_optimize",  // or 'reduce_exposure', 'increase_exposure', 'exit_position'
        volatilityThreshold: "moderate" // or 'low', 'high', 'extreme'
    };
    
    // 2. Get volatility prediction
    const predictor = new VolatilityPredictionAction();
    const prediction = await predictor.fetchVolatilityPrediction("LINKUSDT", 15);
    
    console.log("Current volatility:", prediction.prediction.predicted_volatility_5d);
    
    // 3. Check if we should rebalance
    const thresholdValue = getThreshold(config.volatilityThreshold);
    const currentVolatility = prediction.prediction.predicted_volatility_5d;
    
    if (currentVolatility < thresholdValue && config.action !== 'exit_position') {
        console.log(`No rebalancing needed (${currentVolatility}% < ${thresholdValue}%)`);
        return;
    }
    
    console.log(`Rebalancing needed! (${currentVolatility}% > ${thresholdValue}%)`);
    
    // 4. Initialize position manager
    const positionManager = new UniswapV3PositionManager({
        privateKey: config.privateKey,
        providerUrl: config.providerUrl
    });
    
    // 5. Get contract addresses from ADDRESSES
    const addresses = getContractAddresses(config.chainId, config.tokenPair);
    
    // 6. Calculate amounts based on volatility
    const amounts = calculateAmounts(config.action, currentVolatility);
    
    // 7. Execute rebalance
    const rebalanceParams = {
        tokenA_amount: amounts.tokenA_amount,
        tokenB_amount: amounts.tokenB_amount,
        realized_vol: prediction.prediction.features.realized_vol,
        predictionResponse: prediction,
        confidenceMultiplier: 1.96
    };
    
    const result = await rebalance(positionManager, addresses, rebalanceParams);
    
    console.log("Rebalance result:", result);
    console.log("Closed positions:", result.closedPositions);
    if (result.newPositionTx) {
        console.log("New position tx:", result.newPositionTx.hash);
    }
}

// Helper: Get contract addresses from ADDRESSES object
function getContractAddresses(chainId, tokenPair) {
    const getTokenAddresses = (pair) => {
        switch (pair.toUpperCase()) {
            case 'UNIUSDT':
            case 'LINKUSDT':
            case 'AAVEUSDT': 
            case 'SUSHIUSDT':
            case '1INCHUSDT':
                return {
                    tokenA: ADDRESSES.UNI[chainId],
                    tokenB: ADDRESSES.USDC[chainId],
                };
            case 'UNIWETH':
                return {
                    tokenA: ADDRESSES.UNI[chainId],
                    tokenB: ADDRESSES.WETH[chainId],
                };
            default:
                return {
                    tokenA: ADDRESSES.UNI[chainId],
                    tokenB: ADDRESSES.USDC[chainId],
                };
        }
    };
    
    const tokens = getTokenAddresses(tokenPair);
    
    return {
        nftManager: ADDRESSES.NonfungiblePositionManager[chainId],
        tokenA: tokens.tokenA,
        tokenB: tokens.tokenB,
        pool: "0x287B0e934ed0439E2a7b1d5F0FC25eA2c24b64f7" // Your existing pool address
    };
}

// Helper: Get threshold percentage
function getThreshold(level) {
    const thresholds = {
        'low': 2.0,
        'moderate': 5.0,
        'high': 10.0,
        'extreme': 20.0
    };
    return thresholds[level.toLowerCase()] || 5.0;
}

// Helper: Calculate position amounts
function calculateAmounts(action, volatility) {
    const baseUNI = BigInt("100000000000000");  // 0.0001 UNI
    const baseWETH = BigInt("1000000000000000"); // 0.001 WETH
    
    switch (action.toLowerCase()) {
        case 'reduce_exposure':
            const reduction = Math.min(volatility / 20, 0.5);
            return {
                tokenA_amount: baseUNI - (baseUNI * BigInt(Math.floor(reduction * 100)) / BigInt(100)),
                tokenB_amount: baseWETH - (baseWETH * BigInt(Math.floor(reduction * 100)) / BigInt(100))
            };
            
        case 'increase_exposure':
            const increase = Math.max(1.2, 2 - volatility / 10);
            return {
                tokenA_amount: baseUNI * BigInt(Math.floor(increase * 100)) / BigInt(100),
                tokenB_amount: baseWETH * BigInt(Math.floor(increase * 100)) / BigInt(100)
            };
            
        case 'exit_position':
            return {
                tokenA_amount: BigInt(0),
                tokenB_amount: BigInt(0)
            };
            
        default: // auto_optimize
            if (volatility > 15) {
                return {
                    tokenA_amount: baseUNI * BigInt(75) / BigInt(100),
                    tokenB_amount: baseWETH * BigInt(75) / BigInt(100)
                };
            } else if (volatility < 5) {
                return {
                    tokenA_amount: baseUNI * BigInt(125) / BigInt(100),
                    tokenB_amount: baseWETH * BigInt(125) / BigInt(100)
                };
            } else {
                return {
                    tokenA_amount: baseUNI,
                    tokenB_amount: baseWETH
                };
            }
    }
}

// Run it
simpleRebalance();