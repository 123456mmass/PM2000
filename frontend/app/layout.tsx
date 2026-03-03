import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ErrorBoundary } from "@/components/common";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PM2230 Dashboard",
  description: "ระบบแสดงผลค่าพารามิเตอร์ไฟฟ้า PM2230 Digital Meter",
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
        <ErrorBoundary fallback={
          <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-red-50 dark:bg-red-900/10">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              เกิดข้อผิดพลาด
            </h3>
            <p className="text-red-600 dark:text-red-400 text-center max-w-md">
              กรุณาลองโหลดหน้าใหม่อีกครั้ง
            </p>
          </div>
        }>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
