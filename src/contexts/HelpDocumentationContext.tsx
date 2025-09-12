'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface DocSection {
  id: string
  title: string
  description: string
  goal: string
  logic: string
  dataSource?: string
  calculations?: string[]
  filters?: string[]
  sortOptions?: string[]
  examples?: string[]
}

interface HelpDocumentationContextType {
  isEnabled: boolean
  setIsEnabled: (enabled: boolean) => void
  isDrawerOpen: boolean
  setIsDrawerOpen: (open: boolean) => void
  currentSection: DocSection | null
  showDocumentation: (section: DocSection) => void
  hideDocumentation: () => void
}

const HelpDocumentationContext = createContext<HelpDocumentationContextType | undefined>(undefined)

export function useHelpDocumentation() {
  const context = useContext(HelpDocumentationContext)
  if (!context) {
    throw new Error('useHelpDocumentation must be used within a HelpDocumentationProvider')
  }
  return context
}

interface HelpDocumentationProviderProps {
  children: ReactNode
}

export default function HelpDocumentationProvider({ children }: HelpDocumentationProviderProps) {
  const [isEnabled, setIsEnabledState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('help-documentation-enabled')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [currentSection, setCurrentSection] = useState<DocSection | null>(null)

  // Save enabled state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('help-documentation-enabled', JSON.stringify(isEnabled))
    }
  }, [isEnabled])

  // Listen for help documentation changes from sidebar
  useEffect(() => {
    const handleHelpChange = (event: CustomEvent) => {
      setIsEnabledState(event.detail.enabled)
    }

    window.addEventListener('help-documentation-changed', handleHelpChange as EventListener)
    return () => {
      window.removeEventListener('help-documentation-changed', handleHelpChange as EventListener)
    }
  }, [])

  const setIsEnabled = (enabled: boolean) => {
    setIsEnabledState(enabled)
    if (!enabled && isDrawerOpen) {
      setIsDrawerOpen(false)
      setCurrentSection(null)
    }
  }

  const showDocumentation = (section: DocSection) => {
    if (!isEnabled) return
    setCurrentSection(section)
    setIsDrawerOpen(true)
  }

  const hideDocumentation = () => {
    setIsDrawerOpen(false)
    setCurrentSection(null)
  }

  return (
    <HelpDocumentationContext.Provider value={{
      isEnabled,
      setIsEnabled,
      isDrawerOpen,
      setIsDrawerOpen,
      currentSection,
      showDocumentation,
      hideDocumentation
    }}>
      {children}
    </HelpDocumentationContext.Provider>
  )
}

export type { DocSection }