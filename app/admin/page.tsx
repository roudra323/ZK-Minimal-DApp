"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Shield, RefreshCw } from "lucide-react"
import { PendingVerificationsList } from "@/components/pending-verifications-list"

interface VerificationResult {
  success: boolean
  message: string
  details?: {
    circuit: string
    verifierAddress: string
    timestamp: string
  }
}

interface PendingVerification {
  id: string
  type: string
  timestamp: string
  userId: string
}

export default function AdminPage() {
  const [proofId, setProofId] = useState("")
  const [contractAddress, setContractAddress] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [recentVerifications, setRecentVerifications] = useState<
    Array<{ id: string; result: boolean; type: string; timestamp: string }>
  >([])
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([])

  // Fetch pending verifications on component mount
  useEffect(() => {
    fetchPendingVerifications()
  }, [])

  const fetchPendingVerifications = async () => {
    setIsLoading(true)
    try {
      // In a real implementation, this would call your API to get pending verifications
      // For demo purposes, we'll simulate a response
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockPendingVerifications: PendingVerification[] = [
        {
          id: "proof-" + Math.random().toString(36).substring(2, 10),
          type: "age",
          timestamp: new Date().toISOString(),
          userId: "user-123",
        },
        {
          id: "proof-" + Math.random().toString(36).substring(2, 10),
          type: "nationality",
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
          userId: "user-456",
        },
        {
          id: "proof-" + Math.random().toString(36).substring(2, 10),
          type: "document",
          timestamp: new Date(Date.now() - 120 * 60000).toISOString(), // 2 hours ago
          userId: "user-789",
        },
      ]

      setPendingVerifications(mockPendingVerifications)
    } catch (error) {
      console.error("Error fetching pending verifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePendingItemClick = async (item: PendingVerification) => {
    setProofId(item.id)
    setIsVerifying(true)

    try {
      // In a real implementation, this would call your node server API
      // to get the proof.json and verifier contract address
      const response = await fetch(`/api/proof-details?id=${item.id}`)

      if (!response.ok) {
        throw new Error("Failed to fetch proof details")
      }

      const data = await response.json()

      // Set the contract address from the response
      setContractAddress(data.verifierAddress)

      // Verify the proof using the fetched data
      await verifyProofWithData(item.id, data.verifierAddress, data.proofJson)
    } catch (error) {
      console.error("Error handling pending verification:", error)
      setVerificationResult({
        success: false,
        message: "Error fetching proof details",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const verifyProofWithData = async (proofId: string, verifierAddress: string, proofJson: any) => {
    try {
      // In a real implementation, this would:
      // 1. Use the existing verifier.sol contract in the DApp
      // 2. Cross-check the verification address
      // 3. Call the verifyTx function with the proof data

      // For demo purposes, we'll simulate a verification
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const mockResult: VerificationResult = {
        success: Math.random() > 0.2, // 80% chance of success for demo
        message: Math.random() > 0.2 ? "Verification successful" : "Verification failed",
        details: {
          circuit: proofId.includes("age") ? "age" : proofId.includes("nationality") ? "nationality" : "document",
          verifierAddress: verifierAddress,
          timestamp: new Date().toISOString(),
        },
      }

      setVerificationResult(mockResult)

      // Add to recent verifications
      setRecentVerifications((prev) => [
        {
          id: proofId,
          result: mockResult.success,
          type: mockResult.details?.circuit || "unknown",
          timestamp: new Date().toISOString(),
        },
        ...prev.slice(0, 4), // Keep only the 5 most recent
      ])

      // Remove from pending if successful
      if (mockResult.success) {
        setPendingVerifications((prev) => prev.filter((item) => item.id !== proofId))
      }
    } catch (error) {
      console.error("Error verifying proof:", error)
      setVerificationResult({
        success: false,
        message: "Error occurred during verification",
      })
    }
  }

  const verifyProof = async () => {
    if (!proofId) return

    setIsVerifying(true)
    try {
      // In a real implementation, this would call your API to get the proof details
      const response = await fetch(`/api/proof-details?id=${proofId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch proof details")
      }

      const data = await response.json()

      // Verify the proof using the fetched data
      await verifyProofWithData(proofId, contractAddress || data.verifierAddress, data.proofJson)
    } catch (error) {
      console.error("Error verifying proof:", error)
      setVerificationResult({
        success: false,
        message: "Error occurred during verification",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col p-4 md:p-8">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold">ZK Passport Admin</h1>
          </div>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Back to Home
          </Button>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Pending Verifications</TabsTrigger>
            <TabsTrigger value="verify">Manual Verification</TabsTrigger>
            <TabsTrigger value="history">Verification History</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Verifications</CardTitle>
                    <CardDescription>Users waiting for verification</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PendingVerificationsList
                      items={pendingVerifications}
                      isLoading={isLoading}
                      onItemClick={handlePendingItemClick}
                      onRefresh={fetchPendingVerifications}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={fetchPendingVerifications}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh List
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Verification Result</CardTitle>
                    <CardDescription>The result of the zero-knowledge proof verification</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {verificationResult ? (
                      <div className="space-y-4">
                        <Alert variant={verificationResult.success ? "default" : "destructive"}>
                          {verificationResult.success ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          <AlertTitle>
                            {verificationResult.success ? "Verification Successful" : "Verification Failed"}
                          </AlertTitle>
                          <AlertDescription>{verificationResult.message}</AlertDescription>
                        </Alert>

                        {verificationResult.details && (
                          <div className="pt-2 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Circuit:</span>
                              <span className="font-mono">{verificationResult.details.circuit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Verifier Address:</span>
                              <span className="font-mono">{verificationResult.details.verifierAddress}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Timestamp:</span>
                              <span>{new Date(verificationResult.details.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        <p>No verification performed yet</p>
                        <p className="text-sm mt-2">Select a pending verification from the list</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="verify">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verify ZK Proof</CardTitle>
                  <CardDescription>Enter the proof ID and contract address to verify</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
                <CardFooter>
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
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Verification Result</CardTitle>
                  <CardDescription>The result of the zero-knowledge proof verification</CardDescription>
                </CardHeader>
                <CardContent>
                  {verificationResult ? (
                    <div className="space-y-4">
                      <Alert variant={verificationResult.success ? "default" : "destructive"}>
                        {verificationResult.success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>
                          {verificationResult.success ? "Verification Successful" : "Verification Failed"}
                        </AlertTitle>
                        <AlertDescription>{verificationResult.message}</AlertDescription>
                      </Alert>

                      {verificationResult.details && (
                        <div className="pt-2 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Circuit:</span>
                            <span className="font-mono">{verificationResult.details.circuit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Verifier Address:</span>
                            <span className="font-mono">{verificationResult.details.verifierAddress}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Timestamp:</span>
                            <span>{new Date(verificationResult.details.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                      <p>No verification performed yet</p>
                      <p className="text-sm mt-2">Enter a proof ID and click verify</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Recent Verifications</CardTitle>
                <CardDescription>History of recent verification attempts</CardDescription>
              </CardHeader>
              <CardContent>
                {recentVerifications.length > 0 ? (
                  <div className="space-y-4">
                    {recentVerifications.map((verification, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center">
                          {verification.result ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          <div>
                            <p className="font-medium">{verification.id}</p>
                            <p className="text-sm text-gray-500">{new Date(verification.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Badge variant={verification.result ? "default" : "destructive"}>{verification.type}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <p>No verification history</p>
                    <p className="text-sm mt-2">Verification records will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

