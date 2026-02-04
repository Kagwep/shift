'use client';

import { useState, useEffect } from 'react';
import { checkTaskStatus, getTaskResult, getExplorerUrls } from '../lib/iexec';

interface TaskStatusProps {
  taskId: string;
  onError?: (error: string) => void;
  refreshInterval?: number;
}

const STATUS_CONFIG = {
  ACTIVE: { color: 'blue', icon: '⏳', label: 'Active' },
  COMPLETED: { color: 'green', icon: '✅', label: 'Completed' },
  FAILED: { color: 'red', icon: '❌', label: 'Failed' },
  UNKNOWN: { color: 'gray', icon: '❓', label: 'Unknown' },
} as const;

export default function TaskStatus({ taskId, onError, refreshInterval = 10000 }: TaskStatusProps) {
  const [status, setStatus] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

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
        const taskResult = await getTaskResult(
          taskId,
          mockWalletProvider as any,
          (msg) => console.log('Fetching result:', msg)
        );
        setResult(taskResult);
        setPolling(false);
      } else if (statusInfo.statusName === 'FAILED') {
        setPolling(false);
      }
      
      setError(null);
      setLastUpdate(new Date());
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
    const intervalId = setInterval(fetchTaskStatus, refreshInterval);
    return () => clearInterval(intervalId);
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
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          ⚠️ No task ID provided. Please execute a rebalance first.
        </p>
      </div>
    );
  }

  const statusConfig = status ? STATUS_CONFIG[status.statusName as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.UNKNOWN : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl">📊</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Task Monitor</h2>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
          polling 
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
        }`}>
          {polling ? '🔄 Live Polling' : '⏸️ Manual Mode'}
        </span>
      </div>

      {/* Task ID */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <span className="font-semibold">Task ID:</span>{' '}
          <code className="font-mono text-xs break-all">{taskId}</code>
        </p>
      </div>

      {/* Loading State */}
      {loading && !status && (
        <div className="text-center py-12">
          <div className="inline-block">
            <svg className="animate-spin h-12 w-12 text-violet-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Fetching task status...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <span className="text-red-600 dark:text-red-400">❌</span>
              <p className="text-sm text-red-800 dark:text-red-200 flex-1">{error}</p>
            </div>
            <button
              onClick={fetchTaskStatus}
              className="px-3 py-1 text-xs font-medium text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Status Display */}
      {status && statusConfig && (
        <div className="mb-6 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Status Info */}
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                  statusConfig.color === 'blue' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                  statusConfig.color === 'green' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                  statusConfig.color === 'red' ? 'bg-gradient-to-br from-red-400 to-red-600' :
                  'bg-gradient-to-br from-gray-400 to-gray-600'
                }`}>
                  <span className="text-3xl">{statusConfig.icon}</span>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${
                    statusConfig.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                    statusConfig.color === 'green' ? 'text-green-600 dark:text-green-400' :
                    statusConfig.color === 'red' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {statusConfig.label}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Task Status</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Deal ID:</span>
                  <span className="text-sm font-mono text-slate-900 dark:text-white">{status.dealId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Final Deadline:</span>
                  <span className="text-sm text-slate-900 dark:text-white">
                    {status.finalDeadline ? new Date(status.finalDeadline * 1000).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Timed Out:</span>
                  <span className={`text-sm font-medium ${status.isTimedOut ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {status.isTimedOut ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar for Active Tasks */}
            {status.statusName === 'ACTIVE' && (
              <div className="mt-6">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Task is running in TEE...
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-violet-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  TEE execution typically takes 1-5 minutes
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="mb-6 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📈</span>
              Rebalance Results
            </h3>

            {result.success ? (
              <>
                <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    ✅ Rebalance executed successfully!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  
                  {/* Volatility Info */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 mb-3">
                      📊 Volatility Analysis
                    </p>
                    {result.details?.volatility && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Current:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {result.details.volatility.current?.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Threshold:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {result.details.volatility.threshold?.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Risk Level:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {result.details.volatility.level}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transaction Info */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 mb-3">
                      💰 Transaction Details
                    </p>
                    <div className="space-y-2 text-sm">
                      {result.details?.rebalance?.newPositionTx && (
                        <div>
                          <span className="text-slate-600 dark:text-slate-400 block mb-1">TX Hash:</span>
                          <a 
                            href={`https://sepolia.arbiscan.io/tx/${result.details.rebalance.newPositionTx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {result.details.rebalance.newPositionTx}
                          </a>
                        </div>
                      )}
                      {result.details?.rebalance?.tickRange && (
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Tick Range:</span>
                          <span className="font-mono text-xs text-slate-900 dark:text-white ml-2">
                            {result.details.rebalance.tickRange[0]} to {result.details.rebalance.tickRange[1]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Full Result JSON (Collapsible) */}
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 py-2 flex items-center gap-2">
                    <span className="group-open:rotate-90 transition-transform">▶</span>
                    View Full Result Data
                  </summary>
                  <div className="mt-2 p-4 bg-slate-900 dark:bg-slate-950 rounded-lg border border-slate-700 overflow-x-auto">
                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                </details>
              </>
            ) : (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  ❌ Rebalance failed: {result.error || 'Unknown error'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleManualRefresh}
          disabled={loading}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Refreshing...
            </>
          ) : (
            <>
              <span>🔄</span>
              Refresh Status
            </>
          )}
        </button>

        {polling ? (
          <button
            onClick={handleStopPolling}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
          >
            ⏸️ Stop Auto-Refresh
          </button>
        ) : (
          <button
            onClick={handleResumePolling}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
          >
            ▶️ Resume Auto-Refresh
          </button>
        )}

        <button
          onClick={() => {
            const urls = getExplorerUrls(status?.dealId || '', taskId);
            window.open(urls.task, '_blank');
          }}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
        >
          🔍 View on Explorer
        </button>
      </div>

      {/* Polling Status Footer */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {polling ? (
            <>🔄 Auto-refreshing every {refreshInterval / 1000} seconds</>
          ) : (
            <>⏸️ Manual refresh mode - click "Refresh Status" to update</>
          )}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}