'use client'

import { useHelpDocumentation, DocSection } from '@/contexts/HelpDocumentationContext'

interface DocumentedTitleProps {
  title: string
  icon?: string
  documentation: DocSection
  children?: React.ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export default function DocumentedTitle({ 
  title, 
  icon, 
  documentation, 
  children, 
  className = '',
  as: Component = 'h3'
}: DocumentedTitleProps) {
  const { isEnabled, showDocumentation } = useHelpDocumentation()

  const handleClick = () => {
    if (isEnabled) {
      showDocumentation(documentation)
    }
  }

  const titleContent = (
    <>
      {icon && <span className="material-symbols-outlined">{icon}</span>}
      {title}
      {isEnabled && (
        <span className="help-indicator" title="Click for help documentation">
          <span className="material-symbols-outlined">help</span>
        </span>
      )}
      {children}
    </>
  )

  if (isEnabled) {
    return (
      <Component 
        className={`${className} ${isEnabled ? 'documented-title clickable' : ''}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
        title="Click for help documentation"
      >
        {titleContent}
      </Component>
    )
  }

  return (
    <Component className={className}>
      {titleContent}
    </Component>
  )
}