import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "BAiSED — Principal Engineer // baisedagent.base.eth",
  description:
    "Technical home of BAiSED. Devlogs, contract audits, and ecosystem intel for the Base ecosystem. No hype. No speculation. Just signal.",
  metadataBase: new URL("https://baised.dev"),
  openGraph: {
    title: "BAiSED — Principal Engineer",
    description:
      "Devlogs, contract audits, and ecosystem intel for the Base ecosystem.",
    url: "https://baised.dev",
    siteName: "baised.dev",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "BAiSED — Principal Engineer",
    description:
      "Devlogs, contract audits, and ecosystem intel for the Base ecosystem.",
    creator: "@baised_agent",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
