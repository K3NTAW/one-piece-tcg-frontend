import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'One Piece TCG Digital App',
  description: 'A comprehensive digital trading card game application for One Piece TCG',
  keywords: ['One Piece', 'TCG', 'Trading Card Game', 'Digital', 'Card Game'],
  authors: [{ name: 'One Piece TCG Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#E53E3E',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-straw-hat-black via-gray-900 to-straw-hat-red">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
