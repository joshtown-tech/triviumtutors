import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://triviumtutors.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Trivium Tutors | Tutoring, editing and writing support", template: "%s | Trivium Tutors" },
  description:
    "One-to-one tutoring, editing and proofreading, writing coaching and research support for students and professionals in the US, UK, Europe, Australia and beyond.",
  openGraph: {
    title: "Trivium Tutors",
    description: "Tutoring, editing and writing support that helps you do your best work, in your own words.",
    url: SITE,
    siteName: "Trivium Tutors",
    type: "website",
  },
  alternates: { canonical: "./" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#14284b" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-cream">
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
