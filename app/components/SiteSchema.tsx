export default function SiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LOWKEY OTP",
    url: "https://lowkey-otp-hub.vercel.app",
    description:
      "LOWKEY OTP is an online marketplace for supported temporary phone numbers and OTP verification services.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}
