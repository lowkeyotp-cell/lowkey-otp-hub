"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe2,
  Menu,
  MessageCircle,
  Package,
  ShieldCheck,
  Smartphone,
  Sparkles,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import FAQSchema from "@/app/components/FAQSchema";

export default function Home() {
  const router = useRouter();
  const [adminTap, setAdminTap] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const protectedNav = (path: string) => {
    if (!auth.currentUser) {
      router.push("/login");
      return;
    }
    router.push(path);
  };

  const handleAdminTap = () => {
    const next = adminTap + 1;
    setAdminTap(next);

    if (next >= 7) {
      window.location.href = "/admin-login";
      return;
    }

    setTimeout(() => setAdminTap(0), 5000);
  };

  const faqs = [
    {
      q: "What is LOWKEY OTP HUB?",
      a: "LOWKEY OTP HUB lets you purchase temporary verification numbers, receive OTP codes and manage your orders from one wallet.",
    },
    {
      q: "How quickly do OTPs arrive?",
      a: "OTP delivery depends on the selected service and number provider, but the platform is designed around fast delivery and live order updates.",
    },
    {
      q: "Can I use my wallet for multiple services?",
      a: "Yes. Your wallet is designed to let you fund once and use your balance across available numbers and marketplace services.",
    },
    {
      q: "Is LOWKEY available on mobile?",
      a: "Yes. The platform is responsive and built to work smoothly on phones, tablets and desktop browsers.",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#05020a] text-white">
      <FAQSchema />

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-15%] top-[-10%] h-[500px] w-[500px] rounded-full bg-violet-700/20 blur-[130px]" />
        <div className="absolute right-[-15%] top-[20%] h-[500px] w-[500px] rounded-full bg-fuchsia-600/10 blur-[130px]" />
        <div className="absolute bottom-[-20%] left-[35%] h-[500px] w-[500px] rounded-full bg-purple-800/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:45px_45px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <button
          onClick={handleAdminTap}
          className="flex items-center gap-3 text-left"
          aria-label="LOWKEY OTP HUB"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-600/20 shadow-[0_0_35px_rgba(124,58,237,.35)]">
            <Zap className="h-6 w-6 text-violet-300" fill="currentColor" />
          </span>
          <span>
            <span className="block text-sm font-black tracking-[0.2em]">LOWKEY OTP</span>
            <span className="block text-[10px] font-bold tracking-[0.35em] text-violet-300">
              OTP HUB
            </span>
          </span>
        </button>

        <div className="hidden items-center gap-7 lg:flex">
          <Link href="/" className="text-sm font-semibold text-white">Home</Link>
          <Link href="/all-countries" className="text-sm font-semibold text-white/60 hover:text-white">Countries</Link>
          <button onClick={() => protectedNav("/marketplace")} className="text-sm font-semibold text-white/60 hover:text-white">Marketplace</button>
          <button onClick={() => protectedNav("/services/usa")} className="text-sm font-semibold text-white/60 hover:text-white">USA Numbers</button>
          <button onClick={() => protectedNav("/buy-number")} className="text-sm font-semibold text-white/60 hover:text-white">
            Buy Number
          </button>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-bold text-white/70 hover:text-white">
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-black text-black shadow-[0_10px_35px_rgba(255,255,255,.12)]"
          >
            Get Started
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-xl border border-white/10 bg-white/5 p-2.5 lg:hidden"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {menuOpen && (
        <div className="mx-4 rounded-2xl border border-white/10 bg-[#0d0915]/95 p-4 shadow-2xl lg:hidden">
          <div className="grid gap-1">
            <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 font-semibold hover:bg-white/5">Home</Link>
            <Link href="/all-countries" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 font-semibold hover:bg-white/5">Countries</Link>
            <button onClick={() => { setMenuOpen(false); protectedNav("/marketplace"); }} className="rounded-xl px-4 py-3 text-left font-semibold hover:bg-white/5">Marketplace</button>
            <button onClick={() => { setMenuOpen(false); protectedNav("/buy-number"); }} className="rounded-xl px-4 py-3 text-left font-semibold hover:bg-white/5">Buy Number</button>
            <button onClick={() => { setMenuOpen(false); protectedNav("/fund-wallet"); }} className="rounded-xl px-4 py-3 text-left font-semibold hover:bg-white/5">Fund Wallet</button>
            <Link href="/login" onClick={() => setMenuOpen(false)} className="mt-2 rounded-xl bg-violet-600 px-4 py-3 text-center font-black">Login</Link>
          </div>
        </div>
      )}

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-28 lg:pt-20">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs font-bold text-violet-200">
            <Sparkles className="h-3.5 w-3.5" />
            PREMIUM OTP MARKETPLACE
          </div>

          <h1 className="max-w-3xl text-5xl font-black leading-[.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            OTPs.
            <br />
            <span className="bg-gradient-to-r from-white via-violet-200 to-violet-500 bg-clip-text text-transparent">
              Numbers.
            </span>
            <br />
            Simplified.
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-white/55 sm:text-lg">
            Buy temporary verification numbers, receive OTP codes and manage everything
            from one powerful wallet — built for speed and simplicity.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-black shadow-[0_20px_60px_rgba(255,255,255,.12)]"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/buy-number"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold text-white backdrop-blur-xl"
            >
              Explore Numbers
            </Link>
          </div>

          <div className="mt-8 grid gap-3 text-sm text-white/55 sm:grid-cols-3">
            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-400" />Fast activation</div>
            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-400" />Live OTPs</div>
            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-400" />Secure wallet</div>
          </div>
        </div>

        <div className="relative flex min-h-[520px] items-center justify-center [perspective:1400px]">
          <div className="absolute h-72 w-72 rounded-full bg-violet-600/20 blur-[90px]" />

          <div className="phone-stage relative h-[450px] w-[225px] [transform-style:preserve-3d]">
            <div className="phone-face absolute inset-0 overflow-hidden rounded-[38px] border-[5px] border-[#24202c] bg-[#08070c] shadow-[0_35px_100px_rgba(0,0,0,.75),0_0_70px_rgba(124,58,237,.25)] [backface-visibility:hidden]">
              <div className="absolute left-1/2 top-2 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />

              <div className="p-5 pt-12">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-bold tracking-[.25em] text-violet-300">LOWKEY</div>
                    <div className="mt-1 text-lg font-black">Dashboard</div>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15">
                    <Zap className="h-4 w-4 text-violet-300" />
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-violet-700 to-purple-950 p-5 shadow-[0_20px_50px_rgba(91,33,182,.35)]">
                  <div className="text-[9px] uppercase tracking-widest text-white/60">Available balance</div>
                  <div className="mt-2 text-2xl font-black">₦25,480</div>
                  <div className="mt-6 flex justify-between text-[9px] text-white/55">
                    <span>LOWKEY WALLET</span>
                    <span>•••• 8291</span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["Buy Number", Smartphone],
                    ["Get OTP", Zap],
                    ["Orders", Package],
                    ["Wallet", WalletCards],
                  ].map(([label, Icon]) => (
                    <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[.04] p-3">
                      <Icon className="h-4 w-4 text-violet-300" />
                      <div className="mt-2 text-[10px] font-bold">{String(label)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.03] p-3">
                  <div className="text-[8px] uppercase tracking-widest text-white/35">Recent order</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-[10px] font-bold">USA • WhatsApp</div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[8px] font-bold text-emerald-400">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="phone-face absolute inset-0 overflow-hidden rounded-[38px] border-[5px] border-[#24202c] bg-gradient-to-br from-[#17101f] via-[#09070d] to-[#211032] p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div className="absolute left-6 top-7 h-20 w-20 rounded-[22px] bg-black p-3 shadow-2xl">
                <div className="grid grid-cols-2 gap-2">
                  <span className="h-6 w-6 rounded-full bg-[#25212d]" />
                  <span className="h-6 w-6 rounded-full bg-[#25212d]" />
                  <span className="h-6 w-6 rounded-full bg-[#25212d]" />
                  <span className="h-6 w-6 rounded-full bg-[#25212d]" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-16 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-400/20 bg-violet-500/10 shadow-[0_0_60px_rgba(124,58,237,.25)]">
                  <Zap className="h-10 w-10 text-violet-300" fill="currentColor" />
                </div>
                <div className="mt-5 text-xl font-black tracking-[.15em]">LOWKEY</div>
                <div className="mt-1 text-[9px] font-bold tracking-[.35em] text-violet-300">OTP HUB</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-white/[.015]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-10 sm:grid-cols-4 lg:px-8">
          {[
            ["24/7", "Platform access"],
            ["150+", "Countries"],
            ["Fast", "OTP delivery"],
            ["₦", "Wallet payments"],
          ].map(([big, small]) => (
            <div key={small} className="text-center">
              <div className="text-2xl font-black sm:text-3xl">{big}</div>
              <div className="mt-1 text-xs text-white/40">{small}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <div className="text-xs font-black tracking-[.25em] text-violet-400">BUILT FOR SPEED</div>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            Everything you need in one place.
          </h2>
          <p className="mt-4 text-white/45">
            A clean workflow from funding your wallet to receiving the verification code.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {[
            [WalletCards, "Smart Wallet", "Fund once and manage your available balance from a simple wallet."],
            [Globe2, "Global Numbers", "Browse available countries and services from one marketplace."],
            [Zap, "Fast OTPs", "Track active orders and retrieve verification codes from your dashboard."],
            [ShieldCheck, "Secure Access", "Authentication and protected account areas keep your marketplace experience organized."],
          ].map(([Icon, title, text]) => (
            <div
              key={String(title)}
              className="group rounded-3xl border border-white/10 bg-white/[.035] p-7 transition hover:-translate-y-1 hover:border-violet-400/25 hover:bg-violet-500/[.04]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-black">{String(title)}</h3>
              <p className="mt-2 text-sm leading-6 text-white/45">{String(text)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-5 overflow-hidden rounded-[32px] border border-violet-400/15 bg-gradient-to-br from-violet-700/20 via-[#12091d] to-[#07050b] lg:mx-auto lg:max-w-7xl">
        <div className="relative px-7 py-14 text-center sm:px-12 sm:py-20">
          <div className="absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[90px]" />
          <div className="relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Sparkles className="h-6 w-6 text-violet-300" />
            </div>
            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">
              Ready to make OTPs simple?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/45">
              Create your LOWKEY account and start exploring available numbers and services.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-black text-black"
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-20 lg:py-28">
        <div className="text-center">
          <div className="text-xs font-black tracking-[.25em] text-violet-400">FAQ</div>
          <h2 className="mt-3 text-3xl font-black">Questions, answered.</h2>
        </div>

        <div className="mt-8 space-y-3">
          {faqs.map((faq, index) => (
            <div key={faq.q} className="rounded-2xl border border-white/10 bg-white/[.03]">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
              >
                <span className="text-sm font-bold">{faq.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition ${openFaq === index ? "rotate-180" : ""}`} />
              </button>
              {openFaq === index && (
                <div className="px-5 pb-5 text-sm leading-6 text-white/45">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-12 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <div className="text-lg font-black">Need help?</div>
            <div className="mt-1 text-sm text-white/40">Reach LOWKEY support on WhatsApp.</div>
          </div>
          <a
            href="https://wa.me/2347038167338"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm font-bold text-emerald-300"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Support
          </a>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>© {new Date().getFullYear()} LOWKEY OTP HUB. All rights reserved.</div>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-white">Login</Link>
            <Link href="/register" className="hover:text-white">Register</Link>
            <Link href="/all-countries" className="hover:text-white">Countries</Link>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .phone-stage {
          animation: phoneRoll 10s linear infinite;
          transform-style: preserve-3d;
        }

        @keyframes phoneRoll {
          0% {
            transform: rotateY(0deg) rotateX(4deg) translateY(0);
          }
          25% {
            transform: rotateY(90deg) rotateX(-2deg) translateY(-8px);
          }
          50% {
            transform: rotateY(180deg) rotateX(4deg) translateY(0);
          }
          75% {
            transform: rotateY(270deg) rotateX(-2deg) translateY(-8px);
          }
          100% {
            transform: rotateY(360deg) rotateX(4deg) translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .phone-stage {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}
