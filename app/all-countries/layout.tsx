import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OTP Numbers for All Supported Countries",
  description:
    "Browse supported countries and purchase temporary phone numbers for OTP verification through LOWKEY OTP.",
  keywords: [
    "OTP numbers by country",
    "temporary phone numbers",
    "international OTP verification",
    "SMS verification numbers",
    "OTP marketplace",
    "LOWKEY OTP",
  ],
  alternates: {
    canonical: "/all-countries",
  },
  openGraph: {
    title: "OTP Numbers for All Supported Countries | LOWKEY OTP",
    description:
      "Browse supported countries and purchase temporary phone numbers for OTP verification through LOWKEY OTP.",
    url: "https://lowkey-otp-hub.vercel.app/all-countries",
    siteName: "LOWKEY OTP",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AllCountriesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
