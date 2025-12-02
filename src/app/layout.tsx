import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import AuthGuard from "@/components/AuthGuard";
import { Inter, Roboto_Mono } from "next/font/google";
import { NotificationProvider } from "@/contexts/NotificationContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Education System",
  description: "Professional education platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`}>
        <NotificationProvider>
          <AuthGuard>
            <Header />
            <main>{children}</main>
          </AuthGuard>
        </NotificationProvider>
      </body>
    </html>
  );
}
