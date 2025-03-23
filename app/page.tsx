"use client";

import { useState } from "react";
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
import { Shield, AlertTriangle } from "lucide-react";

import { useAccount } from "wagmi";
import { useEthersWithRainbow } from "@/hooks/useEthersWithRainbow";

export default function Home() {
  const [qrData, setQrData] = useState<string | null>(null);
  const [verificationType, setVerificationType] = useState<string>("age");
  const [isLoading, setIsLoading] = useState(false);

  const { address, isConnected } = useAccount();
  console.log("Connected wallet address:", address);
  console.log("Is connected:", isConnected);

  const generateQrCode = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call your API to generate the verification request
      const verificationData = {
        type: verificationType,
        requestId: `req-${Math.random().toString(36).substring(2, 10)}`,
        timestamp: Date.now(),
        // For age verification, we might specify the minimum age required
        params: verificationType === "age" ? { minAge: 18 } : {},
      };

      // Convert to JSON string for QR code
      setQrData(JSON.stringify(verificationData));
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setIsLoading(false);
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

            {qrData && (
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                <QRCodeSVG value={qrData} size={200} />
                <p className="mt-2 text-sm text-gray-500">
                  Scan with ZK Passport App
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={generateQrCode}
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate QR Code"}
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
