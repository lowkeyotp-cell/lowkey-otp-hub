import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.SMSPOOL_API_KEY;

    const [servicesResponse, pricingResponse] = await Promise.all([
      fetch(
        `https://api.smspool.net/service/retrieve_all?key=${apiKey}`
      ),
      fetch(
        "https://api.smspool.net/request/pricing",
        {
          method: "POST",
          body: (() => {
            const formData = new FormData();
            formData.append("key", apiKey || "");
            return formData;
          })(),
        }
      ),
    ]);

    const services = await servicesResponse.json();
console.log(services[0]);
    const pricing = await pricingResponse.json();

    const merged = services.map((service: any) => {
const matches = pricing.filter(
  (p: any) =>
    Number(p.service) === Number(service.ID)
);

const cheapest =
  matches.sort(
    (a: any, b: any) =>
      Number(a.price) - Number(b.price)
  )[0];

      return {
        ...service,
       livePrice: cheapest?.price ?? "0",
pool: cheapest?.pool,
      };
    });

    return NextResponse.json(merged);

 } catch (error) {
  console.error("SMSPool error:", error);

  return NextResponse.json(
    {
      error: "Failed to fetch services",
      details: String(error),
    },
    { status: 500 }
  );
}
}
