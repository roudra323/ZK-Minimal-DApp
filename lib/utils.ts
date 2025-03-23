import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to interact with the blockchain
// In a real implementation, this would use ethers.js or web3.js
export async function verifyProofOnChain(contractAddress: string, proof: any) {
  try {
    // This is a placeholder for the actual blockchain interaction
    console.log(`Verifying proof on contract ${contractAddress}`)

    // Simulate blockchain verification
    return {
      success: true,
      transactionHash: `0x${Math.random().toString(36).substring(2, 15)}`,
    }
  } catch (error) {
    console.error("Error verifying proof on chain:", error)
    throw error
  }
}

// Helper function to fetch proof from the Node.js server
export async function fetchProof(proofId: string) {
  try {
    // This is a placeholder for the actual API call
    console.log(`Fetching proof with ID ${proofId}`)

    // Simulate API response
    return {
      proofJson: {
        // This would be the actual proof.json structure
        proof: {
          a: ["0x123", "0x456"],
          b: [
            ["0x789", "0xabc"],
            ["0xdef", "0x123"],
          ],
          c: ["0x456", "0x789"],
        },
        inputs: ["0x1", "0x0"],
      },
      circuit: "age",
      verifierAddress: "0x1234...5678",
    }
  } catch (error) {
    console.error("Error fetching proof:", error)
    throw error
  }
}

