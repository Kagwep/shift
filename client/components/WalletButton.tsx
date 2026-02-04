'use client';

import { useState } from 'react';
import WalletConnectionModal from './WalletConnectionModal';
import { useWalletConnection } from '@/app/hooks/useWalletConnectionts';

const SUPPORTED_CHAINS = [
  { id: 134, name: 'iExec Sidechain' },
  { id: 421614, name: 'Arbitrum Sepolia' },
  { id: 11155111, name: 'Sepolia' },
];

export default function WalletButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected, address, chainId } = useWalletConnection();

  const getChainName = (id: number | null) => {
    if (!id) return '';
    const chain = SUPPORTED_CHAINS.find(c => c.id === id);
    return chain?.name || `Chain ${id}`;
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`
          px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2
          ${isConnected 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50' 
            : 'bg-violet-600 text-white hover:bg-violet-700 hover:shadow-lg'
          }
        `}
      >
        {isConnected ? (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="hidden sm:inline">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <span className="sm:hidden">Connected</span>
          </>
        ) : (
          <>
            <span className="text-lg">👛</span>
            <span>Connect Wallet</span>
          </>
        )}
      </button>

      <WalletConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}