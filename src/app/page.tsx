'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/header'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/footer'
import DailyManifest from '@/components/dashboard/DailyManifest'
import TomorrowMilestones from '@/components/dashboard/TomorrowMilestones'
import OverdueEvents from '@/components/dashboard/OverdueEvents'
import PlatformPerformanceChart from '@/components/dashboard/PlatformPerformanceChart'
import SpendPerformanceChart from '@/components/dashboard/SpendPerformanceChart'
import MarketingPieChart from '@/components/dashboard/MarketingPieChart'
import HelpDocumentationProvider from '@/contexts/HelpDocumentationContext'
import HelpDocumentationDrawer from '@/components/help/HelpDocumentationDrawer'

export default function Home() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Handle authentication redirect
  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

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

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-state">
          <span className="material-symbols-outlined loading-icon">hourglass_empty</span>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render content if not authenticated
  if (!session) {
    return null
  }

  return (
    <HelpDocumentationProvider>
      <div className="min-h-screen">
        <Header />
        <Sidebar />
        
        <main className={`content ${isSidebarExpanded ? 'menu-expanded' : ''}`}>
          <div className="safe-margin">
            <div className="grid grid-cols-3 gap-6 items-start" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
              {/* Left Column - 1/3 */}
              <div className="main-content-left">
                {/* Marketing Performance Chart */}
                <MarketingPieChart />
                
                {/* Daily Manifest Card */}
                <DailyManifest />
                
                {/* Tomorrow's Milestones Card */}
                <div style={{ marginTop: '1.5rem' }}>
                  <TomorrowMilestones />
                </div>
                
                {/* Overdue Events Card */}
                <div style={{ marginTop: '1.5rem' }}>
                  <OverdueEvents />
                </div>
                
                <p style={{ textAlign: 'right', marginTop: '2rem' }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              </div>

              {/* Right Column - 2/3 */}
              <div className="main-content-right">
                <PlatformPerformanceChart />
                <SpendPerformanceChart />
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
        <HelpDocumentationDrawer />
      </div>
    </HelpDocumentationProvider>
  )
}