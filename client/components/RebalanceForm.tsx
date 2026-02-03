'use client';
import { Wallet } from 'ethers';
import Grid2 from '@mui/material/Unstable_Grid2';
import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
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
  { value: 'auto_optimize', label: 'Auto Optimize' },
  { value: 'reduce_exposure', label: 'Reduce Exposure' },
  { value: 'increase_exposure', label: 'Increase Exposure' },
  { value: 'exit_position', label: 'Exit Position' },
];

const THRESHOLDS = [
  { value: 'low', label: 'Low (2%)' },
  { value: 'moderate', label: 'Moderate (5%)' },
  { value: 'high', label: 'High (10%)' },
  { value: 'extreme', label: 'Extreme (20%)' },
];

// Arbitrum Sepolia default pool addresses (user must provide real one)
const DEFAULT_POOL_ADDRESSES = {
  UNIUSDC: '', // User must provide
  UNIWETH: '', // User must provide
  LINKUSDT: '', // User must provide
};

export default function RebalanceForm({ onTaskCreated, onError }: RebalanceFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // User wallet (for executing task)
    userPrivateKey: '',
    // Position wallet (protected data - for Uniswap operations)
    positionPrivateKey: '',
    positionProviderUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    positionChainId: '421614',
    
    // Strategy
    tokenPair: 'UNIUSDC',
    action: 'auto_optimize',
    threshold: 'moderate',
    
    // Pool address (REQUIRED)
    poolAddress: '',
    
    // Optional overrides
    nftManagerAddress: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    tokenAAddress: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', // UNI on Arbitrum
    tokenBAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // USDC on Arbitrum Sepolia
  });

  const [walletInfo, setWalletInfo] = useState<{
    address: string;
    ether: string;
    rlc: string;
    network: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string) => (e: any) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Update token addresses based on pair
      ...(name === 'tokenPair' && {
        tokenAAddress: value === 'UNIWETH' 
          ? '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0' // UNI
          : '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', // UNI for UNI/USDC
        tokenBAddress: value === 'UNIWETH'
          ? '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' // WETH
          : '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // USDC
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

      // Validate
      if (!formData.userPrivateKey) {
        throw new Error('User private key is required');
      }
      if (!formData.positionPrivateKey) {
        throw new Error('Position private key is required (will be encrypted)');
      }
      if (!formData.poolAddress) {
        throw new Error('Pool address is required. Find or create a Uniswap V3 pool on Arbitrum Sepolia.');
      }

      // 1. Initialize wallet provider
      const walletProvider = {
        getSigner: async () => new Wallet(formData.userPrivateKey),
      };

      // 2. Create protected data with position config
      const protectedDataConfig: ProtectedDataConfig = {
        privateKey: formData.positionPrivateKey,
        providerUrl: formData.positionProviderUrl,
        chainId: parseInt(formData.positionChainId),
        nftManagerAddress: formData.nftManagerAddress,
        tokenAAddress: formData.tokenAAddress,
        tokenBAddress: formData.tokenBAddress,
        poolAddress: formData.poolAddress,
      };

      const protectedData = await createProtectedData(
        walletProvider as any,
        protectedDataConfig,
        (status) => console.log('Status:', status)
      );

      // 3. Prepare args for the TEE app
      const args = `${formData.tokenPair} ${formData.action} ${formData.threshold}`;
      
      // 4. Execute the task
      const result = await executeRebalance(
        walletProvider as any,
        protectedData.address,
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

      // 5. Update wallet balance
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
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          🚀 Uniswap V3 TEE Rebalancer
        </Typography>
        <Chip 
          label="Arbitrum Sepolia" 
          color="primary" 
          variant="outlined"
          size="small"
        />
      </Box>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Execute volatility-based rebalancing in a Trusted Execution Environment (TEE) on Arbitrum Sepolia
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {taskId && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Task ID:</strong> {taskId}
            <br />
            <strong>Explorer:</strong>{' '}
            <a 
              href={`https://explorer.iex.ec/arbitrum-sepolia-testnet/task/${taskId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1976d2', textDecoration: 'underline' }}
            >
              View on iExec Explorer
            </a>
          </Typography>
        </Alert>
      )}

      <Grid2 container spacing={3}>
        {/* Network Info */}
        <Grid2 xs={12}>
          <Alert severity="info" icon={false}>
            <Typography variant="body2">
              <strong>🌐 Network:</strong> Arbitrum Sepolia (Chain ID: 421614)
              <br />
              <strong>💰 Requirements:</strong> You need ETH for gas and RLC for task execution on Arbitrum Sepolia
            </Typography>
          </Alert>
        </Grid2>

        {/* Wallet Section */}
        <Grid2 xs={12}>
          <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32' }}>
            👛 Wallet Configuration
          </Typography>
        </Grid2>

        <Grid2 xs={12} md={6}>
          <TextField
            fullWidth
            label="Your Private Key"
            name="userPrivateKey"
            value={formData.userPrivateKey}
            onChange={handleInputChange}
            type="password"
            placeholder="0x..."
            helperText="Used to pay for task execution on Arbitrum Sepolia"
            required
          />
        </Grid2>

        <Grid2 xs={12} md={6}>
          <Button
            fullWidth
            variant="outlined"
            onClick={checkWallet}
            disabled={!formData.userPrivateKey}
            sx={{ height: '56px' }}
          >
            Check Wallet Balance
          </Button>
        </Grid2>

        {walletInfo && (
          <Grid2 xs={12}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Network:</strong> {walletInfo.network}<br />
                <strong>Address:</strong> {walletInfo.address}<br />
                <strong>ETH Balance:</strong> {(parseInt(walletInfo.ether) / 1e18).toFixed(4)} ETH<br />
                <strong>RLC Balance:</strong> {formatRLC(walletInfo.rlc)} RLC
              </Typography>
            </Alert>
          </Grid2>
        )}

        {/* Protected Data Section */}
        <Grid2 xs={12}>
          <Typography variant="h6" gutterBottom sx={{ color: '#ed6c02' }}>
            🔐 Position Configuration (Encrypted in TEE)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This private key will be encrypted and only decrypted inside the TEE
          </Typography>
        </Grid2>

        <Grid2 xs={12} md={6}>
          <TextField
            fullWidth
            label="Position Private Key"
            name="positionPrivateKey"
            value={formData.positionPrivateKey}
            onChange={handleInputChange}
            type="password"
            placeholder="0x..."
            helperText="Private key for Uniswap operations (encrypted)"
            required
          />
        </Grid2>

        <Grid2 xs={12} md={6}>
          <TextField
            fullWidth
            label="Provider URL"
            name="positionProviderUrl"
            value={formData.positionProviderUrl}
            onChange={handleInputChange}
            helperText="Arbitrum Sepolia RPC endpoint"
          />
        </Grid2>

        {/* Strategy Section */}
        <Grid2 xs={12}>
          <Typography variant="h6" gutterBottom sx={{ color: '#9c27b0' }}>
            ⚙️ Rebalancing Strategy
          </Typography>
        </Grid2>

        <Grid2 xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Token Pair</InputLabel>
            <Select
              value={formData.tokenPair}
              onChange={handleSelectChange('tokenPair')}
              label="Token Pair"
            >
              {TOKEN_PAIRS.map(pair => (
                <MenuItem key={pair.value} value={pair.value}>
                  {pair.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid2>

        <Grid2 xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Action</InputLabel>
            <Select
              value={formData.action}
              onChange={handleSelectChange('action')}
              label="Action"
            >
              {ACTIONS.map(action => (
                <MenuItem key={action.value} value={action.value}>
                  {action.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid2>

        <Grid2 xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Volatility Threshold</InputLabel>
            <Select
              value={formData.threshold}
              onChange={handleSelectChange('threshold')}
              label="Volatility Threshold"
            >
              {THRESHOLDS.map(threshold => (
                <MenuItem key={threshold.value} value={threshold.value}>
                  {threshold.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid2>

        {/* Pool Address (CRITICAL) */}
        <Grid2 xs={12}>
          <Typography variant="h6" gutterBottom sx={{ color: '#d32f2f' }}>
            🏊 Pool Address (Required)
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You must provide a real Uniswap V3 pool address on Arbitrum Sepolia
          </Alert>
          <TextField
            fullWidth
            label="Pool Address"
            name="poolAddress"
            value={formData.poolAddress}
            onChange={handleInputChange}
            placeholder="0x..."
            helperText="Find or create a Uniswap V3 pool on Arbitrum Sepolia"
            required
          />
        </Grid2>

        {/* Advanced Options */}
        <Grid2 xs={12}>
          <Typography variant="h6" gutterBottom sx={{ color: '#546e7a' }}>
            ⚙️ Advanced Options
          </Typography>
        </Grid2>

        <Grid2 xs={12} md={6}>
          <TextField
            fullWidth
            label="NFT Manager Address"
            name="nftManagerAddress"
            value={formData.nftManagerAddress}
            onChange={handleInputChange}
            helperText="Uniswap V3 Position Manager (Arbitrum)"
          />
        </Grid2>

        <Grid2 xs={12} md={6}>
          <TextField
            fullWidth
            label="Token A Address"
            name="tokenAAddress"
            value={formData.tokenAAddress}
            onChange={handleInputChange}
            helperText="First token (e.g., UNI)"
          />
        </Grid2>

        <Grid2 xs={12} md={6}>
          <TextField
            fullWidth
            label="Token B Address"
            name="tokenBAddress"
            value={formData.tokenBAddress}
            onChange={handleInputChange}
            helperText="Second token (e.g., USDC)"
          />
        </Grid2>

        {/* Execute Button */}
        <Grid2 xs={12}>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={executeRebalancer}
              disabled={loading || !formData.userPrivateKey || !formData.positionPrivateKey || !formData.poolAddress}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                },
              }}
            >
              {loading ? 'Processing...' : '🚀 Execute TEE Rebalance'}
            </Button>
          </Box>
        </Grid2>

        {/* Info Box */}
        <Grid2 xs={12}>
          <Alert severity="info" icon={false}>
            <Typography variant="body2">
              <strong>🔒 Security:</strong> Position private key encrypted in TEE
              <br />
              <strong>📍 Network:</strong> All operations on Arbitrum Sepolia testnet
              <br />
              <strong>⏱️ Time:</strong> TEE tasks take 1-5 minutes
              <br />
              <strong>⚠️ Note:</strong> You need a real Uniswap V3 pool address
            </Typography>
          </Alert>
        </Grid2>
      </Grid2>
    </Paper>
  );
}