import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "LOWKEY OTP | Fast OTP Verification Numbers",
    template: "%s | LOWKEY OTP",
  },
  description:
    "LOWKEY OTP is an online OTP marketplace for temporary phone numbers and verification codes across supported countries and services.",
  keywords: [
    "OTP marketplace",
    "OTP verification",
    "temporary phone numbers",
    "verification numbers",
    "SMS verification",
    "online OTP",
    "LOWKEY OTP",
  ],
  authors: [{ name: "LOWKEY OTP" }],
  creator: "LOWKEY OTP",
  metadataBase: new URL("https://lowkey-otp-hub.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "LOWKEY OTP | Fast OTP Verification Numbers",
    description:
      "Get temporary phone numbers and receive verification codes across supported countries and services.",
    url: "https://lowkey-otp-hub.vercel.app",
    siteName: "LOWKEY OTP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "LOWKEY OTP | Fast OTP Verification Numbers",
    description:
      "Get temporary phone numbers and verification codes across supported countries and services.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
