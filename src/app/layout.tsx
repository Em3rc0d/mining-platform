import type { Metadata } from 'next'
import './globals.css'
import { UserProvider } from '@/contexts/UserContext'

export const metadata: Metadata = {
  title: 'MineralAI — Mining Intelligence Platform',
  description: 'ML-powered financial analysis for mining companies. 8 predictive models, backtesting, portfolio management.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  )
}
