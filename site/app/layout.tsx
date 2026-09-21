import type { Metadata } from "next";
import { Inter, Kaushan_Script } from "next/font/google";
import { clinic } from "@/content/site";
import "./globals.css";

// The design uses exactly two families: Inter for everything, and Kaushan
// Script for the single "Healthier Smiles Happier Lives" flourish in the footer.
// The whole design is set in Inter *italic* — every text layer in the Figma
// file uses an italic style, so the italic axis has to be loaded too.
const inter = Inter({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-inter",
  display: "swap",
});

const kaushan = Kaushan_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-kaushan",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${clinic.legalName} — Specialist Dental Care in Lahore`,
  description:
    "Complete dental care from trusted specialists, all under one roof. Implants, aligners, braces and cosmetic dentistry in Johar Town, Lahore.",
  openGraph: {
    title: `${clinic.legalName} — Specialist Dental Care in Lahore`,
    description: "Complete care from trusted specialists - all under one roof.",
    type: "website",
    locale: "en_PK",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${kaushan.variable}`}>
      <body>{children}</body>
    </html>
  );
}
