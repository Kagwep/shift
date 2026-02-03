import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../theme';
import Grid2 from '@mui/material/Unstable_Grid2';
import { Box, Container, Typography, Link, Divider, Alert } from '@mui/material';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TEE Uniswap Rebalancer - Volatility-based Liquidity Management',
  description: 'Execute Uniswap V3 position rebalancing in a Trusted Execution Environment based on real-time volatility predictions',
  keywords: ['iExec', 'TEE', 'Uniswap', 'Rebalancer', 'DeFi', 'Arbitrum', 'Volatility'],
  authors: [{ name: 'Shift TEE Team' }],
  openGraph: {
    type: 'website',
    title: 'TEE Uniswap Rebalancer',
    description: 'Secure DeFi rebalancing in Trusted Execution Environment',
    siteName: 'TEE Uniswap Rebalancer',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            
            {/* Header */}
            <Box 
              component="header"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                py: 2,
                mb: 4,
                boxShadow: 3,
              }}
            >
              <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                      🔄 TEE Uniswap Rebalancer
                    </Typography>
                    <Typography variant="subtitle1">
                      Volatility-based liquidity management in Trusted Execution Environment
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Link 
                      href="https://docs.iex.ec" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ color: 'white', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      iExec Docs
                    </Link>
                    <Link 
                      href="https://explorer.iex.ec" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ color: 'white', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Explorer
                    </Link>
                  </Box>
                </Box>
              </Container>
            </Box>

            {/* Main Content */}
            <Container maxWidth="lg" component="main">
              {children}
            </Container>

            {/* Footer */}
            <Box 
              component="footer"
              sx={{
                mt: 8,
                py: 3,
                borderTop: 1,
                borderColor: 'divider',
                backgroundColor: 'background.paper',
              }}
            >
              <Container maxWidth="lg">
                <Grid2 container spacing={4}>
                  <Grid2 xs={12} md={4}>
                    <Typography variant="h6" gutterBottom>
                      🔒 Security First
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your private keys are encrypted and only decrypted inside the TEE.
                      No sensitive data leaves the secure enclave.
                    </Typography>
                  </Grid2>

                  <Grid2 xs={12} md={4}>
                    <Typography variant="h6" gutterBottom>
                      ⚡ Powered by iExec
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Built on iExec's Trusted Execution Environment.
                      Leveraging decentralized compute for secure DeFi operations.
                    </Typography>
                  </Grid2>

                  <Grid2 xs={12} md={4}>
                    <Typography variant="h6" gutterBottom>
                      🌐 Testnet Ready
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Currently running on Arbitrum Sepolia testnet.
                      Use test tokens to experiment safely.
                    </Typography>
                  </Grid2>
                </Grid2>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary">
                    © {new Date().getFullYear()} TEE Uniswap Rebalancer. Built for educational purposes.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Link 
                      href="https://github.com/your-repo" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      color="inherit"
                    >
                      GitHub
                    </Link>
                    <Link 
                      href="https://twitter.com/iexec" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      color="inherit"
                    >
                      Twitter
                    </Link>
                    <Link 
                      href="https://discord.gg/iexec" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      color="inherit"
                    >
                      Discord
                    </Link>
                  </Box>
                </Box>

                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="caption">
                    ⚠️ This is a testnet application. Use only test tokens. 
                    The application is provided "as is" without warranty of any kind.
                  </Typography>
                </Alert>
              </Container>
            </Box>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}