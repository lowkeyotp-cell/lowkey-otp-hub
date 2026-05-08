export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-black to-yellow-900 text-white px-4">
      
      <div className="w-full max-w-md text-center p-6 rounded-2xl border border-yellow-600 bg-black/50 shadow-2xl">

        <h1 className="text-4xl font-bold text-green-400 mb-3">
          Lowkey OTP Hub
        </h1>

        <p className="text-sm text-gray-300 mb-6">
          Secure platform for virtual numbers, OTP verification, wallet funding, and fast automated transactions.
        </p>

        <div className="bg-green-900/30 border border-green-500 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-200">
            Fast OTP delivery • Secure payments • Instant wallet updates • Reliable system
          </p>
        </div>

        <button className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-yellow-500 text-black font-bold hover:opacity-90 transition">
          Continue
        </button>

        <div className="mt-6 text-xs text-gray-400">
          Customer support available 24/7
        </div>

        <a
          href="https://wa.me/qr/ZNPQNEIJHB6ON1"
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-2 text-green-400 underline"
        >
          Contact Support (WhatsApp)
        </a>

      </div>

    </div>
  );
}
