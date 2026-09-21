import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blessed God Is Great Motor Autos Int'l Ventures",
  description:
    "Premium vehicle sales, sourcing and automotive logistics in Lagos, Onitsha and Cotonou.",
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