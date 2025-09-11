'use client'

import { useState, useEffect, useRef } from 'react'

export default function Footer() {
  const [debugBordersEnabled, setDebugBordersEnabled] = useState(false)
  const [footerFixed, setFooterFixed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const footerRef = useRef<HTMLElement>(null)

  const toggleDebugBorders = () => {
    const newState = !debugBordersEnabled
    setDebugBordersEnabled(newState)
    
    // Toggle the debug styles by adding/removing a class to the body
    if (newState) {
      document.body.classList.add('debug-borders-enabled')
    } else {
      document.body.classList.remove('debug-borders-enabled')
    }
  }

  const toggleFooterFixed = () => {
    const newState = !footerFixed
    setFooterFixed(newState)
    
    // Save state to localStorage
    localStorage.setItem('footerFixed', JSON.stringify(newState))
    
    // Toggle the fixed footer by adding/removing a class to the footer
    if (footerRef.current) {
      if (newState) {
        footerRef.current.classList.add('footer-fixed')
        document.body.classList.add('has-fixed-footer')
      } else {
        footerRef.current.classList.remove('footer-fixed')
        document.body.classList.remove('has-fixed-footer')
      }
    }
  }

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen)
  }

  // Check initial state on mount
  useEffect(() => {
    const hasDebugBorders = document.body.classList.contains('debug-borders-enabled')
    setDebugBordersEnabled(hasDebugBorders)
    
    // Load footer fixed state from localStorage
    const savedFooterState = localStorage.getItem('footerFixed')
    if (savedFooterState !== null) {
      const isFixed = JSON.parse(savedFooterState)
      setFooterFixed(isFixed)
      
      // Apply the fixed class if needed
      if (footerRef.current && isFixed) {
        footerRef.current.classList.add('footer-fixed')
        document.body.classList.add('has-fixed-footer')
      }
    }
  }, [])

  return (
    <>
      <footer ref={footerRef} className="footer">
        <div className="footer-left">
          <button className="footer-icon">
            <span className="material-symbols-outlined">format_indent_increase</span>
          </button>
        </div>
        <div className="footer-center">
          <button className="footer-icon">
            <span className="material-symbols-outlined">code</span>
          </button>
        </div>
        <div className="footer-right">
          <button className="footer-icon" onClick={toggleFooterFixed} title={footerFixed ? "Release Footer" : "Fix Footer"}>
            <span className="material-symbols-outlined">place_item</span>
          </button>
          <button className="footer-icon" onClick={toggleDebugBorders} title={debugBordersEnabled ? "Hide Debug Borders" : "Show Debug Borders"}>
            <span className="material-symbols-outlined">
              {debugBordersEnabled ? 'border_outer' : 'border_style'}
            </span>
          </button>
          <button className="footer-icon" onClick={toggleDrawer} title={drawerOpen ? "Close Drawer" : "Open Drawer"}>
            <span className="material-symbols-outlined">{drawerOpen ? 'expand_circle_down' : 'expand_circle_up'}</span>
          </button>
        </div>
      </footer>

      {/* Bottom Drawer */}
      <div className={`bottom-drawer ${drawerOpen ? 'drawer-open' : ''}`}>
        <div className="drawer-header">
          <h3>Quick Actions</h3>
          <button className="drawer-close" onClick={toggleDrawer}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="drawer-content">
          <div className="drawer-grid">
            <button className="drawer-action">
              <span className="material-symbols-outlined">add_circle</span>
              <span>New Project</span>
            </button>
            <button className="drawer-action">
              <span className="material-symbols-outlined">task_alt</span>
              <span>New Task</span>
            </button>
            <button className="drawer-action">
              <span className="material-symbols-outlined">note_add</span>
              <span>New Note</span>
            </button>
            <button className="drawer-action">
              <span className="material-symbols-outlined">upload_file</span>
              <span>Upload File</span>
            </button>
            <button className="drawer-action">
              <span className="material-symbols-outlined">schedule</span>
              <span>Schedule</span>
            </button>
            <button className="drawer-action">
              <span className="material-symbols-outlined">settings</span>
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drawer Backdrop */}
      {drawerOpen && <div className="drawer-backdrop" onClick={toggleDrawer}></div>}
    </>
  )
}