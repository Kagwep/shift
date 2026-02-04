'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Address, IExecDataProtector } from '@iexec/dataprotector';
import { Wallet } from 'ethers';
import { getDataProtectorCoreClient, initDataProtectorClient } from '../externals/dataProtectorClient';
import { useWalletConnection } from '../hooks/useWalletConnectionts';
import { AddressOrEnsName, checkIsConnected, SUPPORTED_CHAINS } from '../utils/utils';

export default function AddProtectedDataPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    privateKey: '',
  });
  const [protectedData, setProtectedData] = useState<Address | ''>('');
  const [authorizedUser, setAuthorizedUser] = useState<AddressOrEnsName | ''>(
    ''
  );

    // Loading and error states
  const [loadingProtect, setLoadingProtect] = useState(false);
  const [loadingGrant, setLoadingGrant] = useState(false);
  const [errorGrant, setErrorGrant] = useState('');
  const [loadingRevoke, setLoadingRevoke] = useState(false);
  const [errorRevoke, setErrorRevoke] = useState('');

  const [numberOfAccess, setNumberOfAccess] = useState<number>(1);
  const [userAddress, setUserAddress] = useState<AddressOrEnsName>('');
  const [revokeAccess, setRevokeAccess] = useState('');



  const { isConnected, address, chainId } = useWalletConnection();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
        await initDataProtectorClient({
                provider: (window as any).ethereum,
                chainId: chainId as number, 
            });
       } catch (err) {
            setError('Please install MetaMask or switch to the correct chain');
            return;
      }

    try {
      setLoading(true);
      setError(null);

      if (!formData.name || !formData.privateKey ) {
        throw new Error('All fields are required');
      }

      // Validate private key format
    //   if (!formData.privateKey.length !== 66) {
    //     throw new Error('Invalid private key format');
    //   }

      // Hardcoded configuration
      const data = {
        privateKey: formData.privateKey,
        providerUrl: 'https://sepolia.infura.io/v3/993eac9c4c004999bdbe646a50c8b009',
        chainId: '11155111',
      };

     const client = await getDataProtectorCoreClient();
      const protectedDataResponse = await client.protectData({
        data,
        name: formData.name,
      });

      setProtectedData(protectedDataResponse.address as Address);

      // Store in localStorage (replace with actual storage)
      // Provide more specific error messages
      if (String(error).includes('Internal JSON-RPC error')) {
        setError(
          'RPC Error: Please check your network connection and ensure you have sufficient xRLC for gas fees on Bellecour'
        );
      } else if (String(error).includes('insufficient funds')) {
        setError(
          'Insufficient funds: Please ensure you have enough xRLC tokens for gas fees'
        );
      } else if (String(error).includes('user rejected')) {
        setError('Transaction rejected by user');
      } else {
        setError(String(error));
      }

      // Redirect back to home
     // router.push('/');
      
    } catch (err: any) {
      setError(err.message || 'Failed to create protected data');
    } finally {
      setLoading(false);
    }
  };

const grantAccessSubmit = async () => {
    setErrorGrant('');
    try {
      checkIsConnected();
      //await switchToChain(selectedChain);

      // Reinitialize the DataProtector client with the correct chain
      await initDataProtectorClient({
        provider: (window as any).ethereum,
        chainId: chainId as number,
      });
    } catch (err) {
      setErrorGrant('Please install MetaMask or switch to the correct chain');
      return;
    }

    if (!userAddress) {
      setErrorGrant('Please enter a user address');
      return;
    }
    try {
      setLoadingGrant(true);
      const client = await getDataProtectorCoreClient();
      await client.grantAccess({
        protectedData,
        authorizedUser: userAddress,
        authorizedApp: SUPPORTED_CHAINS.find((c) => c.id === chainId)?.web3mailAppAddress as Address,
        numberOfAccess,
      });
      setAuthorizedUser(userAddress);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Grant access error:', error);
      setErrorGrant(String(error));
    }
    setLoadingGrant(false);
  };

  const revokeAccessSubmit = async () => {
    setRevokeAccess('');
    try {
      checkIsConnected();
      //await switchToChain(selectedChain);

      // Reinitialize the DataProtector client with the correct chain
      await initDataProtectorClient({
        provider: (window as any).ethereum,
        chainId: chainId as number,
      });
    } catch (err) {
      setErrorRevoke('Please install MetaMask or switch to the correct chain');
      return;
    }

    try {
      setLoadingRevoke(true);
      const client = await getDataProtectorCoreClient();
      const allGrantedAccess = await client.getGrantedAccess({
        protectedData,
        authorizedUser,
        authorizedApp: SUPPORTED_CHAINS.find((c) => c.id === chainId)?.web3mailAppAddress as Address,
      });
      if (allGrantedAccess.count === 0) {
        throw new Error('No access to revoke');
      }
      const { txHash } = await client.revokeOneAccess(
        allGrantedAccess.grantedAccess[0]
      );
      setRevokeAccess(txHash);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Revoke access error:', error);
      setErrorRevoke(String(error));
      setRevokeAccess('');
    }
    setLoadingRevoke(false);
  };

    const handleNumberOfAccessChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNumberOfAccess(Number(event.target.value));
  };

  const shareWithYourself = async () => {
    if ((window as any).ethereum) {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });
      setUserAddress(accounts[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>

        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-2xl mb-6">
          <span className="text-3xl">➕</span>
        </div>
        
        <h1 className="text-4xl font-bold mb-3 text-slate-900 dark:text-white">
          Add Protected Data
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Encrypt and store your wallet private key securely
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400">❌</span>
            <p className="text-sm text-red-800 dark:text-red-200 flex-1">{error}</p>
          </div>
        </div>
      )}

              {protectedData && !error && (
          <div style={{ marginTop: '4px' }}>
            Your data has been protected!
            <a
              href={
                SUPPORTED_CHAINS.find((c) => c.id === chainId)
                  ?.explorerUrl + protectedData
              }
              rel="noreferrer"
              target="_blank"
            >
              You can check it here
            </a>
            <p>
              Your protected data address: <span>{protectedData}</span>
            </p>
          </div>
        )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          
          {/* Wallet Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Wallet Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., My Trading Wallet"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
              required
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Give this wallet a memorable name
            </p>
          </div>

          {/* Position Private Key */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Position Private Key * (Will be encrypted)
            </label>
            <input
              type="password"
              name="privateKey"
              value={formData.privateKey}
              onChange={handleInputChange}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white font-mono"
              required
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              This private key will be used for Uniswap operations (encrypted in TEE)
            </p>
          </div>



          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Automatic Configuration</p>
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Provider URL: https://sepolia-rollup.arbitrum.io/rpc<br />
                  Chain ID: 421614 (Arbitrum Sepolia)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-4 text-lg font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:shadow-2xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating Protected Data...
            </>
          ) : (
            <>
              <span className="text-2xl">🔐</span>
              Create Protected Data
            </>
          )}
        </button>
      </form>

      {/* Grant Access Form */}
      {protectedData && (
        <div>
          <hr style={{ marginTop: '30px' }} />
          <div>
            <h2>Grant Access to your protected data</h2>
            <label>
              Protected Data Address:{' '}
              <input
                type="text"
                disabled
                value={protectedData}
                placeholder="Protected Data Address"
              />
            </label>
          </div>
          <div>
            <label>
              Number of Access:{' '}
              <input
                type="number"
                value={numberOfAccess}
                placeholder="Allowed Access Count"
                min={1}
                onChange={handleNumberOfAccessChange}
              />
            </label>
          </div>
          <div>
            <label>
              User Address Restricted:{' '}
              <input
                type="text"
                value={userAddress}
                placeholder="User Address Restricted"
                required
                onChange={(event) => setUserAddress(event.target.value)}
              />
            </label>
          </div>
          <div>
            For testing here, you can{' '}
            <button type="button" onClick={shareWithYourself}>
              enter your own wallet address
            </button>
            .
          </div>
          {!loadingGrant ? (
            <button onClick={grantAccessSubmit}>Grant Access</button>
          ) : (
            <img src="/loader.gif" alt="loading" height="30px" />
          )}
          {errorGrant && (
            <div style={{ marginTop: '10px', maxWidth: 300, color: 'red' }}>
              <h6>Grant Access failed</h6>
              {errorGrant}
            </div>
          )}
          {authorizedUser && !errorGrant && (
            <div style={{ marginTop: '4px' }}>
              <img
                src="/success.png"
                alt="success"
                height="30px"
                style={{ verticalAlign: 'middle' }}
              />
              Access successfully granted
            </div>
          )}
        </div>
      )}

            {/* Revoke Access Form */}
      {protectedData && authorizedUser && (
        <div>
          <hr style={{ marginTop: '30px' }} />
          <div>
            <h2>Revoke Access to your protected data</h2>
            <label>
              Revoke Access for protectData:{' '}
              <input type="text" disabled value={protectedData} />
            </label>
          </div>
          {!loadingRevoke ? (
            <button onClick={revokeAccessSubmit}>Revoke Access</button>
          ) : (
            <img src="/loader.gif" alt="loading" height="30px" />
          )}
          {revokeAccess && !errorRevoke && (
            <div style={{ marginTop: '4px' }}>
              <img
                src="/success.png"
                alt="success"
                height="30px"
                style={{ verticalAlign: 'middle' }}
              />
              Access successfully revoked
            </div>
          )}
          {errorRevoke && (
            <div style={{ marginTop: '10px', maxWidth: 300, color: 'red' }}>
              <h6>Revoke Access failed</h6>
              {errorRevoke}
            </div>
          )}
        </div>
      )}


      {/* Security Notice */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>🔒</span>
          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">Security</p>
            <p className="text-xs">
              Your position private key is encrypted and stored on iExec's decentralized infrastructure.
              It can only be decrypted inside a Trusted Execution Environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}