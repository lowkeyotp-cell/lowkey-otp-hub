import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "USA OTP Verification Numbers",
  description:
    "Get temporary USA phone numbers for supported OTP verification services. Choose a service and purchase a USA number through LOWKEY OTP.",
  keywords: [
    "USA OTP numbers",
    "USA verification numbers",
    "USA temporary phone numbers",
    "USA SMS verification",
    "USA OTP verification",
    "LOWKEY OTP USA",
  ],
  alternates: {
    canonical: "/services/usa",
  },
  openGraph: {
    title: "USA OTP Verification Numbers | LOWKEY OTP",
    description:
      "Get temporary USA phone numbers for supported OTP verification services through LOWKEY OTP.",
    url: "https://lowkey-otp-hub.vercel.app/services/usa",
    siteName: "LOWKEY OTP",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function USALayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
