import type { Metadata } from 'next'
import './globals.css'
import ChatWidget from '@/components/ChatWidget'
import NotificationCenter from '@/components/NotificationCenter'

export const metadata: Metadata = {
  title: 'ITSM Helpdesk',
  description: 'IT Service Management Helpdesk System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <NotificationCenter />
        <ChatWidget />
      </body>
    </html>
  )
}

