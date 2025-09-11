export interface TimelineEvent {
  title: string
  description?: string
  date: Date
  type: string
  status: 'pending' | 'in_progress' | 'completed'
}

export interface HeaderWithContent {
  title: string
  content: string
  htmlContent: string
}

export interface MarkdownParseResult {
  headers: string[]
  headersWithContent: HeaderWithContent[]
  content: string
  previewHtml: string
}

/**
 * Convert markdown content to HTML with better formatting
 */
function convertMarkdownToHtml(markdown: string): string {
  if (!markdown.trim()) return ''
  
  let html = markdown
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    
    // Code (inline and blocks)
    .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    
    // Process lists (both ordered and unordered)
    .split('\n')
    .map(line => {
      // Unordered lists
      if (/^\s*[-*+]\s+(.+)/.test(line)) {
        const indent = (line.match(/^\s*/)?.[0].length || 0) / 2
        const content = line.replace(/^\s*[-*+]\s+/, '')
        return `<li style="margin-left: ${indent * 20}px">${content}</li>`
      }
      // Ordered lists
      if (/^\s*\d+\.\s+(.+)/.test(line)) {
        const indent = (line.match(/^\s*/)?.[0].length || 0) / 2
        const content = line.replace(/^\s*\d+\.\s+/, '')
        return `<li style="margin-left: ${indent * 20}px">${content}</li>`
      }
      return line
    })
    .join('\n')
    
    // Convert line breaks and paragraphs
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br>')
  
  // Wrap in paragraph tags and clean up
  html = `<p>${html}</p>`
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-6]>)/g, '$1')
    .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
    .replace(/<p>(<li)/g, '<ul>$1')
    .replace(/(<\/li>)<\/p>/g, '$1</ul>')
    .replace(/<ul>(<li[^>]*>[^<]*<\/li>)\s*<ul>/g, '<ul>$1')
    .replace(/<\/ul>\s*(<li)/g, '$1')
    .replace(/(<\/li>)\s*<\/ul>/g, '$1</ul>')
  
  return html
}

/**
 * Parse markdown content and extract H1 headers with their content for timeline generation
 */
export function parseMarkdownHeaders(content: string): MarkdownParseResult {
  if (!content.trim()) {
    return { headers: [], headersWithContent: [], content: '', previewHtml: '' }
  }

  // Extract H1 headers (lines starting with # followed by space)
  const h1Regex = /^#\s+(.+)$/gm
  const headers: string[] = []
  const headersWithContent: HeaderWithContent[] = []
  
  // Split content by H1 headers to extract content under each header
  const sections = content.split(/^#\s+/gm).filter(section => section.trim())
  
  // Process each section (first section might not have a header if content doesn't start with H1)
  sections.forEach((section, index) => {
    const lines = section.split('\n')
    const headerTitle = lines[0].trim()
    
    // Skip if this looks like content before the first header
    if (index === 0 && !content.trim().startsWith('#')) {
      return
    }
    
    // Get content under this header (everything except the first line which is the header)
    const sectionContent = lines.slice(1).join('\n').trim()
    
    headers.push(headerTitle)
    headersWithContent.push({
      title: headerTitle,
      content: sectionContent || '',
      htmlContent: sectionContent ? convertMarkdownToHtml(sectionContent) : ''
    })
  })

  // Generate basic HTML preview (simple markdown-to-HTML conversion)
  const previewHtml = content
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
  
  return {
    headers,
    headersWithContent,
    content,
    previewHtml: `<p>${previewHtml}</p>`
  }
}

/**
 * Generate timeline events from markdown headers with specified spacing
 */
export function generateTimelineEvents(
  headersWithContent: HeaderWithContent[],
  startDate: Date,
  spacingDays: number
): TimelineEvent[] {
  if (!headersWithContent.length) return []

  const events: TimelineEvent[] = []
  
  headersWithContent.forEach((headerData, index) => {
    // If spacingDays is 0 (None), use a placeholder date or the same startDate for all
    const eventDate = new Date(startDate)
    if (spacingDays > 0) {
      eventDate.setDate(startDate.getDate() + (index * spacingDays))
    }
    // When spacingDays is 0, all events will have the same date (startDate)
    
    events.push({
      title: headerData.title,
      description: headerData.htmlContent || headerData.content || `Generated from markdown H1 header: "${headerData.title}"`,
      date: eventDate,
      type: 'milestone',
      status: 'pending'
    })
  })

  return events
}

/**
 * Generate timeline events from markdown headers with specified spacing (legacy compatibility)
 */
export function generateTimelineEventsFromHeaders(
  headers: string[],
  startDate: Date,
  spacingDays: number
): TimelineEvent[] {
  if (!headers.length) return []

  const events: TimelineEvent[] = []
  
  headers.forEach((header, index) => {
    // If spacingDays is 0 (None), use a placeholder date or the same startDate for all
    const eventDate = new Date(startDate)
    if (spacingDays > 0) {
      eventDate.setDate(startDate.getDate() + (index * spacingDays))
    }
    // When spacingDays is 0, all events will have the same date (startDate)
    
    events.push({
      title: header,
      description: `Generated from markdown H1 header: "${header}"`,
      date: eventDate,
      type: 'milestone',
      status: 'pending'
    })
  })

  return events
}

/**
 * Validate uploaded file is a markdown file
 */
export function validateMarkdownFile(file: File): { valid: boolean; error?: string } {
  // Check file extension
  const validExtensions = ['.md', '.markdown', '.mdown', '.mkdn', '.mdwn']
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
  
  if (!validExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `Invalid file type. Please upload a markdown file (${validExtensions.join(', ')})`
    }
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 5MB.'
    }
  }

  // More permissive MIME type checking for markdown files
  // Many markdown files have no MIME type or application/octet-stream
  const allowedMimeTypes = [
    'text/markdown',
    'text/x-markdown', 
    'text/plain',
    'application/octet-stream',
    '' // Empty MIME type is common for .md files
  ]
  
  if (file.type && !allowedMimeTypes.includes(file.type)) {
    // Only reject if it's clearly a non-text file type
    if (file.type.startsWith('image/') || 
        file.type.startsWith('video/') || 
        file.type.startsWith('audio/') ||
        file.type.includes('pdf') ||
        file.type.includes('zip') ||
        file.type.includes('binary')) {
      return {
        valid: false,
        error: 'File must be a text-based markdown file.'
      }
    }
  }

  return { valid: true }
}

/**
 * Read file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const content = event.target?.result as string
      resolve(content || '')
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}