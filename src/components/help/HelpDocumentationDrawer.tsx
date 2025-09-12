'use client'

import { useHelpDocumentation } from '@/contexts/HelpDocumentationContext'

export default function HelpDocumentationDrawer() {
  const { isDrawerOpen, currentSection, hideDocumentation } = useHelpDocumentation()

  if (!isDrawerOpen || !currentSection) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="help-drawer-backdrop"
        onClick={hideDocumentation}
      />
      
      {/* Drawer */}
      <div className="help-drawer">
        {/* Header */}
        <div className="help-drawer-header">
          <div className="help-drawer-title">
            <span className="material-symbols-outlined">help</span>
            <h3>Help & Documentation</h3>
          </div>
          <button 
            className="help-drawer-close"
            onClick={hideDocumentation}
            title="Close Documentation"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="help-drawer-content">
          {/* Section Title */}
          <div className="help-section-header">
            <h4>{currentSection.title}</h4>
            <p className="help-section-description">{currentSection.description}</p>
          </div>
          
          {/* Goal */}
          <div className="help-section-item">
            <div className="help-section-label">
              <span className="material-symbols-outlined">flag</span>
              Goal
            </div>
            <p>{currentSection.goal}</p>
          </div>
          
          {/* Logic */}
          <div className="help-section-item">
            <div className="help-section-label">
              <span className="material-symbols-outlined">psychology</span>
              Logic & Implementation
            </div>
            <p>{currentSection.logic}</p>
          </div>
          
          {/* Data Source */}
          {currentSection.dataSource && (
            <div className="help-section-item">
              <div className="help-section-label">
                <span className="material-symbols-outlined">database</span>
                Data Source
              </div>
              <p>{currentSection.dataSource}</p>
            </div>
          )}
          
          {/* Calculations */}
          {currentSection.calculations && currentSection.calculations.length > 0 && (
            <div className="help-section-item">
              <div className="help-section-label">
                <span className="material-symbols-outlined">calculate</span>
                Calculations
              </div>
              <ul className="help-list">
                {currentSection.calculations.map((calc, index) => (
                  <li key={index}>{calc}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Filters */}
          {currentSection.filters && currentSection.filters.length > 0 && (
            <div className="help-section-item">
              <div className="help-section-label">
                <span className="material-symbols-outlined">filter_list</span>
                Available Filters
              </div>
              <ul className="help-list">
                {currentSection.filters.map((filter, index) => (
                  <li key={index}>{filter}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Sort Options */}
          {currentSection.sortOptions && currentSection.sortOptions.length > 0 && (
            <div className="help-section-item">
              <div className="help-section-label">
                <span className="material-symbols-outlined">sort</span>
                Sort Options
              </div>
              <ul className="help-list">
                {currentSection.sortOptions.map((option, index) => (
                  <li key={index}>{option}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Examples */}
          {currentSection.examples && currentSection.examples.length > 0 && (
            <div className="help-section-item">
              <div className="help-section-label">
                <span className="material-symbols-outlined">lightbulb</span>
                Examples
              </div>
              <ul className="help-list">
                {currentSection.examples.map((example, index) => (
                  <li key={index}>{example}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  )
}