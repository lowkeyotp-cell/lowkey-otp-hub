"use client";

import { useEffect, useState } from "react";

type FinanceData = {
  revenue: number;
  profit: number;
  refunds: number;
  usersWallet: number;
  withdrawable: number;

  recentSales: {
    id: string;
    orderId: string;
    amount: number;
    profit: number;
    country: string;
    service: string;
    createdAt: any;
  }[];
};

export default function AdminFinance() {
  const [loading, setLoading] = useState(true);

  const [finance, setFinance] =
    useState<FinanceData>({
      revenue: 0,
      profit: 0,
      refunds: 0,
      usersWallet: 0,
      withdrawable: 0,
      recentSales: [],
    });

  useEffect(() => {
    loadFinance();
  }, []);

  async function loadFinance() {
    try {
      const res = await fetch(
        "/api/admin/finance"
      );

      const data = await res.json();

      if (data.success) {
        setFinance(data);
      }
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  }

  const format = (value: number) =>
    "₦" +
    Number(value).toLocaleString("en-NG");

  return (
    <main className="min-h-screen bg-black text-green-400 p-6">

      <h1 className="text-4xl font-bold mb-2">
        💰 Finance Center
      </h1>

      <p className="text-green-600 mb-8">
        Live Marketplace Earnings
      </p>

      {loading ? (
        <div className="text-center py-20">
          Loading...
        </div>
      ) : (
        <>

          {/* Finance Cards */}
          <div className="grid md:grid-cols-2 gap-5">

            <div className="bg-gray-900 border border-green-700 rounded-2xl p-5">
              <h2>Total Revenue</h2>

              <p className="text-3xl font-bold mt-2">
                {format(finance.revenue)}
              </p>
            </div>

            <div className="bg-gray-900 border border-green-700 rounded-2xl p-5">
              <h2>Total Profit</h2>

              <p className="text-3xl font-bold mt-2">
                {format(finance.profit)}
              </p>
            </div>

            <div className="bg-gray-900 border border-green-700 rounded-2xl p-5">
              <h2>Total Refunds</h2>

              <p className="text-3xl font-bold mt-2 text-red-400">
                {format(finance.refunds)}
              </p>
            </div>

            <div className="bg-gray-900 border border-green-700 rounded-2xl p-5">
              <h2>Users Wallet Balance</h2>

              <p className="text-3xl font-bold mt-2">
                {format(finance.usersWallet)}
              </p>
            </div>

            {/* Withdraw */}
            <div className="md:col-span-2 bg-green-900 border border-green-500 rounded-2xl p-6">

              <h2 className="text-xl font-bold">
                Available To Withdraw
              </h2>

              <p className="text-5xl font-bold mt-4">
                {format(finance.withdrawable)}
              </p>

             <button
  onClick={() => {
    window.location.href = "/admin-withdraw";
  }}
  className="mt-6 w-full bg-green-500 text-black font-bold py-4 rounded-xl"
>
  Withdraw To Bank
</button>

            </div>

          </div>

          {/* Recent Sales */}
          <div className="mt-10 bg-gray-900 border border-green-700 rounded-2xl p-6">

            <h2 className="text-2xl font-bold mb-5">
              Recent Sales
            </h2>

            {finance.recentSales.length === 0 ? (

              <p>
                No sales yet.
              </p>

            ) : (

              <div className="space-y-4">

                {finance.recentSales.map(
                  (sale) => (

                    <div
                      key={sale.id}
                      className="border border-green-700 rounded-xl p-4"
                    >

                      <div className="flex justify-between">

                        <span>
                          #{sale.orderId}
                        </span>

                        <span className="font-bold">
                          ₦{sale.amount}
                        </span>

                      </div>

                      <div className="text-sm text-green-500 mt-2">
                        Country: {sale.country}
                        {" | "}
                        Service: {sale.service}
                      </div>

                      <div className="text-green-300 mt-2">
                        Profit: ₦{sale.profit}
                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </>
      )}

    </main>
  );
}
