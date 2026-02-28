import withPWAInit from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack နဲ့ webpack conflict မဖြစ်အောင် config အလွတ်ထားပေးပါ
  turbopack: {},
};

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

export default withPWA(nextConfig);
