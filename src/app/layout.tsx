import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "WhatsApp - Messaging Platform",
  description: "WhatsApp-Identical Responsive Web Application with Free, Business and Pro Mod Tiers",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-100 dark:bg-[#0B141A] text-gray-900 dark:text-gray-100 antialiased overflow-hidden select-none">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
