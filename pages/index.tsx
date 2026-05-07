export default function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-black to-yellow-900 text-white">
      <div className="w-full max-w-md text-center p-6 rounded-2xl shadow-2xl bg-black/40 border border-yellow-600">
        
        <h1 className="text-3xl font-bold text-green-400 mb-2">
          Welcome to Lowkey OTP Hub
        </h1>

        <p className="text-sm text-gray-300 mb-6">
          Secure, fast and reliable OTP & virtual number services platform.
        </p>

        <div className="bg-green-800/30 border border-green-500 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-200">
            Manage your wallet, buy numbers, and receive OTPs instantly with full security and speed.
          </p>
        </div>

        <button className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-yellow-500 text-black font-semibold hover:opacity-90 transition">
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

      </div>
    </div>
  );
}
