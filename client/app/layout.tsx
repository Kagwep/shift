import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import WalletButton from '../components/WalletButton';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shift Protocol - Intelligent Liquidity Management',
  description: 'AI-powered Uniswap V3 rebalancing in a Trusted Execution Environment with real-time volatility predictions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen`}>
        
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              
              {/* Logo & Brand */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    Shift Agent
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Intelligent Liquidity Management
                  </p>
                </div>
              </div>
              
              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                <a 
                  href="https://docs.iex.ec" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-slate-600 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400 transition-colors"
                >
                  Documentation
                </a>
                <a 
                  href="https://explorer.iex.ec" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-slate-600 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400 transition-colors"
                >
                  Explorer
                </a>
                
                {/* Wallet Button */}
                <WalletButton />
              </nav>

              {/* Mobile Wallet Button */}
              <div className="md:hidden">
                <WalletButton />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">🔒</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Security First
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your private keys are encrypted and only decrypted inside the TEE. 
                  No sensitive data leaves the secure enclave.
                </p>
              </div>

              <div className="group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">⚡</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Powered by iExec
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Built on iExec's Trusted Execution Environment. 
                  Leveraging decentralized compute for secure DeFi operations.
                </p>
              </div>

              <div className="group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">🤖</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    AI-Driven Strategy
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Real-time volatility predictions power intelligent rebalancing decisions. 
                  Optimize your liquidity positions automatically.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 mb-8"></div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                © {new Date().getFullYear()} Shift Protocol. Built with iExec TEE.
              </p>

              <div className="flex items-center gap-6">
                <a 
                  href="https://github.com/your-repo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a 
                  href="https://twitter.com/iexec" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400 text-lg">ℹ️</span>
                <div>
                  <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
                    Testnet Environment
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    This application is running on Arbitrum Sepolia testnet. Use only test tokens. 
                    The application is provided "as is" for educational purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}