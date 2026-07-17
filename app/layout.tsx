import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const hanken = localFont({
  src: "../public/fonts/Hanken_Grotesk/HankenGrotesk-VariableFont_wght.ttf",
  variable: "--font-body",
  display: "swap",
});

const spartan = localFont({
  src: "../public/fonts/League_Spartan/LeagueSpartan-VariableFont_wght.ttf",
  variable: "--font-display",
  display: "swap",
});

const cinzel = localFont({
  src: "../public/fonts/Cinzel/Cinzel-VariableFont_wght.ttf",
  variable: "--font-civic",
  display: "swap",
});

const allura = localFont({
  src: "../public/fonts/Allura/Allura-Regular.ttf",
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SPLIK — Suaramu Menggerakkan Kota",
  description: "Kanal resmi pelaporan publik Kecamatan Sukamaju. Laporkan, kawal, dan lihat perubahan nyata di lingkunganmu.",
  icons: {
    icon: "/brand/splik-emblem.png",
    apple: "/brand/splik-emblem.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" className={`${hanken.variable} ${spartan.variable} ${cinzel.variable} ${allura.variable}`}><body>{children}</body></html>;
}
