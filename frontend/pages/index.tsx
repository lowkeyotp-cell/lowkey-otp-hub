import { useEffect, useState } from "react";

export default function Home() {
  const features = [
    "Secure OTP delivery in real-time",
    "Fast virtual number access",
    "Instant wallet funding system",
    "Automated payment processing",
    "Protected user verification",
  ];

  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-950 via-black to-yellow-900 px-4 overflow-hidden">

      <div className="w-full max-w-md rounded-3xl border border-yellow-600 bg-black/50 backdrop-blur-lg shadow-2xl p-7 text-center text-white animate-fadeIn">

        <h1 className="text-4xl font-extrabold text-green-400 mb-3 animate-pulse">
          Lowkey OTP Hub
        </h1>

        <p className="text-gray-300 text-sm leading-6 mb-6">
          A secure and modern platform for virtual number access,
          OTP verification, wallet funding, and automated transactions
          built for speed, reliability, and smooth user experience.
        </p>

        <div className="bg-green-900/30 border border-green-500 rounded-2xl p-5 mb-6 min-h-[90px] flex items-center justify-center transition-all duration-500">
          <p className="text-sm text-gray-200 animate-bounce">
            {features[currentFeature]}
          </p>
        </div>

        <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-green-500 to-yellow-500 text-black font-bold hover:scale-105 transition duration-300 shadow-lg">
          Continue
        </button>

        <div className="mt-6 text-xs text-gray-400">
          Need assistance? Contact customer service
        </div>

        <a
          href="https://wa.me/qr/ZNPQNEIJHB6ON1"
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-2 text-green-400 hover:text-yellow-300 underline transition"
        >
          Customer Service WhatsApp
        </a>

      </div>

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 1s ease forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
