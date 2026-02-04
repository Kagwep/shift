'use client';

import { useState } from 'react';

interface RebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RebalanceFormData) => void;
  protectedDataName?: string;
}

export interface RebalanceFormData {
  tokenPair: string;
  action: string;
  threshold: string;
  poolAddress: string;
}

const TOKEN_PAIRS = [
  { value: 'LINKUSDT', label: 'LINK/USDT' },
  { value: 'UNIUSDC', label: 'UNI/USDC' },
  { value: 'UNIWETH', label: 'UNI/WETH' },
];

const ACTIONS = [
  { value: 'auto_optimize', label: 'Auto Optimize', icon: '🤖', description: 'Automatically adjust based on volatility' },
  { value: 'reduce_exposure', label: 'Reduce Exposure', icon: '📉', description: 'Decrease position size' },
  { value: 'increase_exposure', label: 'Increase Exposure', icon: '📈', description: 'Increase position size' },
  { value: 'exit_position', label: 'Exit Position', icon: '🚪', description: 'Close all positions' },
];

const THRESHOLDS = [
  { value: 'low', label: 'Low', percent: '2%', color: 'green', bgColor: 'bg-green-100 dark:bg-green-900/30', borderColor: 'border-green-300 dark:border-green-700', textColor: 'text-green-700 dark:text-green-300' },
  { value: 'moderate', label: 'Moderate', percent: '5%', color: 'yellow', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', borderColor: 'border-yellow-300 dark:border-yellow-700', textColor: 'text-yellow-700 dark:text-yellow-300' },
  { value: 'high', label: 'High', percent: '10%', color: 'orange', bgColor: 'bg-orange-100 dark:bg-orange-900/30', borderColor: 'border-orange-300 dark:border-orange-700', textColor: 'text-orange-700 dark:text-orange-300' },
  { value: 'extreme', label: 'Extreme', percent: '20%', color: 'red', bgColor: 'bg-red-100 dark:bg-red-900/30', borderColor: 'border-red-300 dark:border-red-700', textColor: 'text-red-700 dark:text-red-300' },
];

const DEFAULT_POOL_ADDRESSES = {
  UNIUSDC: '',
  UNIWETH: '',
  LINKUSDT: '0x287B0e934ed0439E2a7b1d5F0FC25eA2c24b64f7',
};

export default function RebalanceModal({ isOpen, onClose, onSubmit, protectedDataName }: RebalanceModalProps) {
  const [formData, setFormData] = useState<RebalanceFormData>({
    tokenPair: 'UNIWETH',
    action: 'auto_optimize',
    threshold: 'moderate',
    poolAddress: '0x287B0e934ed0439E2a7b1d5F0FC25eA2c24b64f7',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Update pool address based on token pair
      ...(name === 'tokenPair' && {
        poolAddress: DEFAULT_POOL_ADDRESSES[value as keyof typeof DEFAULT_POOL_ADDRESSES] || '',
      }),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  const selectedAction = ACTIONS.find(a => a.value === formData.action);
  const selectedThreshold = THRESHOLDS.find(t => t.value === formData.threshold);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-purple-600 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  🚀 Execute Rebalance
                </h2>
                {protectedDataName && (
                  <p className="text-violet-100 text-sm">
                    Using: {protectedDataName}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Token Pair Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Token Pair
              </label>
              <div className="grid grid-cols-3 gap-3">
                {TOKEN_PAIRS.map((pair) => (
                  <button
                    key={pair.value}
                    type="button"
                    onClick={() => handleSelectChange('tokenPair', pair.value)}
                    className={`
                      p-4 rounded-xl border-2 font-medium transition-all
                      ${formData.tokenPair === pair.value
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 shadow-lg scale-105'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-600'
                      }
                    `}
                  >
                    {pair.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Rebalance Action
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ACTIONS.map((action) => (
                  <button
                    key={action.value}
                    type="button"
                    onClick={() => handleSelectChange('action', action.value)}
                    className={`
                      p-4 rounded-xl border-2 text-left transition-all
                      ${formData.action === action.value
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 shadow-lg scale-[1.02]'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-violet-300 dark:hover:border-violet-600'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{action.icon}</span>
                      <span className={`font-semibold ${
                        formData.action === action.value
                          ? 'text-violet-700 dark:text-violet-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {action.label}
                      </span>
                    </div>
                    <p className={`text-xs ${
                      formData.action === action.value
                        ? 'text-violet-600 dark:text-violet-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {action.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Volatility Threshold */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Volatility Threshold
              </label>
              <div className="grid grid-cols-2 gap-3">
                {THRESHOLDS.map((threshold) => (
                  <button
                    key={threshold.value}
                    type="button"
                    onClick={() => handleSelectChange('threshold', threshold.value)}
                    className={`
                      p-4 rounded-xl border-2 transition-all
                      ${formData.threshold === threshold.value
                        ? `${threshold.bgColor} ${threshold.borderColor} shadow-lg scale-[1.02]`
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold ${
                        formData.threshold === threshold.value
                          ? threshold.textColor
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {threshold.label}
                      </span>
                      <span className={`text-sm font-mono ${
                        formData.threshold === threshold.value
                          ? threshold.textColor
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {threshold.percent}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          threshold.color === 'green' ? 'bg-green-500' :
                          threshold.color === 'yellow' ? 'bg-yellow-500' :
                          threshold.color === 'orange' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: threshold.percent }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pool Address */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Pool Address
              </label>
              <input
                type="text"
                name="poolAddress"
                value={formData.poolAddress}
                onChange={handleInputChange}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white font-mono text-sm"
                required
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Uniswap V3 pool address on Arbitrum Sepolia
              </p>
            </div>


            {/* Summary */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">📋</span>
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Execution Summary
                  </p>
                  <div className="space-y-1 text-blue-800 dark:text-blue-200">
                    <p>• Pair: <strong>{TOKEN_PAIRS.find(p => p.value === formData.tokenPair)?.label}</strong></p>
                    <p>• Action: <strong>{selectedAction?.icon} {selectedAction?.label}</strong></p>
                    <p>• Threshold: <strong>{selectedThreshold?.label} ({selectedThreshold?.percent})</strong></p>
                    <p>• Pool: <code className="text-xs">{formData.poolAddress.slice(0, 10)}...{formData.poolAddress.slice(-8)}</code></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <span className="text-xl">🚀</span>
                Execute Rebalance
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}