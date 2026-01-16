import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dhivehi Havaadhu',
  description: 'Spice Management System',
  manifest: '/manifest.json', // PWA Manifest
  icons: {
    icon: '/icon-192.png',       // Favicon for browser tabs (using the PNG)
    shortcut: '/icon-192.png',   // Shortcut icon
    apple: '/icon-192.png',      // Apple Touch Icon for iOS Home Screen
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming on inputs, making it feel native
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans bg-gray-50 text-gray-900 min-h-screen`}>
        <Navbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}