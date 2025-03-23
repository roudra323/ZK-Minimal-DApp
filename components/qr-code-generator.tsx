"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface QrCodeGeneratorProps {
  onGenerate?: (data: string) => void
}

export function QrCodeGenerator({ onGenerate }: QrCodeGeneratorProps) {
  const [qrData, setQrData] = useState<string | null>(null)
  const [verificationType, setVerificationType] = useState<string>("age")
  const [isLoading, setIsLoading] = useState(false)

  const generateQrCode = async () => {
    setIsLoading(true)
    try {
      // In a real implementation, this would call your API
      const response = await fetch("/api/generate-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: verificationType }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate QR code")
      }

      const data = await response.json()
      const qrString = JSON.stringify(data)

      setQrData(qrString)
      if (onGenerate) {
        onGenerate(qrString)
      }
    } catch (error) {
      console.error("Error generating QR code:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="verification-type">Verification Type</Label>
        <Select value={verificationType} onValueChange={setVerificationType}>
          <SelectTrigger id="verification-type">
            <SelectValue placeholder="Select verification type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="age">Age Verification</SelectItem>
            <SelectItem value="nationality">Nationality Verification</SelectItem>
            <SelectItem value="document">Document Validity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {qrData && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-4">
            <QRCodeSVG value={qrData} size={200} />
            <p className="mt-2 text-sm text-gray-500">Scan with ZK Passport App</p>
          </CardContent>
        </Card>
      )}

      <Button className="w-full" onClick={generateQrCode} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate QR Code"}
      </Button>
    </div>
  )
}

