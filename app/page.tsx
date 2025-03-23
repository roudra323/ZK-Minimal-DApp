"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Shield, AlertTriangle, Loader2 } from "lucide-react";
import { ethers } from "ethers";
import contractABI from "@/contracts/ZKPassportAuth.json";
import { useToast } from "@/components/ui/use-toast";

import { useAccount } from "wagmi";
import { useEthersWithRainbow } from "@/hooks/useEthersWithRainbow";

export default function Home() {
  const [qrData, setQrData] = useState<string | null>(null);
  const [verificationType, setVerificationType] = useState<string>("age");
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [eventData, setEventData] = useState<any | null>(null);

  const { toast } = useToast();
  const { provider, signer, address, isConnected, getContract } =
    useEthersWithRainbow();

  console.log("Connected wallet address:", address);
  console.log("Is connected:", isConnected);

  // Initialize contract instance
  useEffect(() => {
    if (!provider || !signer) return;

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) {
      console.error("Contract address not found in environment variables");
      return;
    }

    try {
      const contractInstance = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      );
      setContract(contractInstance);
      console.log("Contract instance created:", contractInstance);
    } catch (error) {
      console.error("Error initializing contract:", error);
    }
  }, [provider, signer]);

  // Listen for contract events when transaction hash changes
  // Updated useEffect for transaction handling
  useEffect(() => {
    if (!txHash || !provider || !contract) return;

    const checkTransaction = async () => {
      try {
        // Check if transaction is mined
        const receipt = await provider.getTransactionReceipt(txHash);

        if (!receipt) {
          // Transaction not yet mined, check again after a delay
          console.log("Transaction pending, checking again in 2 seconds...");
          setTimeout(checkTransaction, 2000);
          return;
        }

        console.log("Transaction confirmed! Receipt:", receipt);

        // Check if transaction was successful
        if (receipt.status === 0) {
          throw new Error("Transaction failed");
        }

        // Extract event data - targeting QRCodeDataRequested specifically
        const logs = receipt.logs.filter(
          (log) => log.address.toLowerCase() === contract.address.toLowerCase()
        );

        console.log("Contract logs:", logs);

        // Try to parse each log looking for QRCodeDataRequested event
        let qrEvent = null;
        for (const log of logs) {
          try {
            const parsedLog = contract.interface.parseLog(log);
            console.log("Parsed log:", parsedLog);

            // Check specifically for QRCodeDataRequested event
            if (parsedLog && parsedLog.name === "QRCodeDataRequested") {
              qrEvent = parsedLog;
              break;
            }
          } catch (e) {
            console.log("Could not parse log:", e);
          }
        }

        if (qrEvent) {
          console.log("Found QRCodeDataRequested event:", qrEvent);

          // Extract data from the event
          const user = qrEvent.args.user;
          let jsonInfo;

          try {
            // The jsonInfo should be a string that contains JSON data
            // Try to parse it as JSON
            jsonInfo = JSON.parse(qrEvent.args.jsonInfo);
            console.log("Parsed JSON info:", jsonInfo);
          } catch (e) {
            console.log("Could not parse jsonInfo as JSON:", e);
            // If it's not valid JSON, use it as a string
            jsonInfo = { rawData: qrEvent.args.jsonInfo };
          }

          // Store the event data
          setEventData({
            user,
            jsonInfo,
          });

          // console.log("Event data:", eventData);

          // We'll use the provided JSON info for the QR code if it's valid,
          // otherwise we'll create our own data structure
          const qrCodeData =
            typeof jsonInfo === "object"
              ? { ...jsonInfo }
              : {
                  s: "man",
                  c: "age",
                  p: {
                    a: 18,
                    m: true,
                  },
                  n: "571385",
                  u: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
                };

          // Convert to JSON string for QR code
          setQrData(JSON.stringify(qrCodeData));
          setIsLoading(false);

          toast({
            title: "QR Code Data Received",
            description: `User: ${user}`,
          });
        } else {
          // Fallback if we couldn't find the specific event but transaction succeeded
          console.log(
            "Transaction successful but couldn't find QRCodeDataRequested event"
          );
          const fallbackData = {
            s: "man",
            c: "age",
            p: {
              a: 18,
              m: true,
            },
            n: "571385",
            u: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          };

          setQrData(JSON.stringify(fallbackData));
          setIsLoading(false);

          toast({
            title: "QR Code Generated",
            description: "Transaction confirmed, but event data not found",
          });
        }
      } catch (error) {
        console.error("Error processing transaction:", error);
        setIsLoading(false);

        toast({
          title: "Error",
          description:
            "Failed to process transaction: " +
            (error instanceof Error ? error.message : "Unknown error"),
          variant: "destructive",
        });
      }
    };

    // Start checking transaction
    checkTransaction();

    // Add a timeout to stop checking after 2 minutes
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        toast({
          title: "Transaction Timeout",
          description:
            "Transaction is taking too long. Check Etherscan for status.",
          variant: "destructive",
        });
      }
    }, 120000); // 2 minutes

    // Clean up timeout on unmount or when txHash changes
    return () => clearTimeout(timeoutId);
  }, [txHash, provider, contract, verificationType, address, isLoading]);

  const generateQrCode = async () => {
    if (!contract || !address) {
      toast({
        title: "Error",
        description: "Contract not initialized or wallet not connected",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setQrData(null);
    setEventData(null);

    try {
      // Call contract method to create verification request
      // Adjust parameters according to your contract method
      const tx = await contract.genQRCodeInfo();

      console.log("Transaction sent:", tx.hash);
      setTxHash(tx.hash);

      toast({
        title: "Transaction Submitted",
        description: "Please wait for confirmation",
      });
    } catch (error) {
      console.error("Error creating verification request:", error);
      setIsLoading(false);

      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (!isConnected) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <CardTitle className="mt-4">Wallet Not Connected</CardTitle>
            <CardDescription>
              Please connect your wallet to access this application.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              Connect your wallet using the button in the top right corner.
            </p>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-3xl font-bold">ZK Passport Auth</h1>
          <p className="mt-2 text-gray-600">
            Secure identity verification without revealing personal data
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Request Verification</CardTitle>
            <CardDescription>
              Generate a QR code for zero-knowledge verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-type">Verification Type</Label>
              <Select
                value={verificationType}
                onValueChange={setVerificationType}
              >
                <SelectTrigger id="verification-type">
                  <SelectValue placeholder="Select verification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="age">Age Verification</SelectItem>
                  <SelectItem value="nationality">
                    Nationality Verification
                  </SelectItem>
                  <SelectItem value="document">Document Validity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {txHash && !qrData && (
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-sm text-gray-500">
                  Waiting for transaction confirmation...
                </p>
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 mt-1 hover:underline"
                >
                  View on Etherscan
                </a>
              </div>
            )}

            {qrData && (
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                <QRCodeSVG value={qrData} size={200} />
                <p className="mt-2 text-sm text-gray-500">
                  Scan with ZK Passport App
                </p>
                {eventData && (
                  <div className="mt-2 text-xs text-gray-600 w-full">
                    {/* console.log(eventData); */}
                    <p>Nonces: {eventData.jsonInfo.n?.toString()}</p>
                    {/* Display other relevant event data */}
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={generateQrCode}
              disabled={isLoading || !contract || eventData != null}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Generate QR Code"
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="text-center mt-8">
          <Button
            variant="outline"
            className="text-sm"
            onClick={() => (window.location.href = "/admin")}
          >
            Admin Verification Panel
          </Button>
        </div>
      </div>
    </main>
  );
}
