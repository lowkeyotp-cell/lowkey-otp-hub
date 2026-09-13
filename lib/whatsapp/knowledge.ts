export const LOWKEY_KNOWLEDGE = {
  brand: {
    name: "LOWKEY",
    description:
      "LOWKEY is a digital service platform providing OTP/SMS verification services and a digital marketplace.",
  },

  website: {
    main: "/",
    login: "/login",
    dashboard: "/dashboard",
    buyNumber: "/buy-number",
    marketplace: "/marketplace",
    orders: "/orders",
    transactions: "/transactions",
    profile: "/profile",
    fundWallet: "/fund-wallet",
  },

  otp: {
    description:
      "LOWKEY provides OTP/SMS verification numbers for supported countries and services.",
    customerFlow: [
      "Sign in to a LOWKEY account.",
      "Fund the LOWKEY wallet when needed.",
      "Open Buy Number.",
      "Choose the country and service.",
      "Purchase an available number.",
      "Wait for the verification SMS.",
      "Use the received OTP for the intended service.",
    ],
    important:
      "Availability, pricing, supported countries, and supported services can change. The website should be treated as the current source of truth.",
  },

  marketplace: {
    description:
      "LOWKEY also provides a digital marketplace where customers can purchase available digital products.",
    customerFlow: [
      "Sign in to LOWKEY.",
      "Open Marketplace.",
      "Choose an available product.",
      "Review the product and price.",
      "Complete the purchase using the LOWKEY wallet balance.",
      "The purchased credential is provided after a successful purchase.",
      "Orders can be viewed from the marketplace order section.",
    ],
  },


  referrals: {
    description:
      "LOWKEY has a referral program that rewards users for referring new customers.",
    reward:
      "The referral reward is ₦100.",
    qualification:
      "The referred user must make their first successful deposit of ₦500 or more.",
    disqualification:
      "Deposits below ₦500 do not qualify for a referral reward.",
    referralCode:
      "Users can get their referral code from the LOWKEY dashboard/referral center.",
    referralLink:
      "Referral links use the format /register?ref=REFERRAL_CODE.",
    center:
      "Users can open the Referral Center to view their referral information.",
  },

  contact: {
    email: "lowkeyotpmarketplace@gmail.com",
  },

  account: {
    login:
      "Customers sign in using their LOWKEY account credentials.",
    forgotPassword:
      "Customers can use Forgot password on the login page to request a password reset email.",
    verification:
      "Customers may need to verify their email address when required by the account system.",
    wallet:
      "LOWKEY uses one wallet balance across supported platform services, including the OTP service and marketplace.",
    logout:
      "Customers can safely sign out from their LOWKEY dashboard.",
  },

  support: {
    botRules: [
      "Be polite, concise, and helpful.",
      "Do not invent prices, balances, order statuses, OTP codes, or account information.",
      "Do not request a customer's password.",
      "Do not request sensitive payment credentials.",
      "Never expose another customer's information.",
      "When the bot cannot verify an account-specific issue, escalate to human support.",
      "Use the LOWKEY website as the source of truth for current features and availability.",
    ],
  },
} as const;
