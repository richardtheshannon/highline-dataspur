'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useHelpDocumentation } from '@/contexts/HelpDocumentationContext'

interface SubNavItem {
  title: string
  icon: string
  href: string
}

interface NavItem {
  title: string
  icon: string
  href?: string
  subItems?: SubNavItem[]
}

const navItems: NavItem[] = [
  {
    title: 'Home Dashboard',
    icon: 'home',
    href: '/',
  },
  {
    title: 'Projects',
    icon: 'folder_open',
    href: '/dashboard/projects',
  },
  {
    title: 'User Management',
    icon: 'people',
    href: '/dashboard/user-management',
  },
  {
    title: 'Analytics',
    icon: 'analytics',
    subItems: [
      { title: 'Dashboard', icon: 'dashboard', href: '/dashboard/analytics' },
      { title: 'Google AdWords', icon: 'ads_click', href: '/dashboard/analytics/google-adwords' },
    ],
  },
  {
    title: 'APIs',
    icon: 'api',
    subItems: [
      { title: 'Google AdWords', icon: 'ads_click', href: '/dashboard/apis/google-adwords' },
    ],
  },
]

type ModalView = 'menu' | 'appearance'
type Theme = 'dark' | 'light' | 'system'

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeSubNavs, setActiveSubNavs] = useState<Set<string>>(new Set())
  const [showUserModal, setShowUserModal] = useState(false)
  const [modalView, setModalView] = useState<ModalView>('menu')
  const [theme, setTheme] = useState<Theme>('dark')
  const [accentColor, setAccentColor] = useState('#315C4D')
  const [customHex, setCustomHex] = useState('#315C4D')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()
  
  // Help documentation context (will be available when dashboard layout loads)
  const [helpEnabled, setHelpEnabled] = useState(false)
  
  // Try to use help documentation context if available
  useEffect(() => {
    try {
      // This will only work after the HelpDocumentationProvider is mounted
      const savedHelpState = localStorage.getItem('help-documentation-enabled')
      if (savedHelpState) {
        setHelpEnabled(JSON.parse(savedHelpState))
      }
    } catch (error) {
      console.log('Help documentation localStorage not available yet')
    }
  }, [])

  // Load sidebar state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarExpanded')
    if (savedState !== null) {
      const expanded = JSON.parse(savedState)
      setIsExpanded(expanded)
    }
  }, [])

  // Load and apply theme and accent color on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } else {
      applyTheme('dark')
    }
    
    // Load saved accent color
    const savedAccentColor = localStorage.getItem('accentColor')
    if (savedAccentColor) {
      setAccentColor(savedAccentColor)
      setCustomHex(savedAccentColor)
      applyAccentColor(savedAccentColor)
    }
  }, [])

  const applyTheme = (selectedTheme: Theme) => {
    const root = document.documentElement
    
    if (selectedTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light')
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        if (theme === 'system') {
          root.setAttribute('data-theme', e.matches ? 'dark' : 'light')
        }
      }
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      root.setAttribute('data-theme', selectedTheme)
    }
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  const applyAccentColor = (color: string) => {
    const root = document.documentElement
    root.style.setProperty('--accent', color)
    root.style.setProperty('--accent-hover', adjustColorBrightness(color, -20))
    root.style.setProperty('--accent-light', adjustColorBrightness(color, 40))
  }

  const adjustColorBrightness = (color: string, percent: number) => {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1)
  }

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color)
    setCustomHex(color)
    localStorage.setItem('accentColor', color)
    applyAccentColor(color)
    setShowColorPicker(false)
  }

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomHex(value)
    
    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      handleAccentColorChange(value)
    }
  }

  const toggleMenu = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    
    // Save state to localStorage
    localStorage.setItem('sidebarExpanded', JSON.stringify(newState))
    
    if (newState === false) {
      setActiveSubNavs(new Set())
    }
  }

  const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
    // If sidebar is collapsed and item has subItems, navigate to first sub-item
    if (!isExpanded && item.subItems && item.subItems.length > 0) {
      router.push(item.subItems[0].href)
      return
    }
    
    // If sidebar is expanded and item has subItems, toggle the sub-navigation
    if (isExpanded && item.subItems) {
      e.preventDefault()
      e.stopPropagation()
      
      const newActiveSubNavs = new Set(activeSubNavs)
      if (newActiveSubNavs.has(item.title)) {
        newActiveSubNavs.delete(item.title)
      } else {
        newActiveSubNavs.clear()
        newActiveSubNavs.add(item.title)
      }
      setActiveSubNavs(newActiveSubNavs)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut({ 
        callbackUrl: '/auth/signin',
        redirect: true 
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      {/* User Modal Overlay */}
      {showUserModal && (
        <>
          <div 
            className="user-modal-backdrop"
            onClick={() => setShowUserModal(false)}
          />
          <div className="user-modal">
            <div className="user-modal-header">
              <div className="modal-header-left">
                {modalView !== 'menu' && (
                  <button 
                    className="modal-back"
                    onClick={() => setModalView('menu')}
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                )}
                <h2>{modalView === 'menu' ? 'User Settings' : 'Appearance'}</h2>
              </div>
              <button 
                className="modal-close"
                onClick={() => setShowUserModal(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="user-modal-content">
              {modalView === 'menu' ? (
                <>
                  <div className="user-profile-section">
                    <div className="user-avatar">
                      <span className="material-symbols-outlined">account_circle</span>
                    </div>
                    <div className="user-info">
                      <h3>{session?.user?.name || 'User'}</h3>
                      <p>{session?.user?.email || 'No email'}</p>
                      {session?.user?.role && (
                        <span className={`role-badge role-${session.user.role.toLowerCase()}`}>
                          {session.user.role}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="user-menu-section">
                    <button className="user-menu-item">
                      <span className="material-symbols-outlined">manage_accounts</span>
                      <span>Edit Profile</span>
                    </button>
                    <button className="user-menu-item">
                      <span className="material-symbols-outlined">notifications</span>
                      <span>Notifications</span>
                    </button>
                    <button className="user-menu-item">
                      <span className="material-symbols-outlined">security</span>
                      <span>Security Settings</span>
                    </button>
                    <button 
                      className="user-menu-item"
                      onClick={() => setModalView('appearance')}
                    >
                      <span className="material-symbols-outlined">palette</span>
                      <span>Appearance</span>
                    </button>
                    <button className="user-menu-item">
                      <span className="material-symbols-outlined">language</span>
                      <span>Language & Region</span>
                    </button>
                    <button className="user-menu-item">
                      <span className="material-symbols-outlined">help</span>
                      <span>Help & Support</span>
                    </button>
                    <div className="user-menu-divider"></div>
                    <button className="user-menu-item logout" onClick={handleLogout}>
                      <span className="material-symbols-outlined">logout</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="appearance-settings">
                  <div className="settings-section">
                    <h3>Theme</h3>
                    <div className="theme-options">
                      <button 
                        className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                        onClick={() => handleThemeChange('dark')}
                      >
                        <span className="material-symbols-outlined">dark_mode</span>
                        <span>Dark</span>
                      </button>
                      <button 
                        className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                        onClick={() => handleThemeChange('light')}
                      >
                        <span className="material-symbols-outlined">light_mode</span>
                        <span>Light</span>
                      </button>
                      <button 
                        className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                        onClick={() => handleThemeChange('system')}
                      >
                        <span className="material-symbols-outlined">computer</span>
                        <span>System</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="settings-section">
                    <h3>Accent Color</h3>
                    <div className="color-picker-trigger">
                      <button 
                        className="accent-color-btn"
                        style={{backgroundColor: accentColor}}
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        title={`Current color: ${accentColor}`}
                      >
                        <span className="material-symbols-outlined">palette</span>
                        <span className="color-hex">{accentColor}</span>
                      </button>
                    </div>
                    
                    {showColorPicker && (
                      <div className="custom-color-picker">
                        <div className="color-picker-header">
                          <h4>Custom Color</h4>
                          <button 
                            className="color-picker-close"
                            onClick={() => setShowColorPicker(false)}
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>
                        <div className="color-picker-content">
                          <input
                            type="color"
                            value={accentColor}
                            onChange={(e) => handleAccentColorChange(e.target.value)}
                            className="color-picker-input"
                          />
                          <div className="hex-input-container">
                            <label htmlFor="hex-input">Hex Color:</label>
                            <input
                              type="text"
                              id="hex-input"
                              value={customHex}
                              onChange={handleHexInputChange}
                              className="hex-input"
                              placeholder="#315C4D"
                              maxLength={7}
                            />
                          </div>
                          <div className="color-preview" style={{backgroundColor: accentColor}}>
                            <span>Preview</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="settings-section">
                    <h3>Display</h3>
                    <div className="display-settings">
                      <div className="setting-item">
                        <span>Compact Mode</span>
                        <label className="toggle-switch">
                          <input type="checkbox" />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                      <div className="setting-item">
                        <span>Show Animations</span>
                        <label className="toggle-switch">
                          <input type="checkbox" defaultChecked />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                      <div className="setting-item">
                        <span>High Contrast</span>
                        <label className="toggle-switch">
                          <input type="checkbox" />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="settings-section">
                    <h3>Sidebar</h3>
                    <div className="display-settings">
                      <div className="setting-item">
                        <span>Auto-collapse on mobile</span>
                        <label className="toggle-switch">
                          <input type="checkbox" defaultChecked />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                      <div className="setting-item">
                        <span>Show icon labels</span>
                        <label className="toggle-switch">
                          <input type="checkbox" defaultChecked />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="settings-actions">
                    <button className="form-btn form-btn-primary">Reset to Defaults</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      <div 
        className={`main-menu-sidebar ${isExpanded ? 'expanded' : ''}`}
        id="mainMenuSidebar"
      >
      <div className="header-area">
        {isExpanded && (
          <div className="menu-header-expanded">
            <button className="header-icon">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button 
              className={`header-icon ${helpEnabled ? 'active' : ''}`}
              onClick={() => {
                const newValue = !helpEnabled
                setHelpEnabled(newValue)
                localStorage.setItem('help-documentation-enabled', JSON.stringify(newValue))
                // Dispatch custom event to notify other components
                window.dispatchEvent(new CustomEvent('help-documentation-changed', { 
                  detail: { enabled: newValue } 
                }))
              }}
              title={helpEnabled ? 'Disable Help & Documentation' : 'Enable Help & Documentation'}
            >
              <span className="material-symbols-outlined">
                info
              </span>
            </button>
            <button 
              className="header-icon"
              onClick={() => {
                setShowUserModal(true)
                setModalView('menu')
              }}
            >
              <span className="material-symbols-outlined">person</span>
            </button>
          </div>
        )}
        <button className="header-logout" onClick={handleLogout}>
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
      
      <div className="nav-items-container">
        {isExpanded && (
          <div className="sidebar-logo">
            <img 
              src="/media/20Highline_Primary-Logo_Blooms_RGB.png" 
              alt="Highline Logo" 
              className="logo-image"
              style={{ 
                maxWidth: '220px', 
                maxHeight: 'auto', 
                width: 'auto', 
                height: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>
        )}
        
        <div className="nav-items-main">
          {navItems.map((item) => (
            <div key={item.title} className="nav-item-group">
              {item.href ? (
                <Link
                  href={item.href}
                  className="menu-icon-link"
                >
                  <span>{item.title}</span>
                  <span className="material-symbols-outlined">{item.icon}</span>
                </Link>
              ) : (
                <>
                  <a
                    href={!isExpanded && item.subItems ? item.subItems[0].href : '#'}
                    onClick={(e) => handleNavClick(item, e)}
                    className={`menu-icon-link nav-parent ${activeSubNavs.has(item.title) ? 'expanded' : ''}`}
                  >
                    <span>{item.title}</span>
                    <span className="expand-icon material-symbols-outlined">
                      keyboard_arrow_right
                    </span>
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </a>
                  <div 
                    className={`sub-nav ${activeSubNavs.has(item.title) ? 'expanded' : ''}`}
                    id={item.title.toLowerCase()}
                  >
                    {item.subItems?.map((subItem) => (
                      <Link
                        key={subItem.title}
                        href={subItem.href}
                        className="sub-nav-item"
                      >
                        <span>{subItem.title}</span>
                        <span className="material-symbols-outlined">{subItem.icon}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
          
          <button
            onClick={toggleMenu}
            className="nav-circle main"
          ></button>
        </div>
      </div>
    </div>
    </>
  )
}