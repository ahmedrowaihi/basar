import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Basar Examples",
  description: "Examples of using Basar for content detection",
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
        <nav className="bg-white shadow-sm border-b">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="font-bold text-gray-900 text-xl">
                  🧠 Basar Examples
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="px-3 py-2 rounded-md font-medium text-gray-700 hover:text-gray-900 text-sm"
                >
                  File Upload
                </Link>
                <Link
                  href="/basar-image"
                  className="px-3 py-2 rounded-md font-medium text-gray-700 hover:text-gray-900 text-sm"
                >
                  Image Component
                </Link>
                <Link
                  href="/hook-example"
                  className="px-3 py-2 rounded-md font-medium text-gray-700 hover:text-gray-900 text-sm"
                >
                  Hook Example
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
