'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RebalanceModal, { RebalanceFormData } from '@/components/RebalanceFormData';
import TaskStatus from '../components/TaskStatus';
import { getDataProtectorCoreClient } from './externals/dataProtectorClient';
import { useWalletConnection } from './hooks/useWalletConnectionts';
import { IExec } from 'iexec';
import JSZip from 'jszip';
import { downloadJSON, downloadReport, downloadZIP } from './utils/dowload';
import { 
  Download, 
  FileJson, 
  Archive, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  RefreshCw, 
  ExternalLink,
  ChevronDown,
  Clock,
  Check,
  Copy
} from 'lucide-react';


export default function HomePage() {
  const router = useRouter();
  
  // State for the manual address input
  const [protectedDataAddress, setProtectedDataAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Task execution state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
   const { isConnected, address, chainId } = useWalletConnection();

   const [result, setResult] = useState<any>(null);
   const [zipFiles, setZipFiles] = useState<Record<string, any>>({});
  
  

  const handleOpenRebalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!protectedDataAddress.startsWith('0x') || protectedDataAddress.length !== 42) {
      setError('Please enter a valid Protected Data Address (0x...)');
      return;
    }
    setError(null);
    setIsModalOpen(true);
  };

  // Add this state at the top of your component
const [copiedId, setCopiedId] = useState(null);

// Add this copy function
const copyToClipboard = (text:any, id:any) => {
  navigator.clipboard.writeText(text);
  setCopiedId(id);
  setTimeout(() => setCopiedId(null), 2000);
};


  const handleExecuteRebalance = async (formData: RebalanceFormData) => {
    try {
      setExecuting(true);
      setError(null);
      setIsModalOpen(false);


      // Prepare execution arguments
      const args = `UNIWETH auto_optimize moderate 0x287B0e934ed0439E2a7b1d5F0FC25eA2c24b64f7`;
      // await (await getDataProtectorCoreClient()).grantAccess(
      //    {
      //     protectedData: '0xBEbC90aD4498fB473467e4947ab3C6E89FA07F6e',
      //     authorizedApp: '0x7d7876B63b744ECB663b6E0826c7e0F56AAB7d36',
      //     authorizedUser: address as string,
      //     pricePerAccess: 0,
      //     numberOfAccess:20
      //   }
      // );

      //  const appOrders = await iexec.orderbook.fetchAppOrderbook(
      //     '0xBB0dAc8bf20068162B20f4F2C6806F0D64cd9D73' // Filter by specific app
      //   );

      //   console.log(appOrders)

     // 1. Fetch App Order (to get the 1 RLC price)
      const result =await (await getDataProtectorCoreClient()).processProtectedData({
        protectedData: protectedDataAddress,
        app: '0x7d7876B63b744ECB663b6E0826c7e0F56AAB7d36',
        args: args,
        maxPrice: 1000000000,
        workerpoolMaxPrice: 1000000000,
        category: 0,
      });

      if (result.result) {


        try {
                      // The result is a ZIP file
            const zip = await JSZip.loadAsync(result.result);
            
            console.log('📦 ZIP contents:', Object.keys(zip.files));
            
            // Extract your result files
            const files: Record<string, any> = {};
            
            for (const filename in zip.files) {
              const file = zip.files[filename];
              if (!file.dir) {
                const content = await file.async('string');
                
                // Try to parse JSON files
                if (filename.endsWith('.json')) {
                  try {
                    files[filename] = JSON.parse(content);
                  } catch {
                    files[filename] = content;
                  }
                } else {
                  files[filename] = content;
                }
              }
            }

            setZipFiles(files);
            setResult({
              taskId: result.taskId,
              dealId: result.dealId,
              txHash: result.txHash,
              data: files['result.json'] || files['rebalance-result.json'] || files['error.json'],
              allFiles: files,
              zip: result.result, // Keep original ZIP for download
            });
                  
            console.log('📄 Extracted files:', files);
        } catch (e) {
          console.error('Failed to parse result as JSON:', e);
          //return resultText;
        }


      }


      

      //console.log(result)

      
    } catch (err: any) {
      setError(err.message || 'Failed to execute rebalance');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto z-10 py-12">
      
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl mb-4">
          <span className="text-3xl text-white">⚖️</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Direct TEE Rebalancer
        </h1>
        <p className="text-slate-500">
          Enter your iExec Protected Data pointer to initiate an autonomous session.
        </p>
      </div>
        {result && (
          <div className="bg-slate-900 rounded-lg shadow-lg p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">Execution Results</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => downloadJSON(result)} 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  <FileJson className="w-4 h-4" />
                  Download Result
                </button>
                <button 
                  onClick={() => downloadZIP(result)} 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  <Archive className="w-4 h-4" />
                  Download ZIP
                </button>
                {zipFiles['rebalance-report.txt'] && (
                  <button 
                    onClick={() => downloadReport(result, zipFiles)} 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                  >
                    <FileText className="w-4 h-4" />
                    Download Report
                  </button>
                )}
              </div>
            </div>
            
                          {/* Task Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 space-y-3 border border-gray-200">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[80px]">Task ID</span>
                  <code className="bg-white px-3 py-1.5 rounded border border-gray-300 text-sm font-mono text-gray-800 flex-1">
                    {result.taskId.slice(0, 10)}...{result.taskId.slice(-8)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(result.taskId, 'taskId')}
                    className="p-1.5 hover:bg-gray-200 rounded transition-colors group relative"
                    title="Copy Task ID"
                  >
                    {copiedId === 'taskId' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                    )}
                  </button>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[80px]">Deal ID</span>
                  <code className="bg-white px-3 py-1.5 rounded border border-gray-300 text-sm font-mono text-gray-800 flex-1">
                    {result.dealId.slice(0, 10)}...{result.dealId.slice(-8)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(result.dealId, 'dealId')}
                    className="p-1.5 hover:bg-gray-200 rounded transition-colors group relative"
                    title="Copy Deal ID"
                  >
                    {copiedId === 'dealId' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                    )}
                  </button>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[80px]">Transaction</span>
                  <a 
                    href={`https://sepolia.arbiscan.io/tx/${result.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-mono text-sm bg-white px-3 py-1.5 rounded border border-gray-300 hover:border-blue-300 transition-colors group flex-1"
                  >
                    {result.txHash.slice(0, 10)}...{result.txHash.slice(-8)}
                    <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                  </a>
                  <button
                    onClick={() => copyToClipboard(result.txHash, 'txHash')}
                    className="p-1.5 hover:bg-gray-200 rounded transition-colors group relative"
                    title="Copy Transaction Hash"
                  >
                    {copiedId === 'txHash' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                    )}
                  </button>
                </div>
              </div>
                          
            {/* Result Data */}
            {result.data && (
              <div className="space-y-4">
                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm ${
                  result.data.success 
                    ? 'bg-green-50 text-green-700 border-2 border-green-200' 
                    : 'bg-red-50 text-red-700 border-2 border-red-200'
                }`}>
                  {result.data.success 
                    ? <CheckCircle2 className="w-5 h-5" /> 
                    : <XCircle className="w-5 h-5" />
                  }
                  {result.data.success ? 'Success' : 'Failed'}
                </div>
                
                {/* No Rebalance Needed */}
                {result.data.rebalanceNeeded === false && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">No Rebalance Needed</h4>
                        <p className="text-blue-800 text-sm">{result.data.reason}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Volatility Info */}
                {result.data.volatility && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                      Volatility Analysis
                    </h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
                        <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                          Current Volatility
                        </div>
                        <div className="text-2xl font-bold text-indigo-600">
                          {result.data.volatility.current?.toFixed(2)}%
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
                        <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                          Threshold
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {result.data.volatility.threshold?.toFixed(2)}%
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
                        <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                          Risk Level
                        </div>
                        <div className="text-2xl font-bold text-purple-600 capitalize">
                          {result.data.volatility.level}
                        </div>
                      </div>
                      {result.data.volatility.annualized && (
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
                          <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                            Annualized
                          </div>
                          <div className="text-2xl font-bold text-indigo-600">
                            {result.data.volatility.annualized?.toFixed(2)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Rebalance Info */}
                {result.data.rebalance && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-amber-600" />
                      Rebalance Details
                    </h4>
                    <div className="space-y-3">
                      {result.data.rebalance.closedPositions?.length > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-amber-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                            Closed Positions
                          </span>
                          <span className="text-sm text-gray-900 font-medium">
                            {result.data.rebalance.closedPositions.join(', ')}
                          </span>
                        </div>
                      )}
                      {result.data.rebalance.newPositionTx && (
                        <div className="bg-white rounded-lg p-3 border border-amber-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                            New Position Transaction
                          </span>
                          <a 
                            href={`https://sepolia.etherscan.io/tx/${result.data.rebalance.newPositionTx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-mono text-sm break-all hover:underline group"
                          >
                            {result.data.rebalance.newPositionTx}
                            <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-50 group-hover:opacity-100" />
                          </a>
                        </div>
                      )}
                      {result.data.rebalance.message && (
                        <div className="bg-white rounded-lg p-3 border border-amber-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                            Message
                          </span>
                          <span className="text-sm text-gray-900">{result.data.rebalance.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Raw JSON (collapsible) */}
                <details className="group bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <summary className="cursor-pointer p-4 font-semibold text-gray-700 hover:bg-gray-100 transition-colors duration-200 select-none flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileJson className="w-4 h-4" />
                      View Raw JSON
                    </span>
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <pre className="p-4 text-xs overflow-x-auto bg-gray-900 text-green-400 font-mono leading-relaxed">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
            
            {/* Timestamp */}
            <div className="flex items-center gap-2 text-sm text-gray-500 pt-4 border-t border-gray-200">
              <Clock className="w-4 h-4" />
              <span>Executed at: {result.data?.timestamp || new Date().toISOString()}</span>
            </div>
          </div>
        )}

      {/* Main Execution Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700">
        <form onSubmit={handleOpenRebalance} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Protected Data Address
            </label>
            <input
              type="text"
              value={protectedDataAddress}
              onChange={(e) => setProtectedDataAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
              required
            />
            <p className="mt-2 text-xs text-slate-400">
              Provide the contract address of the data you secured via iExec.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <span>⚡</span> Configure Rebalance
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Task Tracker */}
      {taskId && (
        <div className="mt-8">
          <TaskStatus taskId={taskId} />
          <div className="mt-4 text-center">
            <a 
              href={`https://explorer.iex.ec/bellecour/task/${taskId}`}
              target="_blank"
              className="text-indigo-600 text-sm font-medium hover:underline"
            >
              View live execution on iExec Explorer →
            </a>
          </div>
        </div>
      )}

      {/* Rebalance Modal */}
      <RebalanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleExecuteRebalance}
        protectedDataName="Manual Address Entry"
      />

      {/* Executing Overlay */}
      {executing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center max-w-sm shadow-2xl">
            <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-bold mb-2">Requesting Enclave...</h3>
            <p className="text-sm text-slate-500">Signing worker order and allocating TEE hardware.</p>
          </div>
        </div>
      )}
    </div>
  );
}