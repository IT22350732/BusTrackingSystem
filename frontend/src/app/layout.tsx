import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bus Tracking System | Real-Time Fleet Monitoring",
  description:
    "Track your bus in real-time. Live GPS tracking for public transit with route monitoring, vehicle management, and interactive maps.",
  keywords: "bus tracking, GPS, fleet management, real-time, public transit, Sri Lanka",
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
