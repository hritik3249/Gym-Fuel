import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: "FuelTrack",
  description: "Nutrition, calorie, micronutrient, hydration, and weight tracking.",
  manifest: "/manifest.webmanifest",
  // black-translucent: status bar overlays the app (true full-screen).
  // Content must compensate with env(safe-area-inset-top) padding.
  appleWebApp: { capable: true, title: "FuelTrack", statusBarStyle: "black-translucent" }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fef9ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }
  ],
  width: "device-width",
  initialScale: 1,
  // viewportFit=cover lets content extend into notch / dynamic island areas
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <RegisterServiceWorker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
