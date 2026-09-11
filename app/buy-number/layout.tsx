import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buy OTP Verification Numbers",
  description:
    "Buy temporary phone numbers for OTP verification across supported countries and services through LOWKEY OTP.",
  keywords: [
    "buy OTP numbers",
    "buy verification numbers",
    "temporary phone numbers",
    "OTP verification numbers",
    "SMS verification numbers",
    "LOWKEY OTP",
  ],
  alternates: {
    canonical: "/buy-number",
  },
  openGraph: {
    title: "Buy OTP Verification Numbers | LOWKEY OTP",
    description:
      "Buy temporary phone numbers for OTP verification across supported countries and services through LOWKEY OTP.",
    url: "https://lowkey-otp-hub.vercel.app/buy-number",
    siteName: "LOWKEY OTP",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BuyNumberLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
