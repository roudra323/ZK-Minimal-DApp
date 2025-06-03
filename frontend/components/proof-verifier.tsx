"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"

interface VerificationResult {
  success: boolean
  message: string
  details?: {
    circuit: string
    verifierAddress: string
    timestamp: string
  }
}

interface ProofVerifierProps {
  onVerificationComplete?: (result: VerificationResult) => void
}

export function ProofVerifier({ onVerificationComplete }: ProofVerifierProps) {
  const [proofId, setProofId] = useState("")
  const [contractAddress, setContractAddress] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)

  const verifyProof = async () => {
    if (!proofId) return

    setIsVerifying(true)
    try {
      // In a real implementation, this would call your API
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proofId,
          contractAddress: contractAddress || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Verification failed")
      }

      const result = await response.json()
      setVerificationResult(result)

      if (onVerificationComplete) {
        onVerificationComplete(result)
      }
    } catch (error) {
      console.error("Error verifying proof:", error)
      setVerificationResult({
        success: false,
        message: "Error occurred during verification",
      })

      if (onVerificationComplete) {
        onVerificationComplete({
          success: false,
          message: "Error occurred during verification",
        })
      }
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="proof-id">Proof ID</Label>
        <Input
          id="proof-id"
          placeholder="Enter proof ID"
          value={proofId}
          onChange={(e) => setProofId(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contract-address">Verifier Contract Address (Optional)</Label>
        <Input
          id="contract-address"
          placeholder="0x..."
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          If left empty, the system will use the default verifier for the proof type
        </p>
      </div>

      {verificationResult && (
        <Alert variant={verificationResult.success ? "default" : "destructive"}>
          {verificationResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertTitle>{verificationResult.success ? "Verification Successful" : "Verification Failed"}</AlertTitle>
          <AlertDescription>{verificationResult.message}</AlertDescription>
        </Alert>
      )}

      <Button className="w-full" onClick={verifyProof} disabled={isVerifying || !proofId}>
        {isVerifying ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify Proof"
        )}
      </Button>
    </div>
  )
}

