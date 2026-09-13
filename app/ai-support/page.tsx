"use client";

import { useState } from "react";

type Message = {
  role: "user" | "ai";
  text: string;
};

export default function AISupportPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Hi 👋 Welcome to LOWKEY AI Support. How can I help you today?",
    },
  ]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    const text = message.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            data?.success && data?.reply
              ? data.reply
              : "Sorry, I couldn't process that request right now.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-3 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl sm:min-h-[calc(100vh-3rem)]">
        <header className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-black">
            🤖
          </div>

          <div>
            <h1 className="font-bold">LOWKEY AI Support</h1>
            <p className="text-xs text-zinc-500">
              Online • LOWKEY Support Assistant
            </p>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.map((item, index) => (
            <div
              key={index}
              className={`flex ${
                item.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                  item.role === "user"
                    ? "rounded-br-md bg-white text-black"
                    : "rounded-bl-md border border-white/10 bg-zinc-900 text-zinc-100"
                }`}
              >
                {item.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-zinc-500">
                LOWKEY AI is typing...
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-zinc-950 p-3 sm:p-4">
          <div className="flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Ask LOWKEY AI anything..."
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm outline-none placeholder:text-zinc-600 focus:border-white/30"
            />

            <button
              onClick={sendMessage}
              disabled={loading || !message.trim()}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </div>

          <p className="mt-2 text-center text-[11px] text-zinc-600">
            LOWKEY AI may not have access to private account information.
          </p>
        </div>
      </div>
    </main>
  );
}
