import type { Metadata } from "next";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css"; // Add this for RainbowKit styles
import { RainbowKitProvider } from "@/components/RainbowKitProvider";
import { ConnectWalletButton } from "@/components/ui/connect-button";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <RainbowKitProvider>
          <header className="p-2">
            <div className="container mx-auto flex justify-end items-center">
              <ConnectWalletButton />
            </div>
          </header>
          <main className="container mx-auto p-4">{children}</main>
          <Toaster />
        </RainbowKitProvider>
      </body>
    </html>
  );
}
