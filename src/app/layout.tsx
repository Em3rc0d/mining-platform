import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MineralAI — Mining Intelligence Platform',
  description: 'ML-powered financial analysis for mining companies. 8 predictive models, backtesting, portfolio management.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
