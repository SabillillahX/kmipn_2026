import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

const hanken = localFont({
  src: "../public/fonts/Hanken_Grotesk/HankenGrotesk-VariableFont_wght.ttf",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Distrac — Suaramu Menggerakkan Kota",
  description: "Kanal resmi pelaporan publik Kecamatan Sukamaju. Laporkan, kawal, dan lihat perubahan nyata di lingkunganmu.",
  icons: {
    icon: "/brand/splik-emblem.png",
    apple: "/brand/splik-emblem.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" className={cn(inter.variable, hanken.variable, "font-sans", geist.variable)}><body>{children}</body></html>;
}
