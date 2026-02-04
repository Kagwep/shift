'use client';

import { initDataProtectorClient } from '@/app/externals/dataProtectorClient';
import { useWalletConnection } from '@/app/hooks/useWalletConnectionts';
import { SUPPORTED_CHAINS } from '@/app/utils/utils';
import { useState, useEffect } from 'react';


interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}



export default function WalletConnectionModal({ isOpen, onClose }: WalletConnectionModalProps) {
  const { isConnected, address, chainId } = useWalletConnection();
  const [selectedChain, setSelectedChain] = useState(134); // Default to iExec Sidechain
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  const switchToChain = async (targetChainId: number) => {
    if (!(window as any).ethereum) {
      throw new Error('MetaMask not installed');
    }

    const chain = SUPPORTED_CHAINS.find((c) => c.id === targetChainId);
    if (!chain) {
      throw new Error(`Chain with ID ${targetChainId} not supported`);
    }

    const chainIdHex = `0x${targetChainId.toString(16)}`;

    try {
      setSwitching(true);
      setError(null);

      // Try to switch to the chain
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });

      // Reinitialize DataProtector client
      await initDataProtectorClient({
        provider: (window as any).ethereum,
        chainId: targetChainId,
      });

    } catch (switchError: any) {
      // If chain doesn't exist in MetaMask (error 4902), add it
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: chain.name,
                nativeCurrency: {
                  name: chain.tokenSymbol,
                  symbol: chain.tokenSymbol,
                  decimals: 18,
                },
                rpcUrls: chain.rpcUrls,
                blockExplorerUrls: [chain.blockExplorerUrl],
              },
            ],
          });

          // Reinitialize after adding
          await initDataProtectorClient({
            provider: (window as any).ethereum,
            chainId: targetChainId,
          });
        } catch (addError: any) {
          throw new Error(`Failed to add chain: ${addError.message}`);
        }
      } else {
        throw switchError;
      }
    } finally {
      setSwitching(false);
    }
  };

  const handleChainChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newChainId = Number(event.target.value);
    setSelectedChain(newChainId);

    if (isConnected) {
      try {
        await switchToChain(newChainId);
      } catch (err: any) {
        setError(err.message || 'Failed to switch chain');
      }
    }
  };

  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        // After connecting, switch to selected chain
        await switchToChain(selectedChain);
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    // Note: MetaMask doesn't have a programmatic disconnect
    // User needs to disconnect from MetaMask itself
    onClose();
  };

  const getChainName = (id: number | null) => {
    if (!id) return 'Unknown';
    const chain = SUPPORTED_CHAINS.find(c => c.id === id);
    return chain?.name || `Chain ${id}`;
  };

  const getCurrentChain = () => {
    return SUPPORTED_CHAINS.find(c => c.id === chainId);
  };

  const isCorrectChain = chainId === selectedChain;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 ">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👛</span>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Wallet Connection
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            
            {/* Chain Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Select Network
              </label>
              <select
                value={selectedChain}
                onChange={handleChainChange}
                disabled={switching}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white disabled:opacity-50"
              >
                {SUPPORTED_CHAINS.map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.name} ({chain.tokenSymbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-red-600 dark:text-red-400">❌</span>
                  <p className="text-sm text-red-800 dark:text-red-200 flex-1">{error}</p>
                </div>
              </div>
            )}

            {/* Wrong Chain Warning */}
            {isConnected && !isCorrectChain && (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                      Wrong network detected
                    </p>
                    <button
                      onClick={() => switchToChain(selectedChain)}
                      disabled={switching}
                      className="text-xs px-3 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                    >
                      {switching ? 'Switching...' : `Switch to ${getChainName(selectedChain)}`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Not Connected State */}
            {!isConnected && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-4xl">🔌</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Connect with MetaMask to {getChainName(selectedChain)}
                </p>
                <button
                  onClick={connectWallet}
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.5 7.27L12 12 3.5 7.27 12 2.5l8.5 4.77zM12 22l-8.5-4.77v-6.96L12 15l8.5-4.73v6.96L12 22z"/>
                      </svg>
                      Connect MetaMask
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Connected State */}
            {isConnected && (
              <div>
                <div className={`mb-6 p-4 rounded-lg border ${
                  isCorrectChain 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={isCorrectChain ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                      {isCorrectChain ? '✅' : '⚠️'}
                    </span>
                    <span className={`font-semibold ${
                      isCorrectChain 
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {isCorrectChain ? 'Wallet Connected' : 'Wrong Network'}
                    </span>
                  </div>
                </div>

                {/* Wallet Details */}
                <div className="space-y-4 mb-6">
                  {/* Address */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Address
                      </span>
                      <button
                        onClick={() => {
                          if (address) navigator.clipboard.writeText(address);
                        }}
                        className="text-xs px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="font-mono text-sm text-slate-900 dark:text-white break-all">
                      {address}
                    </p>
                  </div>

                  {/* Current Chain */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-2">
                      Current Network
                    </span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        isCorrectChain ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                      }`}></div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {getChainName(chainId)}
                      </p>
                    </div>
                    {chainId && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Chain ID: {chainId}
                      </p>
                    )}
                  </div>

                  {/* Block Explorer Link */}
                  {getCurrentChain() && (
                     <a
                      href={`${getCurrentChain()?.blockExplorerUrl}/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          View on Explorer
                        </span>
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </a>
                  )}
                </div>

                {/* Close Button (since MetaMask doesn't support programmatic disconnect) */}
                <button
                  onClick={onClose}
                  className="w-full px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Close
                </button>
                
                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-3">
                  To disconnect, use your MetaMask extension
                </p>
              </div>
            )}

            {/* MetaMask Not Installed */}
            {!(window as any).ethereum && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                      MetaMask not detected
                    </p>
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-yellow-700 dark:text-yellow-300 hover:underline"
                    >
                      Install MetaMask →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}