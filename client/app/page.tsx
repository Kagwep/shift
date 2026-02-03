'use client';

import { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Alert,
  Stepper,
  Step,
  StepLabel,
  Button
} from '@mui/material';
import RebalanceForm from '../components/RebalanceForm';
import TaskStatus from '../components/TaskStatus';

const steps = [
  'Configure Wallet',
  'Set Rebalance Strategy', 
  'Execute in TEE',
  'View Results'
];

export default function HomePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTaskCreated = (newTaskId: string) => {
    setTaskId(newTaskId);
    setActiveStep(3); // Move to results step
    setError(null);
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
  };

  const handleReset = () => {
    setActiveStep(0);
    setTaskId(null);
    setError(null);
  };

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          🔄 TEE Uniswap Rebalancer
        </Typography>
        
        <Typography variant="h5" color="text.secondary" paragraph>
          Volatility-based liquidity position rebalancing in Trusted Execution Environment
        </Typography>

        <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
          <Typography variant="body2">
            <strong>ℹ️ How it works:</strong> 
            1. Encrypt your wallet credentials → 
            2. Set rebalancing strategy → 
            3. Execute in TEE → 
            4. Get results
          </Typography>
        </Alert>
      </Box>

      {/* Stepper */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setError(null)}>
              Dismiss
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Step 1-3: Configuration Form */}
        {activeStep < 3 && (
          <Paper elevation={3} sx={{ p: 3 }}>
            <RebalanceForm 
              onTaskCreated={handleTaskCreated}
              onError={handleError}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={() => setActiveStep(prev => prev - 1)}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={() => setActiveStep(prev => Math.min(prev + 1, 2))}
                disabled={activeStep === 2}
              >
                {activeStep === 2 ? 'Ready to Execute' : 'Next Step'}
              </Button>
            </Box>
          </Paper>
        )}

        {/* Step 4: Task Status & Results */}
        {activeStep === 3 && taskId && (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#1976d2' }}>
              📊 Task Execution & Results
            </Typography>
            
            <TaskStatus 
              taskId={taskId}
              onError={handleError}
            />
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleReset}
              >
                Start New Rebalance
              </Button>
              <Button
                variant="contained"
                onClick={() => window.open(`https://explorer.iex.ec/arbitrum-sepolia-testnet/task/${taskId}`, '_blank')}
              >
                View on Explorer
              </Button>
            </Box>
          </Paper>
        )}

        {/* Network Information */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32' }}>
            🌐 Network Configuration
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Network:</strong> Arbitrum Sepolia (Testnet)
                <br />
                <strong>Chain ID:</strong> 421614
                <br />
                <strong>RPC URL:</strong> https://sepolia-rollup.arbitrum.io/rpc
              </Typography>
            </Alert>
            
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Requirements:</strong>
                <br />• ETH for gas fees
                <br />• RLC for task execution
                <br />• Uniswap V3 pool address
                <br />• Position with liquidity
              </Typography>
            </Alert>
          </Box>
        </Paper>

        {/* How it Works */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#9c27b0' }}>
            ⚙️ How TEE Rebalancing Works
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">1 🔒</Typography>
              <Typography variant="body2">
                Your private key is encrypted and stored as protected data
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">2 📈</Typography>
              <Typography variant="body2">
                Volatility prediction determines if rebalancing is needed
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">3 ⚡</Typography>
              <Typography variant="body2">
                TEE executes rebalancing securely with your encrypted credentials
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">4 📊</Typography>
              <Typography variant="body2">
                Results are returned with transaction details and new position info
              </Typography>
            </Paper>
          </Box>
        </Paper>
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 6, py: 3, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          🔒 Powered by iExec TEE (Trusted Execution Environment)
          <br />
          ⚡ Built for Arbitrum Sepolia Testnet
          <br />
          📊 Rebalancing based on real-time volatility predictions
        </Typography>
      </Box>
    </Container>
  );
}