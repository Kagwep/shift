import { IExecDataProtector } from '@iexec/dataprotector';
import { Wallet } from 'ethers';

// Get from .env.local
const IAPP_ADDRESS = process.env.NEXT_PUBLIC_IAPP_ADDRESS || '0xBB0dAc8bf20068162B20f4F2C6806F0D64cd9D73';
const CHAIN_ID = 421614; // Arbitrum Sepolia

// Arbitrum Sepolia addresses
const CONTRACT_ADDRESSES = {
  421614: { // Arbitrum Sepolia
    nftManager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    uni: "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0",
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    weth: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  }
};

// Types
export interface ProtectedDataConfig {
  privateKey: string;
  providerUrl?: string;
  chainId?: number;
  nftManagerAddress?: string;
  tokenAAddress?: string;
  tokenBAddress?: string;
  poolAddress?: string;
}

export interface ExecutionResult {
  success: boolean;
  taskId?: string;
  dealId?: string;
  protectedData?: string;
  status: string;
  error?: string;
}

export interface TaskStatus {
  status: number;
  statusName: string;
  dealId: string;
  finalDeadline: number | string;
  isTimedOut: boolean;
}

export interface TaskResult {
  success: boolean;
  score?: number;
  details?: any;
  error?: string;
}

export interface WalletBalance {
  address: string;
  ether: string;
  rlc: string;
  network: string;
}

// Helper for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize data protector with wallet
export const initDataProtector = (privateKey: string) => {
  try {
    if (!privateKey) {
      throw new Error('Private key is required');
    }

    const wallet = new Wallet(privateKey);
    const dataProtector = new IExecDataProtector(wallet);

    console.log('✅ Data protector initialized with wallet:', wallet.address);
    
    return {
      dataProtector,
      wallet,
      walletAddress: wallet.address,
    };
  } catch (error) {
    console.error('❌ Failed to initialize data protector:', error);
    throw error;
  }
};

// Create protected data for rebalancer
export async function createProtectedData(
  walletProvider: any,
  config: ProtectedDataConfig,
  onStatusUpdate?: (status: string) => void
) {
  try {
    const dataProtector = new IExecDataProtector(walletProvider);
    
    const chainId = config.chainId || CHAIN_ID;
    const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    
    if (!addresses) {
      throw new Error(`No addresses configured for chain ${chainId}`);
    }

    console.log('Step 1: Creating protected data for Arbitrum Sepolia...');
    if (onStatusUpdate) onStatusUpdate('Encrypting configuration...');
    
    const protectedData = await dataProtector.core.protectData({
      name: `rebalancer-config-${Date.now()}`,
      data: {
        privateKey: config.privateKey,
        providerUrl: config.providerUrl || 'https://sepolia-rollup.arbitrum.io/rpc',
        chainId: chainId.toString(),
        nftManagerAddress: config.nftManagerAddress || addresses.nftManager,
        tokenAAddress: config.tokenAAddress || addresses.uni,
        tokenBAddress: config.tokenBAddress || addresses.usdc,
        poolAddress: config.poolAddress || '',
      },
      onStatusUpdate: ({ title, isDone }) => {
        console.log(`  ${title}: ${isDone ? '✅' : '⏳'}`);
        if (onStatusUpdate) onStatusUpdate(`${title}...`);
      }
    });

    console.log('✅ Protected data created:', protectedData.address);
    if (onStatusUpdate) onStatusUpdate('Protected data created');

    const signer = await walletProvider.getSigner();
    const userAddress = await signer.getAddress();

    console.log('Step 2: Granting access to iApp...');
    if (onStatusUpdate) onStatusUpdate('Granting access to app...');
    
    await dataProtector.core.grantAccess({
      protectedData: protectedData.address,
      authorizedApp: IAPP_ADDRESS,
      authorizedUser: userAddress,
      numberOfAccess: 1
    });

    console.log('✅ Access granted');
    if (onStatusUpdate) onStatusUpdate('Access granted');

    return protectedData;
  } catch (error: any) {
    console.error('❌ Failed to create protected data:', error);
    throw error;
  }
}

// Execute rebalance task
export async function executeRebalance(
  walletProvider: any,
  protectedDataAddress: string,
  args: string,
  onStatusUpdate?: (status: string) => void
): Promise<ExecutionResult> {
  try {
    const dataProtector = new IExecDataProtector(walletProvider);
    
    await delay(3000);

    console.log('Step 3: Executing rebalance in TEE...');
    if (onStatusUpdate) onStatusUpdate('Starting TEE execution...');
    
    const result = await dataProtector.core.processProtectedData({
      protectedData: protectedDataAddress,
      app: IAPP_ADDRESS,
      maxPrice: 100000000,
      workerpoolMaxPrice: 100000000,
      category: 0,
      params: {
        iexec_args: args,
      },
      onStatusUpdate: ({ title, isDone, payload }) => {
        console.log(`  ${title}: ${isDone ? '✅' : '⏳'}`, payload);
        if (onStatusUpdate && payload?.taskId) {
          onStatusUpdate(`${title}... Task: ${payload.taskId.slice(0, 8)}...`);
        }
      }
    });

    console.log('✅ Task submitted!');
    console.log('   Task ID:', result.taskId);
    console.log('   Deal ID:', result.dealId);
    
    if (onStatusUpdate) {
      onStatusUpdate(`Task ${result.taskId?.slice(0, 8)}... running in TEE`);
    }

    return {
      success: true,
      taskId: result.taskId,
      dealId: result.dealId,
      protectedData: protectedDataAddress,
      status: 'processing'
    };
    
  } catch (error: any) {
    console.error('❌ Full error:', error);
    
    let errorMessage = error.message || 'Unknown error';
    
    if (error.code === 4001) {
      errorMessage = 'Transaction rejected by user';
    } else if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient ETH for gas. Get Arbitrum Sepolia ETH from faucet';
    } else if (error.message?.includes('Internal JSON-RPC error')) {
      errorMessage = 'Transaction failed. Check your ETH balance and try again.';
    }
    
    return {
      success: false,
      status: 'failed',
      error: errorMessage
    };
  }
}

// Check task status
export async function checkTaskStatus(
  taskId: string, 
  walletProvider: any
): Promise<TaskStatus> {
  try {
    const { IExec } = await import('iexec');
    const iexec = new IExec({ ethProvider: walletProvider });
    
    const task = await iexec.task.show(taskId);
    
    const statusName = task.status === 1 ? 'ACTIVE' : 
                      task.status === 2 ? 'COMPLETED' : 
                      task.status === 3 ? 'FAILED' : 'UNKNOWN';
    
    return {
      status: task.status,
      statusName,
      dealId: task.dealid,
      finalDeadline: Number(task.finalDeadline),
      isTimedOut: task.taskTimedOut
    };
  } catch (error) {
    console.error('Error checking task status:', error);
    throw error;
  }
}

// Get task result
export async function getTaskResult(
  taskId: string, 
  walletProvider: any, 
  onStatusUpdate?: (status: string) => void
): Promise<TaskResult> {
  try {
    const dataProtector = new IExecDataProtector(walletProvider);
    
    console.log('Step 4: Fetching task result...');
    if (onStatusUpdate) onStatusUpdate('Fetching result...');
    
    const taskResult = await dataProtector.core.getResultFromCompletedTask({ 
      taskId: taskId
    });
    
    console.log('✅ Task completed!');
    if (onStatusUpdate) onStatusUpdate('Task completed! Parsing result...');
    
    const decoder = new TextDecoder();
    const resultString = decoder.decode(taskResult.result);
    const resultData = JSON.parse(resultString);
    
    console.log('✅ Rebalance result:', resultData);
    
    return {
      success: resultData.success || false,
      details: resultData,
      score: resultData.score
    };
    
  } catch (error: any) {
    console.error('❌ Error fetching result:', error);
    
    if (error.message?.includes('timeout') || error.message?.includes('Task not completed')) {
      throw new Error('Task is still running. Please wait a few more minutes.');
    }
    
    return {
      success: false,
      error: error.message || 'Failed to fetch result'
    };
  }
}

// Get wallet balance
export async function getWalletBalance(walletProvider: any): Promise<WalletBalance> {
  try {
    const { IExec } = await import('iexec');
    const iexec = new IExec({ ethProvider: walletProvider });
    
    const signer = await walletProvider.getSigner();
    const address = await signer.getAddress();
    
    const etherBalance = await signer.provider?.getBalance(address) || '0';
    const rlcBalance = await iexec.wallet.checkBalances(address);
    
    return {
      address,
      ether: etherBalance.toString(),
      rlc: rlcBalance?.nRLC?.toString() || '0', // FIXED: Use nRLC
      network: 'Arbitrum Sepolia',
    };
  } catch (error) {
    console.error('❌ Failed to get wallet balance:', error);
    throw error;
  }
}

// Format RLC amount
export const formatRLC = (amount: string): string => {
  if (!amount) return '0';
  const nRLC = parseFloat(amount);
  return (nRLC / 10 ** 9).toFixed(4); // Convert nRLC to RLC (9 decimals)
};

// Get explorer URLs
export const getExplorerUrls = (dealId: string, taskId: string) => ({
  deal: `https://explorer.iex.ec/arbitrum-sepolia-testnet/deal/${dealId}`,
  task: `https://explorer.iex.ec/arbitrum-sepolia-testnet/task/${taskId}`,
});

// Format error message
export const formatErrorMessage = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};