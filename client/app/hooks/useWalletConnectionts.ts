import { useEffect, useState } from 'react';
import { cleanDataProtectorClient, initDataProtectorClient } from '../externals/dataProtectorClient';


export function useWalletConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    if (!(window as any).ethereum) {
      return;
    }

    const checkConnection = async () => {
      try {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0) {
          setIsConnected(true);
          setAddress(accounts[0]);

          const newChainId = await (window as any).ethereum.request({
            method: 'eth_chainId',
          });
          const parsedChainId = parseInt(newChainId, 16);
          setChainId(parsedChainId);

          initDataProtectorClient({
            provider: (window as any).ethereum,
            chainId: parsedChainId,
          });
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };

    checkConnection();

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setIsConnected(true);
        setAddress(accounts[0]);
        if (chainId) {
          initDataProtectorClient({
            provider: (window as any).ethereum,
            chainId: chainId,
          });
        }
      } else {
        setIsConnected(false);
        setAddress(null);
        cleanDataProtectorClient();
      }
    };

    const handleChainChanged = (newChainHexId: string) => {
      const newChainId = parseInt(newChainHexId, 16);
      setChainId(newChainId);
      initDataProtectorClient({
        provider: (window as any).ethereum,
        chainId: newChainId,
      });
    };

    (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
    (window as any).ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if ((window as any).ethereum.removeListener) {
        (window as any).ethereum.removeListener(
          'accountsChanged',
          handleAccountsChanged
        );
        (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return {
    isConnected,
    address,
    chainId,
  };
}