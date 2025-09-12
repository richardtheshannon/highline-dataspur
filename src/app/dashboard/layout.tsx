'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/layout/header'
import Sidebar from '@/components/layout/sidebar'
import Footer from '@/components/layout/footer'
import HelpDocumentationProvider from '@/contexts/HelpDocumentationContext'
import HelpDocumentationDrawer from '@/components/help/HelpDocumentationDrawer'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)

  useEffect(() => {
    const handleSidebarToggle = () => {
      const sidebar = document.querySelector('.main-menu-sidebar')
      if (sidebar) {
        const isExpanded = sidebar.classList.contains('expanded')
        setIsSidebarExpanded(isExpanded)
      }
    }

    // Check initial state
    handleSidebarToggle()

    // Listen for changes (we'll need to add a custom event)
    const sidebar = document.querySelector('.main-menu-sidebar')
    if (sidebar) {
      const observer = new MutationObserver(handleSidebarToggle)
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] })
      return () => observer.disconnect()
    }
  }, [])

  return (
    <HelpDocumentationProvider>
      <div className="min-h-screen">
        <Header />
        <Sidebar />
        
        <main className={`content ${isSidebarExpanded ? 'menu-expanded' : ''}`}>
          <div className="safe-margin">
            {children}
          </div>
        </main>
        
        <Footer />
        <HelpDocumentationDrawer />
      </div>
    </HelpDocumentationProvider>
  )
}