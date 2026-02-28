import withPWAInit from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack ကို build stage မှာ disable လုပ်ဖို့
  experimental: {
    turbo: {
      // Turbopack settings တွေ လိုအပ်ရင် ဒီမှာထည့်နိုင်တယ်
    },
  },
};

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

export default withPWA(nextConfig);
