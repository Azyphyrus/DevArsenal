import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/lib/SidebarContext";
import { AuthProvider } from "@/lib/AuthContext";
import SyncInitializer from "@/components/SyncInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevToolbox — Developer Tools",
  description: "A toolbox of developer utilities with Google sign-in and cross-device sync.",
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SyncInitializer>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </SyncInitializer>
        </AuthProvider>
      </body>
    </html>
  );
}