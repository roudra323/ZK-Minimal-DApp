"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Shield, RefreshCw } from "lucide-react";
import { PendingVerificationsList } from "@/components/pending-verifications-list";
import { ethers } from "ethers";
import contractABI from "@/contracts/ZKPassportAuth.json"; // Assuming same contract as Home
import { useEthersWithRainbow } from "@/hooks/useEthersWithRainbow"; // Assuming same hook

interface VerificationResult {
  success: boolean;
  message: string;
  details?: {
    circuit: string;
    verifierAddress: string;
    timestamp: string;
  };
}

interface PendingVerification {
  id: string;
  type: string;
  timestamp: string;
  userId: string;
  state?: number; // Added to track auth state
  nonce: string; // Added to match the required interface
}

export default function AdminPage() {
  const [proofId, setProofId] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [recentVerifications, setRecentVerifications] = useState<
    Array<{ id: string; result: boolean; type: string; timestamp: string }>
  >([]);
  const [pendingVerifications, setPendingVerifications] = useState<
    PendingVerification[]
  >([]);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  // Get provider and signer from same hook as Home page
  const { provider, signer, isConnected, getContract } = useEthersWithRainbow();

  // Initialize contract instance
  useEffect(() => {
    if (!provider || !signer) return;

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) {
      console.error("Contract address not found in environment variables");
      return;
    }

    try {
      const contractInstance = getContract(contractAddress, contractABI.abi);
      setContract(contractInstance);
    } catch (error) {
      console.error("Error initializing contract:", error);
    }
  }, [provider, signer]);

  // Fetch verifications on mount
  useEffect(() => {
    if (contract) {
      fetchPendingVerifications();
    }
  }, [contract, isConnected]);

  const fetchPendingVerifications = async () => {
    setIsLoading(true);
    try {
      if (!contract) throw new Error("Contract not initialized");

      // Query QRCodeDataRequested events
      const filter = contract.filters.QRCodeDataRequested();
      const events = await contract.queryFilter(filter, -10000, "latest");

      const verificationPromises = events.map(async (event) => {
        console.log("Event:", event);
        const userAddress = event.args?.user;
        const authState = await contract.userAuthState(userAddress);

        let jsonInfo;

        try {
          jsonInfo = JSON.parse(event.args?.jsonInfo || "{}");
          console.log("JSON Info:", jsonInfo);
        } catch {
          jsonInfo = { rawData: event.args?.jsonInfo };
        }

        const verificationType = jsonInfo.c || "unknown";

        return {
          id: event.transactionHash, // Using tx hash as unique ID
          type: verificationType,
          timestamp: (await event.getBlock()).timestamp.toString(),
          userId: userAddress,
          state: authState,
          nonce: jsonInfo.n,
        };
      });

      const verifications = await Promise.all(verificationPromises);

      // Sort based on state
      const pending = verifications.filter((v) => v.state === 1);
      const verified = verifications.filter((v) => v.state === 3);
      const failed = verifications.filter((v) => v.state === 4);

      setPendingVerifications(pending);
      setRecentVerifications(
        [...verified, ...failed].map((v) => ({
          id: v.id,
          result: v.state === 3,
          type: v.type,
          timestamp: new Date(parseInt(v.timestamp) * 1000).toISOString(),
        }))
      );
    } catch (error) {
      console.error("Error fetching verifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePendingItemClick = async (item: PendingVerification) => {
    setProofId(item.id); // Set the proof ID for UI purposes
    await verifyProof(item.userId, item.type, item.nonce); // Call verifyProof with the required parameters
  };

  const structureProofData = (proof: any) => {
    const proofInput = {
      a: {
        X: BigInt(proof.proof.a[0]),
        Y: BigInt(proof.proof.a[1]),
      },
      b: {
        X: [BigInt(proof.proof.b[0][0]), BigInt(proof.proof.b[0][1])],
        Y: [BigInt(proof.proof.b[1][0]), BigInt(proof.proof.b[1][1])],
      },
      c: {
        X: BigInt(proof.proof.c[0]),
        Y: BigInt(proof.proof.c[1]),
      },
    };

    const inputArray = [BigInt(proof.inputs[0]), BigInt(proof.inputs[1])];

    return { proofInput, inputArray };
  };

  const verifyProofWithData: (
    proofId: string,
    circuitAddress: string,
    proofJson: any,
    user_id: string
  ) => Promise<void> = async (
    proofId: string,
    circuitAddress: string,
    proofJson: any,
    user_id: string
  ) => {
    try {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      console.log("Proof Data", proofJson);

      // Structure the proof data
      const { proofInput, inputArray } = structureProofData(proofJson);

      // Listen for the AuthenticationVerified event
      const filter = contract.filters.AuthenticationVerified(user_id);
      contract.once(filter, (user, circuitName, success) => {
        console.log("AuthenticationVerified event received:", {
          user,
          circuitName,
          success,
        });

        // Show toast notification based on success
        if (success) {
          toast({
            title: "Verification Successful",
            description: `Circuit: ${circuitName}`,
            variant: "default",
          });
        } else {
          toast({
            title: "Verification Failed",
            description: `Circuit: ${circuitName}`,
            variant: "destructive",
          });
        }

        // Update the verification result
        setVerificationResult({
          success,
          message: success ? "Verification successful" : "Verification failed",
          details: {
            circuit: circuitName,
            verifierAddress: circuitAddress,
            timestamp: new Date().toISOString(),
          },
        });

        // Remove the verified item from pending verifications if successful
        if (success) {
          setPendingVerifications((prev) =>
            prev.filter((item) => item.id !== proofId)
          );
        }
      });

      // Call the validateProof function on the contract
      console.log("Calling validateProof with:", {
        proofInput,
        inputArray,
        user_id,
      });
      const tx = await contract.validateProof(proofInput, inputArray, user_id);
      await tx.wait(); // Wait for the transaction to be mined

      console.log("Transaction confirmed:", tx.hash);
    } catch (error) {
      console.error("Error verifying proof:", error);

      // Show error toast
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });

      // Update the verification result with failure
      setVerificationResult({
        success: false,
        message: "Error occurred during verification",
      });
    }
  };

  const verifyProof = async (user_id: string, type: string, nonces: string) => {
    setIsVerifying(true);
    try {
      // In a real implementation, this would call your API to get the proof details
      // http://localhost:3000/api/get-proof?user_id=user123&type=age&nonces=nonces123
      const response = await fetch(
        `http://localhost:3000/api/get-proof?user_id=${user_id}&type=${type}&nonces=${nonces}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch proof details");
      }

      const data = await response.json();
      console.log("Responce :", data);

      // Call the verification function with the fetched data
      await verifyProofWithData(
        `${user_id}-${type}-${nonces}`, // Use a unique ID based on the parameters
        data.address,
        data.proof,
        user_id
      );
    } catch (error) {
      console.error("Error verifying proof:", error);
      setVerificationResult({
        success: false,
        message: "Error occurred during verification",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-4 md:p-8">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold">ZK Passport Admin</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
          >
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Verifications</CardTitle>
                    <CardDescription>
                      Users waiting for verification
                    </CardDescription>
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
                      disabled={isLoading || !contract}
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

              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Verification Result</CardTitle>
                    <CardDescription>
                      The result of the zero-knowledge proof verification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {verificationResult ? (
                      <div className="space-y-4">
                        <Alert
                          variant={
                            verificationResult.success
                              ? "default"
                              : "destructive"
                          }
                        >
                          {verificationResult.success ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          <AlertTitle>
                            {verificationResult.success
                              ? "Verification Successful"
                              : "Verification Failed"}
                          </AlertTitle>
                          <AlertDescription>
                            {verificationResult.message}
                          </AlertDescription>
                        </Alert>

                        {verificationResult.details && (
                          <div className="pt-2 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Circuit:</span>
                              <span className="font-mono">
                                {verificationResult.details.circuit}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Verifier Address:
                              </span>
                              <span className="font-mono">
                                {verificationResult.details.verifierAddress}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Timestamp:</span>
                              <span>
                                {new Date(
                                  verificationResult.details.timestamp
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        <p>No verification performed yet</p>
                        <p className="text-sm mt-2">
                          Select a pending verification from the list
                        </p>
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
                  <CardDescription>
                    Enter the proof ID and contract address to verify
                  </CardDescription>
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
                    <Label htmlFor="contract-address">
                      Verifier Contract Address (Optional)
                    </Label>
                    <Input
                      id="contract-address"
                      placeholder="0x..."
                      value={contractAddress}
                      onChange={(e) => setContractAddress(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      If left empty, the system will use the default verifier
                      for the proof type
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    // onClick={verifyProof}
                    disabled={isVerifying || !proofId}
                  >
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
                  <CardDescription>
                    The result of the zero-knowledge proof verification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {verificationResult ? (
                    <div className="space-y-4">
                      <Alert
                        variant={
                          verificationResult.success ? "default" : "destructive"
                        }
                      >
                        {verificationResult.success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>
                          {verificationResult.success
                            ? "Verification Successful"
                            : "Verification Failed"}
                        </AlertTitle>
                        <AlertDescription>
                          {verificationResult.message}
                        </AlertDescription>
                      </Alert>

                      {verificationResult.details && (
                        <div className="pt-2 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Circuit:</span>
                            <span className="font-mono">
                              {verificationResult.details.circuit}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              Verifier Address:
                            </span>
                            <span className="font-mono">
                              {verificationResult.details.verifierAddress}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Timestamp:</span>
                            <span>
                              {new Date(
                                verificationResult.details.timestamp
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                      <p>No verification performed yet</p>
                      <p className="text-sm mt-2">
                        Enter a proof ID and click verify
                      </p>
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
                <CardDescription>
                  History of recent verification attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentVerifications.length > 0 ? (
                  <div className="space-y-4">
                    {recentVerifications.map((verification, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center">
                          {verification.result ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          <div>
                            <p className="font-medium">{verification.id}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(
                                verification.timestamp
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Badge
                            variant={
                              verification.result ? "default" : "destructive"
                            }
                          >
                            {verification.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <p>No verification history</p>
                    <p className="text-sm mt-2">
                      Verification records will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
function toast(arg0: { title: string; description: string; variant: string }) {
  throw new Error("Function not implemented.");
}
