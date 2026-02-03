'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import { checkTaskStatus, getTaskResult, getExplorerUrls } from '../lib/iexec';

interface TaskStatusProps {
  taskId: string;
  onError?: (error: string) => void;
  refreshInterval?: number;
}

const STATUS_COLORS: Record<string, string> = {
  'ACTIVE': '#1976d2',
  'COMPLETED': '#2e7d32',
  'FAILED': '#d32f2f',
  'UNKNOWN': '#757575',
};

const STATUS_ICONS: Record<string, string> = {
  'ACTIVE': '⏳',
  'COMPLETED': '✅',
  'FAILED': '❌',
  'UNKNOWN': '❓',
};

export default function TaskStatus({ taskId, onError, refreshInterval = 10000 }: TaskStatusProps) {
  const [status, setStatus] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  // Mock wallet provider for status checking
  const mockWalletProvider = {
    getSigner: async () => ({
      getAddress: () => '0x',
      provider: {
        getBalance: async () => ({ toString: () => '0' })
      }
    })
  };

  const fetchTaskStatus = async () => {
    try {
      setLoading(true);
      const statusInfo = await checkTaskStatus(taskId, mockWalletProvider as any);
      setStatus(statusInfo);

      if (statusInfo.statusName === 'COMPLETED') {
        // Fetch results if completed
        const taskResult = await getTaskResult(
          taskId,
          mockWalletProvider as any,
          (msg) => console.log('Fetching result:', msg)
        );
        setResult(taskResult);
        setPolling(false); // Stop polling when completed
      } else if (statusInfo.statusName === 'FAILED') {
        setPolling(false); // Stop polling if failed
      }
      
      setError(null);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch task status';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!taskId || !polling) return;

    fetchTaskStatus();

    // Set up polling interval
    const intervalId = setInterval(fetchTaskStatus, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [taskId, polling, refreshInterval]);

  const handleManualRefresh = () => {
    fetchTaskStatus();
  };

  const handleStopPolling = () => {
    setPolling(false);
  };

  const handleResumePolling = () => {
    setPolling(true);
  };

  if (!taskId) {
    return (
      <Alert severity="warning">
        No task ID provided. Please execute a rebalance first.
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          📊 Task Monitor
        </Typography>
        <Chip 
          label={polling ? 'Live Polling' : 'Manual Mode'} 
          color={polling ? 'primary' : 'default'}
          size="small"
        />
      </Box>

      {/* Task ID */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" fontFamily="monospace">
          <strong>Task ID:</strong> {taskId}
        </Typography>
      </Alert>

      {/* Loading State */}
      {loading && !status && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Fetching task status...
          </Typography>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchTaskStatus}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Status Display */}
      {status && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h3">
                    {STATUS_ICONS[status.statusName] || '❓'}
                  </Typography>
                  <Box>
                    <Typography variant="h6" color={STATUS_COLORS[status.statusName]}>
                      {status.statusName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Task Status
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Deal ID:</strong> {status.dealId || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Final Deadline:</strong>{' '}
                    {status.finalDeadline ? new Date(status.finalDeadline * 1000).toLocaleString() : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Timed Out:</strong> {status.isTimedOut ? 'Yes' : 'No'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Progress Bar for Active Tasks */}
            {status.statusName === 'ACTIVE' && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Task is running in TEE...
                </Typography>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  TEE execution typically takes 1-5 minutes
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {result && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32' }}>
              📈 Rebalance Results
            </Typography>

            {result.success ? (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  ✅ Rebalance executed successfully!
                </Alert>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  {/* Volatility Info */}
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      📊 Volatility Analysis
                    </Typography>
                    {result.details?.volatility && (
                      <>
                        <Typography variant="body2">
                          <strong>Current:</strong> {result.details.volatility.current?.toFixed(2)}%
                        </Typography>
                        <Typography variant="body2">
                          <strong>Threshold:</strong> {result.details.volatility.threshold?.toFixed(2)}%
                        </Typography>
                        <Typography variant="body2">
                          <strong>Risk Level:</strong> {result.details.volatility.level}
                        </Typography>
                      </>
                    )}
                  </Paper>

                  {/* Transaction Info */}
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      💰 Transaction Details
                    </Typography>
                    {result.details?.rebalance?.newPositionTx && (
                      <Typography variant="body2" fontFamily="monospace">
                        <strong>TX Hash:</strong>{' '}
                        <a 
                          href={`https://sepolia.arbiscan.io/tx/${result.details.rebalance.newPositionTx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#1976d2', textDecoration: 'underline' }}
                        >
                          {result.details.rebalance.newPositionTx.slice(0, 10)}...
                        </a>
                      </Typography>
                    )}
                    {result.details?.rebalance?.tickRange && (
                      <Typography variant="body2">
                        <strong>Tick Range:</strong> {result.details.rebalance.tickRange[0]} to {result.details.rebalance.tickRange[1]}
                      </Typography>
                    )}
                  </Paper>
                </Box>

                {/* Full Result JSON (Collapsible) */}
                <Box sx={{ mt: 2 }}>
                  <details>
                    <summary style={{ cursor: 'pointer', color: '#1976d2' }}>
                      View Full Result Data
                    </summary>
                    <Paper sx={{ p: 2, mt: 1, bgcolor: '#f5f5f5' }}>
                      <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                        {JSON.stringify(result.details, null, 2)}
                      </Typography>
                    </Paper>
                  </details>
                </Box>
              </>
            ) : (
              <Alert severity="error">
                ❌ Rebalance failed: {result.error || 'Unknown error'}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={handleManualRefresh}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Refresh Status
        </Button>

        {polling ? (
          <Button
            variant="outlined"
            onClick={handleStopPolling}
          >
            Stop Auto-Refresh
          </Button>
        ) : (
          <Button
            variant="outlined"
            onClick={handleResumePolling}
          >
            Resume Auto-Refresh
          </Button>
        )}

        <Button
          variant="outlined"
          onClick={() => {
            const urls = getExplorerUrls(status?.dealId || '', taskId);
            window.open(urls.task, '_blank');
          }}
        >
          View on Explorer
        </Button>
      </Box>

      {/* Polling Status */}
      <Box sx={{ mt: 3 }}>
        <Divider />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {polling ? (
            <>🔄 Auto-refreshing every {refreshInterval / 1000} seconds</>
          ) : (
            <>⏸️ Manual refresh mode - click "Refresh Status" to update</>
          )}
          <br />
          Last updated: {new Date().toLocaleTimeString()}
        </Typography>
      </Box>
    </Paper>
  );
}