import type { Metadata } from "next";
import { Barlow, Manrope } from "next/font/google";
import "./globals.css";

// Display face: an engineered, DIN-like grotesque set uppercase and tracked
// for headlines, numbers and labels.
const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

// Body face for running text and interface copy.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sectoral: Private banking built for people and their AI agents",
  description:
    "Sectoral is a non-custodial neobank on Robinhood Chain and the money layer for the agent economy. Transfers are encrypted from the start, blocks settle every 100ms, and AI agents run their own accounts inside spend limits you set. Confidential out of the box, provable whenever it counts.",
  openGraph: {
    title: "Sectoral: Private banking built for people and their AI agents",
    description:
      "Sectoral is a non-custodial neobank on Robinhood Chain and the money layer for the agent economy. Transfers are encrypted from the start, blocks settle every 100ms, and AI agents run their own accounts inside spend limits you set. Confidential out of the box, provable whenever it counts.",
    url: "https://sectoral.xyz",
    siteName: "Sectoral",
    type: "website",
    images: [
      {
        url: "https://sectoral.xyz/images/og.jpg",
        width: 1200,
        height: 630,
        alt: "Sectoral: Private banking built for people and their AI agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@sectoralxyz",
    creator: "@sectoralxyz",
    title: "Sectoral: Private banking built for people and their AI agents",
    description:
      "Sectoral is a non-custodial neobank on Robinhood Chain and the money layer for the agent economy. Transfers are encrypted from the start, blocks settle every 100ms, and AI agents run their own accounts inside spend limits you set. Confidential out of the box, provable whenever it counts.",
    images: ["https://sectoral.xyz/images/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${barlow.variable} ${manrope.variable} antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
