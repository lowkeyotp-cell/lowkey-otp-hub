export default function FAQSchema() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is LOWKEY OTP?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "LOWKEY OTP is an online marketplace for supported temporary phone numbers and verification codes.",
        },
      },
      {
        "@type": "Question",
        name: "How do I buy a number?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Create an account, fund your wallet, choose a supported country and service, then purchase an available number.",
        },
      },
      {
        "@type": "Question",
        name: "Which countries are supported?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Supported countries and available services can change based on current availability. Visit the All Countries page to see available options.",
        },
      },
      {
        "@type": "Question",
        name: "How long does an OTP order remain active?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "OTP orders have a limited active period. The countdown shown on the order page indicates the remaining time.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
    />
  );
}
