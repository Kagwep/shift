

  // Network configurations for testnet
  export const testnetNetworks = {
    ethereum: {
      name: 'Ethereum Sepolia',
      chainId: 11155111, // Sepolia testnet
      bridgeAddress: '0xebb79a1d00b2d489f53adee985a2ded2a3553f22', // L1StandardBridge on Sepolia
      rpcUrl: 'https://eth-sepolia.public.blastapi.io',
      blockExplorer: 'https://sepolia.etherscan.io'
    }
  };

    // Network configurations for mainnet
  export const mainnetNetworks = {
    ethereum: {
      name: 'Ethereum Mainnet',
      chainId: 1, // Ethereum mainnet
      bridgeAddress: '0x7aA4960908B13D104bf056B23E2C76B43c5AACc8', // L1StandardBridgeProxy on Mainnet
      rpcUrl: 'https://eth-mainnet.public.blastapi.io',
      blockExplorer: 'https://etherscan.io'
    }
};