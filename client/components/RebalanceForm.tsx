'use client';
import { BrowserProvider, Wallet } from 'ethers';
import React, { useState } from 'react';
import {
  initDataProtector,
  createProtectedData,
  executeRebalance,
  getWalletBalance,
  formatRLC,
  ProtectedDataConfig,
} from '../lib/iexec';

interface RebalanceFormProps {
  onTaskCreated?: (taskId: string) => void;
  onError?: (error: string) => void;
}

const TOKEN_PAIRS = [
  { value: 'LINKUSDT', label: 'LINK/USDT' },
  { value: 'UNIUSDC', label: 'UNI/USDC' },
  { value: 'UNIWETH', label: 'UNI/WETH' },
];

const ACTIONS = [
  { value: 'auto_optimize', label: 'Auto Optimize', icon: '🤖' },
  { value: 'reduce_exposure', label: 'Reduce Exposure', icon: '📉' },
  { value: 'increase_exposure', label: 'Increase Exposure', icon: '📈' },
  { value: 'exit_position', label: 'Exit Position', icon: '🚪' },
];

const THRESHOLDS = [
  { value: 'low', label: 'Low', percent: '2%', color: 'green' },
  { value: 'moderate', label: 'Moderate', percent: '5%', color: 'yellow' },
  { value: 'high', label: 'High', percent: '10%', color: 'orange' },
  { value: 'extreme', label: 'Extreme', percent: '20%', color: 'red' },
];

const DEFAULT_POOL_ADDRESSES = {
  UNIUSDC: '',
  UNIWETH: '',
  LINKUSDT: '',
};

export default function RebalanceForm({ onTaskCreated, onError }: RebalanceFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    userPrivateKey: '',
    positionPrivateKey: '',
    positionProviderUrl: 'https://sepolia.infura.io/v3/993eac9c4c004999bdbe646a50c8b009',
    positionChainId: '421614',
    tokenPair: 'UNIUSDC',
    action: 'auto_optimize',
    threshold: 'moderate',
    poolAddress: '',
    nftManagerAddress: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    tokenAAddress: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
    tokenBAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  });

  const [walletInfo, setWalletInfo] = useState<{
    address: string;
    ether: string;
    rlc: string;
    network: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'tokenPair' && {
        tokenAAddress: value === 'UNIWETH' 
          ? '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0'
          : '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
        tokenBAddress: value === 'UNIWETH'
          ? '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
          : '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        poolAddress: DEFAULT_POOL_ADDRESSES[value as keyof typeof DEFAULT_POOL_ADDRESSES] || '',
      }),
    }));
  };

  const checkWallet = async () => {
    try {
      setError(null);
      if (!formData.userPrivateKey) {
        throw new Error('Enter your wallet private key to check balance');
      }
      
      const wallet = {
        getSigner: async () => ({
          getAddress: () => formData.userPrivateKey ? new Wallet(formData.userPrivateKey).address : '',
          provider: {
            getBalance: async () => ({ toString: () => '0' })
          }
        })
      };
      
      const balance = await getWalletBalance(wallet as any);
      
      setWalletInfo({
        address: balance.address,
        ether: balance.ether,
        rlc: balance.rlc,
        network: balance.network,
      });
      
      setSuccess(`Wallet connected: ${balance.address.slice(0, 10)}...`);
    } catch (err: any) {
      setError(err.message || 'Failed to check wallet');
      onError?.(err.message);
    }
  };

  const executeRebalancer = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setTaskId(null);

      if (!formData.userPrivateKey) {
        throw new Error('User private key is required');
      }
      if (!formData.positionPrivateKey) {
        throw new Error('Position private key is required (will be encrypted)');
      }
      if (!formData.poolAddress) {
        throw new Error('Pool address is required. Find or create a Uniswap V3 pool on Arbitrum Sepolia.');
      }

      const walletProvider = new BrowserProvider((window as any).ethereum);

      const protectedDataConfig: ProtectedDataConfig = {
        privateKey: formData.positionPrivateKey,
        providerUrl: formData.positionProviderUrl,
        chainId: parseInt(formData.positionChainId),
        nftManagerAddress: formData.nftManagerAddress,
        tokenAAddress: formData.tokenAAddress,
        tokenBAddress: formData.tokenBAddress,
        poolAddress: formData.poolAddress,
      };

      // const protectedData = await createProtectedData(
      //   walletProvider as any,
      //   protectedDataConfig,
        
      //   (status) => console.log('Status:', status)
      // );

      const args = `${formData.tokenPair} ${formData.action} ${formData.threshold}`;
      
      const result = await executeRebalance(
        walletProvider as any,
        "0x5dc1d957076C5F38b7c3444bd9Fa3c5a4fE57591",
        args,
        (status) => console.log('Task status:', status)
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to execute task');
      }

      setTaskId(result.taskId || null);
      setSuccess(`✅ Task submitted! Task ID: ${result.taskId?.slice(0, 20)}...`);
      
      if (result.taskId) {
        onTaskCreated?.(result.taskId);
      }

      const balance = await getWalletBalance(walletProvider as any);
      setWalletInfo({
        address: balance.address,
        ether: balance.ether,
        rlc: balance.rlc,
        network: balance.network,
      });
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to execute rebalance';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🚀</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Uniswap V3 TEE Rebalancer
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Execute volatility-based rebalancing in a Trusted Execution Environment
              </p>
            </div>
          </div>
          <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
            Arbitrum Sepolia
          </span>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-red-600 dark:text-red-400">❌</span>
              <p className="text-sm text-red-800 dark:text-red-200 flex-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✅</span>
              <p className="text-sm text-green-800 dark:text-green-200 flex-1">{success}</p>
            </div>
          </div>
        )}

        {taskId && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
              <div className="flex-1">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">Task ID: {taskId}</p>
                <a 
                  href={`https://explorer.iex.ec/arbitrum-sepolia-testnet/task/${taskId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View on iExec Explorer →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Network Info */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-2">
            <span className="text-slate-600 dark:text-slate-400">🌐</span>
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <p className="font-medium mb-1">Network: Arbitrum Sepolia (Chain ID: 421614)</p>
              <p className="text-xs">Requirements: ETH for gas + RLC for task execution</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Configuration */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">👛</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Wallet Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Your Private Key *
            </label>
            <input
              type="password"
              name="userPrivateKey"
              value={formData.userPrivateKey}
              onChange={handleInputChange}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Used to pay for task execution</p>
          </div>

          <div className="flex items-end">
            <button
              onClick={checkWallet}
              disabled={!formData.userPrivateKey}
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Check Wallet Balance
            </button>
          </div>
        </div>

        {walletInfo && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-medium">Network</p>
                <p className="text-blue-900 dark:text-blue-100">{walletInfo.network}</p>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-medium">Address</p>
                <p className="text-blue-900 dark:text-blue-100 font-mono text-xs">{walletInfo.address}</p>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-medium">ETH Balance</p>
                <p className="text-blue-900 dark:text-blue-100">{(parseInt(walletInfo.ether) / 1e18).toFixed(4)} ETH</p>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-medium">RLC Balance</p>
                <p className="text-blue-900 dark:text-blue-100">{formatRLC(walletInfo.rlc)} RLC</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Protected Data Configuration */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🔐</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Position Configuration</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          This private key will be encrypted and only decrypted inside the TEE
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Position Private Key *
            </label>
            <input
              type="password"
              name="positionPrivateKey"
              value={formData.positionPrivateKey}
              onChange={handleInputChange}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Private key for Uniswap operations (encrypted)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Provider URL
            </label>
            <input
              type="text"
              name="positionProviderUrl"
              value={formData.positionProviderUrl}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Arbitrum Sepolia RPC endpoint</p>
          </div>
        </div>
      </div>

      {/* Strategy Configuration */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">⚙️</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Rebalancing Strategy</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Token Pair */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Token Pair
            </label>
            <select
              value={formData.tokenPair}
              onChange={(e) => handleSelectChange('tokenPair', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
            >
              {TOKEN_PAIRS.map(pair => (
                <option key={pair.value} value={pair.value}>{pair.label}</option>
              ))}
            </select>
          </div>

          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Action
            </label>
            <select
              value={formData.action}
              onChange={(e) => handleSelectChange('action', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
            >
              {ACTIONS.map(action => (
                <option key={action.value} value={action.value}>
                  {action.icon} {action.label}
                </option>
              ))}
            </select>
          </div>

          {/* Threshold */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Volatility Threshold
            </label>
            <select
              value={formData.threshold}
              onChange={(e) => handleSelectChange('threshold', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
            >
              {THRESHOLDS.map(threshold => (
                <option key={threshold.value} value={threshold.value}>
                  {threshold.label} ({threshold.percent})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pool Address */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Pool Address *
          </label>
          <div className="mb-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              ⚠️ You must provide a real Uniswap V3 pool address on Arbitrum Sepolia
            </p>
          </div>
          <input
            type="text"
            name="poolAddress"
            value={formData.poolAddress}
            onChange={handleInputChange}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Find or create a Uniswap V3 pool</p>
        </div>
      </div>

      {/* Advanced Options */}
      <details className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 mb-6 border border-slate-200 dark:border-slate-700 group">
        <summary className="flex items-center gap-2 cursor-pointer list-none">
          <span className="text-2xl">⚙️</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Advanced Options</h3>
          <span className="ml-auto text-slate-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              NFT Manager Address
            </label>
            <input
              type="text"
              name="nftManagerAddress"
              value={formData.nftManagerAddress}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white text-sm font-mono"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Uniswap V3 Position Manager</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Token A Address
            </label>
            <input
              type="text"
              name="tokenAAddress"
              value={formData.tokenAAddress}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white text-sm font-mono"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">First token (e.g., UNI)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Token B Address
            </label>
            <input
              type="text"
              name="tokenBAddress"
              value={formData.tokenBAddress}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white text-sm font-mono"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Second token (e.g., USDC)</p>
          </div>
        </div>
      </details>

      {/* Execute Button */}
      <div className="flex justify-center">
        <button
          onClick={executeRebalancer}
          disabled={loading || !formData.userPrivateKey || !formData.positionPrivateKey || !formData.poolAddress}
          className="px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center gap-3"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <span className="text-2xl">🚀</span>
              Execute TEE Rebalance
            </>
          )}
        </button>
      </div>

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2">
            <span>🔒</span>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Security</p>
              <p className="text-xs">Position private key encrypted in TEE</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span>📍</span>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Network</p>
              <p className="text-xs">All operations on Arbitrum Sepolia testnet</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span>⏱️</span>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Processing Time</p>
              <p className="text-xs">TEE tasks take 1-5 minutes</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span>⚠️</span>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Important</p>
              <p className="text-xs">Real Uniswap V3 pool address required</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}