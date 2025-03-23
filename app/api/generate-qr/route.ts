import { NextResponse } from "next/server"

// This would be a server-side API route to handle QR code generation requests
// In a real implementation, this would interact with your Node.js server

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type } = body

    if (!type) {
      return NextResponse.json({ error: "Verification type is required" }, { status: 400 })
    }

    // In a real implementation, you would:
    // 1. Generate a unique request ID
    // 2. Store the request in your database
    // 3. Return the data to be encoded in the QR code

    const verificationData = {
      type,
      requestId: `req-${Math.random().toString(36).substring(2, 10)}`,
      timestamp: Date.now(),
      // For age verification, we might specify the minimum age required
      params: type === "age" ? { minAge: 18 } : {},
    }

    return NextResponse.json(verificationData)
  } catch (error) {
    console.error("Error generating QR code data:", error)
    return NextResponse.json({ error: "Failed to generate QR code data" }, { status: 500 })
  }
}

