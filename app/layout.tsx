import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: "FuelTrack",
  description: "Nutrition, calorie, micronutrient, hydration, and weight tracking.",
  manifest: "/manifest.webmanifest",
  icons: { apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "FuelTrack", statusBarStyle: "default" }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1720" }
  ],
  width: "device-width",
  initialScale: 1
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
