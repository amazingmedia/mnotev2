import type { Metadata, Viewport } from "next";
import "./globals.css";

// PWA နှင့် Mobile UI အတွက် Viewport settings
export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: "cover",
};

// PWA Metadata များ
export const metadata: Metadata = {
  title: "mnote001 | Multi-Book Pro",
  description: "Personal Finance Tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "mnote001",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Font Awesome Icons */}
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" 
          rel="stylesheet" 
        />
        {/* Google Fonts (Inter) */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
        {/* Apple Touch Icon (PWA အတွက်) */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="antialiased select-none overflow-hidden">
        {children}
      </body>
    </html>
  );
}
