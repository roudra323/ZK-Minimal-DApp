// hooks/useEthersWithRainbow.tsx
"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

export function useEthersWithRainbow() {
  const { address, isConnected } = useAccount();
  // Change the type to accept all providers, not just Web3Provider
  const [provider, setProvider] = useState<ethers.providers.Provider | null>(
    null
  );
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    if (isConnected && window.ethereum) {
      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(ethersProvider);
      setSigner(ethersProvider.getSigner());
    } else {
      // Fallback to a read-only provider when not connected
      const fallbackProvider = new ethers.providers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"
      );
      setProvider(fallbackProvider);
      setSigner(null);
    }
  }, [isConnected, address]);

  // Function to get contract instance for both read and write operations
  const getContract = (contractAddress: string, contractABI: any) => {
    if (signer) {
      // Use signer for write operations when wallet is connected
      return new ethers.Contract(contractAddress, contractABI, signer);
    } else if (provider) {
      // Use provider for read-only operations
      return new ethers.Contract(contractAddress, contractABI, provider);
    }
    return null;
  };

  return {
    address,
    isConnected,
    provider,
    signer,
    getContract,
  };
}
