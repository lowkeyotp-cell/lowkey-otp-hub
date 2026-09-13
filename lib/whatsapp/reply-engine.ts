import { InferenceClient } from "@huggingface/inference";
import {
  buildLowkeyPrompt,
  fallbackLowkeyAIReply,
} from "@/lib/ai/lowkey-ai";

export type BotReply = {
  message: string;
  intent:
    | "greeting"
    | "otp"
    | "marketplace"
    | "account"
    | "wallet"
    | "referral"
    | "order"
    | "support"
    | "unknown";
  needsHuman: boolean;
};

const hf = new InferenceClient(process.env.HF_TOKEN);

function detectIntent(message: string): BotReply["intent"] {
  const text = message.toLowerCase();

  if (/hello|hi|hey|good morning|good afternoon|good evening/.test(text))
    return "greeting";

  if (/otp|sms|verification|verify|number/.test(text))
    return "otp";

  if (/marketplace|product|credential|buy product/.test(text))
    return "marketplace";

  if (/login|password|account|email|sign in/.test(text))
    return "account";

  if (/order|purchase|bought|buy|transaction|receipt|order status/.test(text))
    return "order";

  if (/wallet|balance|fund|deposit|money/.test(text))
    return "wallet";

  if (/referral|refer|referrer|invite|bonus|reward/.test(text))
    return "referral";

  if (/support|help|problem|issue|contact/.test(text))
    return "support";

  return "unknown";
}

export async function generateLowkeyReply(
  customerMessage: string
): Promise<BotReply> {
  const intent = detectIntent(customerMessage);

  try {
    const prompt = buildLowkeyPrompt(customerMessage);

    const response = await hf.chatCompletion({
      model: "meta-llama/Llama-3.1-8B-Instruct",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 300,
    });

    const message = response.choices?.[0]?.message?.content?.trim();

    if (!message) {
      throw new Error("Hugging Face returned an empty response.");
    }

    const privateAccountRequest =
      intent === "order" ||
      /my order|my balance|my account|my transaction|check.*order|order.*status|account.*status/.test(
        customerMessage.toLowerCase()
      );

    return {
      message,
      intent,
      needsHuman: privateAccountRequest,
    };
  } catch (error) {
    console.error("LOWKEY Hugging Face error:", error);

    const fallback = fallbackLowkeyAIReply(customerMessage);

    return {
      message: fallback.message,
      intent,
      needsHuman: fallback.needsHuman,
    };
  }
}
