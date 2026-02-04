'use client';

import { useState } from 'react';
import RebalanceForm from '../components/RebalanceForm';
import TaskStatus from '../components/TaskStatus';

const steps = [
  { number: 1, label: 'Configure Wallet', icon: '👛' },
  { number: 2, label: 'Set Strategy', icon: '⚙️' },
  { number: 3, label: 'Execute in TEE', icon: '🚀' },
  { number: 4, label: 'View Results', icon: '📊' }
];

export default function HomePageold() {
  const [activeStep, setActiveStep] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTaskCreated = (newTaskId: string) => {
    setTaskId(newTaskId);
    setActiveStep(3);
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
    <div className="max-w-7xl mx-auto">
      
      {/* Hero Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-2xl mb-6">
          <span className="text-4xl">🔄</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          TEE Uniswap Rebalancer
        </h1>
        
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-6 max-w-3xl mx-auto">
          Volatility-based liquidity position rebalancing in Trusted Execution Environment
        </p>

        {/* Info Banner */}
        <div className="max-w-3xl mx-auto p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 dark:text-blue-400 text-xl">ℹ️</span>
            <div className="text-left flex-1">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                How it works:
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-blue-800 dark:text-blue-200">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 rounded">1. Encrypt credentials</span>
                <span className="text-blue-400">→</span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 rounded">2. Set strategy</span>
                <span className="text-blue-400">→</span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 rounded">3. Execute in TEE</span>
                <span className="text-blue-400">→</span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 rounded">4. Get results</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300
                  ${index <= activeStep 
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg scale-110' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }
                `}>
                  {index < activeStep ? '✓' : step.icon}
                </div>
                <p className={`
                  mt-2 text-xs font-medium text-center transition-colors
                  ${index <= activeStep 
                    ? 'text-slate-900 dark:text-white' 
                    : 'text-slate-500 dark:text-slate-400'
                  }
                `}>
                  {step.label}
                </p>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-1 mx-4 rounded transition-all duration-300
                  ${index < activeStep 
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600' 
                    : 'bg-slate-200 dark:bg-slate-700'
                  }
                `} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <span className="text-red-600 dark:text-red-400">❌</span>
              <p className="text-sm text-red-800 dark:text-red-200 flex-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="space-y-8">
        
        {/* Steps 1-3: Configuration Form */}
        {activeStep < 3 && (
          <div>
            <RebalanceForm 
              onTaskCreated={handleTaskCreated}
              onError={handleError}
            />
            
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <button
                disabled={activeStep === 0}
                onClick={() => setActiveStep(prev => prev - 1)}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setActiveStep(prev => Math.min(prev + 1, 2))}
                disabled={activeStep === 2}
                className="px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {activeStep === 2 ? 'Ready to Execute ✓' : 'Next Step →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Task Status & Results */}
        {activeStep === 3 && taskId && (
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Task Execution & Results
                </h2>
              </div>
              
              <TaskStatus 
                taskId={taskId}
                onError={handleError}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              >
                🔄 Start New Rebalance
              </button>
              <button
                onClick={() => window.open(`https://explorer.iex.ec/arbitrum-sepolia-testnet/task/${taskId}`, '_blank')}
                className="px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-all"
              >
                🔍 View on Explorer
              </button>
            </div>
          </div>
        )}

        {/* Network Information */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">🌐</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Network Configuration
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Network Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
                <div className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
                  <p><span className="font-semibold">Network:</span> Arbitrum Sepolia (Testnet)</p>
                  <p><span className="font-semibold">Chain ID:</span> 421614</p>
                  <p className="break-all">
                    <span className="font-semibold">RPC URL:</span>{' '}
                    <code className="text-xs bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">
                      https://sepolia-rollup.arbitrum.io/rpc
                    </code>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Requirements */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                <div className="text-sm text-yellow-900 dark:text-yellow-100">
                  <p className="font-semibold mb-2">Requirements:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>ETH for gas fees</li>
                    <li>RLC for task execution</li>
                    <li>Uniswap V3 pool address</li>
                    <li>Position with liquidity</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">⚙️</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              How TEE Rebalancing Works
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="group p-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800 rounded-xl hover:shadow-lg transition-all">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
                  🔒
                </div>
                <p className="text-lg font-bold text-violet-600 dark:text-violet-400 mb-2">Step 1</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Your private key is encrypted and stored as protected data
                </p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="group p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl hover:shadow-lg transition-all">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
                  📈
                </div>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">Step 2</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Volatility prediction determines if rebalancing is needed
                </p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="group p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl hover:shadow-lg transition-all">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">Step 3</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  TEE executes rebalancing securely with encrypted credentials
                </p>
              </div>
            </div>
            
            {/* Step 4 */}
            <div className="group p-6 bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 border border-orange-200 dark:border-orange-800 rounded-xl hover:shadow-lg transition-all">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
                  📊
                </div>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-2">Step 4</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Results returned with transaction details and position info
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 text-center">
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <p className="flex items-center justify-center gap-2">
            <span>🔒</span>
            <span>Powered by iExec TEE (Trusted Execution Environment)</span>
          </p>
          <p className="flex items-center justify-center gap-2">
            <span>⚡</span>
            <span>Built for Arbitrum Sepolia Testnet</span>
          </p>
          <p className="flex items-center justify-center gap-2">
            <span>📊</span>
            <span>Rebalancing based on real-time volatility predictions</span>
          </p>
        </div>
      </div>
    </div>
  );
}