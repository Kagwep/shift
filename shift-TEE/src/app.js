import fs from 'node:fs/promises';
import path from 'path';
import { UniswapPositionManager } from "./UniswapPositionManager.js";
import { VolatilityPredictionAction } from "./predict.js";
import { rebalance } from "./rebalancer.js";
import { ADDRESSES } from "./utils/tokens.js";
import { IExecDataProtectorDeserializer } from '@iexec/dataprotector-deserializer';

const main = async () => {
  const { IEXEC_OUT, IEXEC_IN, IEXEC_DATASET_FILENAME } = process.env;
  let computedJsonObj = {};
  
  try {
    console.log('🚀 Starting Uniswap Rebalancer iApp');
    
    // ==========================================
    // 1. Get PUBLIC ARGS (from command line)
    // ==========================================
    // User runs: iexec app run --args "LINKUSDT auto_optimize moderate 0x287B..."
    const args = process.argv.slice(2);
    
    const tokenPair = args[0] || 'LINKUSDT';
    const action = args[1] || 'auto_optimize';
    const volatilityThreshold = args[2] || 'moderate';
    const poolAddress = args[3] || '0x287B0e934ed0439E2a7b1d5F0FC25eA2c24b64f7';
    
    console.log(`📊 Config from args:`);
    console.log(`   Token Pair: ${tokenPair}`);
    console.log(`   Action: ${action}`);
    console.log(`   Threshold: ${volatilityThreshold}`);
    console.log(`   Pool: ${poolAddress}`);
    
    // ==========================================
    // 2. Get PRIVATE KEY from PROTECTED DATA
    // ==========================================
    // Protected data is decrypted and available as files in IEXEC_IN
    let privateKey;
    let providerUrl;
    let chainId;
    const dataPath = path.join(IEXEC_IN, IEXEC_DATASET_FILENAME);
    const deserializer = new IExecDataProtectorDeserializer(
      {
        protectedDataPath: dataPath 
    }
    );

    try {
      // const dataPath = path.join(IEXEC_IN, IEXEC_DATASET_FILENAME);
      // const protectedData = JSON.parse(await fs.readFile(dataPath, 'utf8'));
      
      
        privateKey = await deserializer.getValue("privateKey", "string");
        providerUrl = await deserializer.getValue("providerUrl", "string");
        chainId = Number(await deserializer.getValue("chainId", "string"))
      
      console.log('✅ Protected data loaded');
      console.log(`🔗 Chain ID: ${chainId}`);
    } catch (error) {
      throw new Error(`Failed to load protected data: ${error.message}`);
    }
    
    // ==========================================
    // 3. Get VOLATILITY PREDICTION
    // ==========================================
    const predictor = new VolatilityPredictionAction();
    const prediction = await predictor.fetchVolatilityPrediction(tokenPair, 15);
    
    const currentVolatility = prediction.prediction.predicted_volatility_5d;
    console.log(`📈 Current volatility: ${currentVolatility.toFixed(2)}%`);
    console.log(`📊 Risk level: ${prediction.prediction.volatility_level}`);
    
    // ==========================================
    // 4. CHECK IF REBALANCING NEEDED
    // ==========================================
    const thresholdValue = getThreshold(volatilityThreshold);
    
    if (currentVolatility < thresholdValue && action !== 'exit_position') {
      console.log(`ℹ️  No rebalancing needed (${currentVolatility.toFixed(2)}% < ${thresholdValue}%)`);
      
      const result = {
        success: true,
        rebalanceNeeded: false,
        reason: `Volatility (${currentVolatility.toFixed(2)}%) below threshold (${thresholdValue}%)`,
        volatility: {
          current: currentVolatility,
          threshold: thresholdValue,
          level: prediction.prediction.volatility_level
        },
        timestamp: new Date().toISOString()
      };
      
      await fs.writeFile(
        `${IEXEC_OUT}/result.json`,
        JSON.stringify(result, null, 2)
      );
      
      computedJsonObj = {
        'deterministic-output-path': `${IEXEC_OUT}/result.json`,
      };
      
      await fs.writeFile(
        `${IEXEC_OUT}/computed.json`,
        JSON.stringify(computedJsonObj)
      );
      
      return;
    }
    
    // ==========================================
    // 5. EXECUTE REBALANCE
    // ==========================================
    console.log(`🔄 Volatility above threshold - executing rebalance...`);
    
    // Initialize position manager with private key from protected data
    const positionManager = new UniswapPositionManager({
      privateKey,
      providerUrl
    });
    
    const walletAddress = positionManager.getAddress();
    console.log(`👛 Wallet: ${walletAddress}`);
    
    // Get contract addresses
    const addresses = getContractAddresses(chainId, tokenPair, poolAddress);
    
    // Calculate position amounts based on volatility
    const amounts = calculateAmounts(action, currentVolatility);
    
    console.log(`💰 Position amounts:`);
    console.log(`   Token A: ${amounts.tokenA_amount.toString()}`);
    console.log(`   Token B: ${amounts.tokenB_amount.toString()}`);

    console.log(prediction)
    
    // Prepare rebalance parameters
    const rebalanceParams = {
      tokenA_amount: amounts.tokenA_amount,
      tokenB_amount: amounts.tokenB_amount,
      realized_vol: prediction.prediction.features.realized_vol,
      predictionResponse: prediction,
      confidenceMultiplier: 1.96
    };
    
    // Execute rebalance
    const result = await rebalance(positionManager, addresses, rebalanceParams);
    
    console.log(`✅ Rebalance ${result.success ? 'completed' : 'failed'}!`);
    if (result.closedPositions?.length > 0) {
      console.log(`🔄 Closed positions: ${result.closedPositions.join(', ')}`);
    }
    if (result.newPositionTx) {
      console.log(`📝 New position tx: ${result.newPositionTx.hash}`);
    }
    
    // ==========================================
    // 6. WRITE RESULTS
    // ==========================================
    const output = {
      success: result.success,
      wallet: walletAddress,
      config: {
        tokenPair,
        action,
        volatilityThreshold,
        poolAddress
      },
      volatility: {
        current: currentVolatility,
        threshold: thresholdValue,
        level: prediction.prediction.volatility_level,
        annualized: prediction.prediction.annualized_volatility
      },
      rebalance: {
        closedPositions: result.closedPositions?.map(p => p.toString()) || [],
        newPositionTx: result.newPositionTx?.hash || null,
        tickRange: result.tickRange || null,
        message: result.message || 'Success'
      },
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(
      `${IEXEC_OUT}/rebalance-result.json`,
      JSON.stringify(output, null, 2)
    );
    
    // Also create a human-readable report
    const report = formatReport(output);
    await fs.writeFile(
      `${IEXEC_OUT}/rebalance-report.txt`,
      report
    );
    
    computedJsonObj = {
      'deterministic-output-path': `${IEXEC_OUT}/rebalance-result.json`,
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    const errorOutput = {
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(
      `${IEXEC_OUT}/error.json`,
      JSON.stringify(errorOutput, null, 2)
    );
    
    computedJsonObj = {
      'deterministic-output-path': `${IEXEC_OUT}/error.json`,
      'error-message': error.message
    };
    
  } finally {
    await fs.writeFile(
      `${IEXEC_OUT}/computed.json`,
      JSON.stringify(computedJsonObj)
    );
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getContractAddresses(chainId, tokenPair, poolAddress) {
    const getTokenAddresses = (pair) => {
        switch (pair.toUpperCase()) {
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
        pool: poolAddress
    };
}

function getThreshold(level) {
    const thresholds = {
        'low': 2.0,
        'moderate': 2.5,
        'high': 10.0,
        'extreme': 20.0
    };
    return thresholds[level.toLowerCase()] || 5.0;
}

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
            return { tokenA_amount: BigInt(0), tokenB_amount: BigInt(0) };
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
            }
            return { tokenA_amount: baseUNI, tokenB_amount: baseWETH };
    }
}

function formatReport(output) {
    return `
═══════════════════════════════════════════════════════════
  UNISWAP V3 POSITION REBALANCE REPORT
═══════════════════════════════════════════════════════════

Timestamp: ${output.timestamp}
Wallet: ${output.wallet}
Success: ${output.success ? '✅ YES' : '❌ NO'}

CONFIGURATION
-------------------------------------------------------------------
Token Pair: ${output.config.tokenPair}
Action: ${output.config.action}
Volatility Threshold: ${output.config.volatilityThreshold}
Pool Address: ${output.config.poolAddress}

VOLATILITY ANALYSIS
-------------------------------------------------------------------
Current Volatility: ${output.volatility.current.toFixed(2)}%
Threshold: ${output.volatility.threshold.toFixed(2)}%
Risk Level: ${output.volatility.level}
Annualized: ${output.volatility.annualized.toFixed(2)}%

REBALANCE RESULTS
-------------------------------------------------------------------
Closed Positions: ${output.rebalance.closedPositions.join(', ') || 'None'}
New Position TX: ${output.rebalance.newPositionTx || 'N/A'}
Tick Range: ${output.rebalance.tickRange ? `${output.rebalance.tickRange[0]} to ${output.rebalance.tickRange[1]}` : 'N/A'}
Message: ${output.rebalance.message}

═══════════════════════════════════════════════════════════
`;
}

main();