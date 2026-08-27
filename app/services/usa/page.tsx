"use client";

const services = [
  {
    name: "WhatsApp",
    stock: 124,
  },
  {
    name: "Telegram",
    stock: 89,
  },
  {
    name: "Facebook",
    stock: 57,
  },
  {
    name: "Signal",
    stock: 31,
  },
  {
    name: "Instagram",
    stock: 74,
  },
  {
    name: "TikTok",
    stock: 41,
  },
  {
    name: "Binance",
    stock: 19,
  },
  {
    name: "Gmail",
    stock: 102,
  },
];

export default function USAServicesPage() {

  return (
    <main className="min-h-screen bg-gray-100 p-4">

      <h1 className="text-4xl font-bold text-primary mb-6">
        USA OTP Services
      </h1>

      <div className="grid gap-4">

        {services.map((service, index) => (

          <div
            key={index}
            className="bg-white rounded-2xl p-5 shadow-sm"
          >

            <h2 className="text-2xl font-bold text-gray-900">
              {service.name}
            </h2>

            <p className="text-gray-500 mt-3">
              Numbers Available
            </p>

            <h3 className="text-3xl font-bold text-green-600 mt-1">
              {service.stock}
            </h3>

            <button className="mt-5 bg-primary text-white px-5 py-3 rounded-2xl font-semibold w-full">
              Purchase Number
            </button>

          </div>

        ))}

      </div>

    </main>
  );
}
