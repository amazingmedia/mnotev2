import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack နဲ့ Webpack ပြဿနာကို ရှောင်ဖို့
  webpack: (config, { isServer }) => {
    return config;
  },
};

export default withPWA(nextConfig);
