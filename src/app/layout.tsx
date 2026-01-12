import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "Dhivehi Havaadhu",
  description: "Invoice Management System",
  icons: {
    icon: "/logo.svg", // This looks for logo.svg in your public folder
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <Navbar /> 
        <main className="px-6">
          {children}
        </main>
      </body>
    </html>
  );
}