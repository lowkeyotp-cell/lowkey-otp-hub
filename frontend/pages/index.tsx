import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const features = [
    "Secure OTP delivery in real-time",
    "Fast virtual number access",
    "Instant wallet funding system",
    "Automated payment processing",
    "Protected user verification",
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % features.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-black to-yellow-900 flex items-center justify-center px-4 overflow-hidden">
      
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md rounded-3xl border border-yellow-600 bg-black/50 backdrop-blur-lg shadow-2xl p-7 text-center text-white"
      >
        
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-extrabold text-green-400 mb-3"
        >
          Lowkey OTP Hub
        </motion.h1>

        <p className="text-gray-300 text-sm leading-6 mb-6">
          A secure and modern platform for virtual number access, OTP verification,
          wallet funding, and automated transactions built for speed, reliability,
          and smooth user experience.
        </p>

        <div className="bg-green-900/30 border border-green-500 rounded-2xl p-5 mb-6 min-h-[90px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={current}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="text-sm text-gray-200"
            >
              {features[current]}
            </motion.p>
          </AnimatePresence>
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

      </motion.div>
    </div>
  );
}
