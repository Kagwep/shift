import { ethers } from "ethers";
import { initUniswapPositionManager } from "./UniswapPositionManager.js";
import { getTickRange } from "./utils/index.js";




/**
 * Calculate dec_price_change from realized_vol
 * This is a placeholder - you'll need to implement the actual calculation
 * based on your specific requirements
 */
function calculateDecPriceChange(realized_vol) {
    // TODO: Implement your specific calculation for dec_price_change
    // This might involve historical price data, time periods, etc.
    // For now, returning a placeholder
    return realized_vol * 0.5; // Replace with actual calculation
}

/**
 * Get current pool tick from pool contract
 */
async function getCurrentTick(poolContract) {
    const slot0 = await poolContract.slot0();
    return slot0.tick;
}

/**
 * Main rebalance function
 */
export async function rebalance(
    positionManager,
    addressess,
    params
) {
    const {
        tokenA_amount,
        tokenB_amount,
        realized_vol,
        predictionResponse,
        nft_id,
        userAddress,
        confidenceMultiplier = 1.96
    } = params;

    const logger = console; // Replace with your logger
    const user_address = userAddress || positionManager.getAddress();
    const pool_fee = 3000;

    try {
        logger.log("Starting rebalance process...");

        // Check if prediction was successful
        if (!predictionResponse.success) {
            throw new Error(`Prediction failed: ${predictionResponse.message}`);
        }

        // Calculate dec_price_change (you'll need to implement this)
        const dec_price_change = calculateDecPriceChange(realized_vol);
        logger.log(`Input data - realized_vol: ${realized_vol}, dec_price_change: ${dec_price_change}`);

        // Get predicted volatility from response
        const predicted_volatility_5d = predictionResponse.prediction.predicted_volatility_5d;
        logger.log(`Predicted 5-day volatility: ${predicted_volatility_5d}`);

        // Create pool contract to get current tick
        const poolContract = new ethers.Contract(
            addresses.pool,
            [
                "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
            ],
            positionManager.wallet
        );

        // Close existing positions
        let positionsToClose;
        if (nft_id !== undefined) {
            positionsToClose = [nft_id];
        } else {
            const allPositions = await positionManager.getAllUserPositions();
            if (allPositions.length === 0) {
                throw new Error("No positions found to close");
            }
            // Get the highest NFT ID (most recent position)
            positionsToClose = [allPositions[allPositions.length - 1]];
        }

        logger.log(`Closing positions: ${positionsToClose}`);
        
        for (const nftId of positionsToClose) {
            await positionManager.closePosition(nftId);
            logger.log(`Closed position ${nftId}`);
        }

        // Get current tick
        const curr_tick = await getCurrentTick(poolContract);
        logger.log(`Current tick: ${curr_tick}`);

        // Get token decimals
        const tokenAContract = new ethers.Contract(
            addresses.tokenA,
            ["function decimals() view returns (uint8)"],
            positionManager.wallet
        );
        const tokenBContract = new ethers.Contract(
            addresses.tokenB,
            ["function decimals() view returns (uint8)"],
            positionManager.wallet
        );

        const tokenA_decimals = await tokenAContract.decimals();
        const tokenB_decimals = await tokenBContract.decimals();

        // Convert predicted volatility to decimal percentage with confidence interval
        const predicted_value = (predicted_volatility_5d / 100) * confidenceMultiplier;
        logger.log(`Converted predicted value (decimal %): ${predicted_value}`);

        // Calculate tick range
        const [lower_tick, upper_tick] = getTickRange(
            curr_tick,
            predicted_value,
            tokenA_decimals,
            tokenB_decimals,
            pool_fee
        );

        logger.log(`Tick range: ${lower_tick} to ${upper_tick}`);

        // Create mint parameters
        const mint_params = positionManager.getMintParams(
            addresses.tokenA,
            addresses.tokenB,
            tokenA_amount,
            tokenB_amount,
            pool_fee,
            lower_tick,
            upper_tick
        );

        // Mint new position
        logger.log("Minting new position...");
        const newPositionTx = await positionManager.mintPosition(mint_params);
        await newPositionTx.wait();
        
        logger.log("SUCCESSFULLY MINTED A POSITION");
        logger.log(`Transaction hash: ${newPositionTx.hash}`);

        return {
            success: true,
            message: "Rebalance completed successfully",
            closedPositions: positionsToClose,
            newPositionTx,
            predictedVolatility: predicted_volatility_5d,
            tickRange: [lower_tick, upper_tick],
            contractResult: newPositionTx
        };

    } catch (error) {
        logger.error("Rebalance failed:", error);
        return {
            success: false,
            message: `Rebalance failed: ${error}`,
            closedPositions: [],
            predictedVolatility: predictionResponse.prediction.predicted_volatility_5d,
            tickRange: [0, 0]
        };
    }
}

/**
 * Convenience function that initializes position manager and calls rebalance
 */
export async function rebalanceWithRuntime(
    config, // Your IAgentRuntime type
    addresses,
    params
) {
    const positionManager = await initUniswapPositionManager(config);
    return await rebalance(positionManager, addresses, params);
}
