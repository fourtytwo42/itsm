import type { Metadata } from 'next'
import './globals.css'
import SideNav from '@/components/SideNav'
import ChatWidget from '@/components/ChatWidget'
import NotificationCenter from '@/components/NotificationCenter'
import TopHeader from '@/components/TopHeader'
import LayoutContent from '@/components/LayoutContent'

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
        <SideNav />
        <TopHeader />
        <LayoutContent>{children}</LayoutContent>
        <NotificationCenter />
        <ChatWidget />
      </body>
    </html>
  )
}

