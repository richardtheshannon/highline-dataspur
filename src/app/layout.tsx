// src/app/layout.tsx

import type { Metadata } from "next";
import { Ubuntu, Open_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

// Configure the title font: Ubuntu
const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-ubuntu",
  display: 'swap',
});

// Configure the paragraph font: Open Sans
const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Highline DataSpur",
  description: "A comprehensive project management application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={cn(
          "h-full flex flex-col bg-background font-serif antialiased", // Default font will be set in globals.css
          ubuntu.variable,
          openSans.variable
        )}
      >
        <Providers>
            {children}
            <Toaster />
        </Providers>
      </body>
    </html>
  );
}
