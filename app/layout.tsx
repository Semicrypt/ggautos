import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Great Zuby Auto & Logistics Ltd.",
  description:
    "Premium automobile sales, vehicle sourcing and automotive logistics from Great Zuby Auto & Logistics Ltd.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}