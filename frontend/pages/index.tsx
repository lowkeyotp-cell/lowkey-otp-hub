import { useEffect, useState } from "react"; import { motion, AnimatePresence } from "framer-motion";

export default function WelcomePage() { const features = [ "Secure OTP delivery in real-time", "Fast virtual number access", "Instant wallet funding & payments", "Automated transaction processing", "Protected user verification system" ];

const [index, setIndex] = useState(0);

useEffect(() => { const interval = setInterval(() => { setIndex((prev) => (prev + 1) % features.length); }, 2500);

return () => clearInterval(interval);

}, []);

return ( <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-black to-yellow-900 text-white px-4"> <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="w-full max-w-md text-center p-6 rounded-2xl shadow-2xl bg-black/50 border border-yellow-600" > <h1 className="text-3xl font-bold text-green-400 mb-2"> Welcome to Lowkey OTP Hub </h1>

<p className="text-sm text-gray-300 mb-6">
      A modern secure platform built for fast OTP verification, virtual number access, and seamless wallet-based transactions.
    </p>

    <div className="bg-green-800/30 border border-green-500 rounded-xl p-4 mb-6 min-h-[70px] flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="text-sm text-gray-200"
        >
          {features[index]}
        </motion.p>
      </AnimatePresence>
    </div>

    <button className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-yellow-500 text-black font-semibold hover:scale-105 transition">
      Continue
    </button>

    <div className="mt-6 text-xs text-gray-400">
      Need help? Contact customer service below
    </div>

    <a
      href="https://wa.me/qr/ZNPQNEIJHB6ON1"
      target="_blank"
      rel="noreferrer"
      className="inline-block mt-2 text-green-400 hover:text-yellow-400 underline"
    >
      Customer Service WhatsApp
    </a>
  </motion.div>
</div>

); }
