'use client'

import { useMemo } from 'react'
import 'katex/dist/katex.min.css'

// Use require to force Next.js to use the CommonJS version consistently
// avoiding the dual-package hazard where mhchem extends the wrong katex instance.
const katex = require('katex')
require('katex/dist/contrib/mhchem.js')

type LatexProps = {
  children: string
  className?: string
}

/**
 * Renders text with inline ($...$) and display ($$...$$) LaTeX equations.
 * Non-LaTeX text is rendered as-is. Handles mixed content gracefully.
 */
export default function Latex({ children, className }: LatexProps) {
  const rendered = useMemo(() => {
    if (!children) return ''

    try {
      // Split on display math ($$...$$) and inline math ($...$)
      // Process display math first, then inline
      const parts: { type: 'text' | 'inline' | 'display'; content: string }[] = []
      let remaining = children

      // Regex: match $$...$$, \[...\], $...$ (inline), or \(...\)
      const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?!\$)[\s\S]*?\$|\\\([\s\S]*?\\\))/g
      let lastIndex = 0
      let match

      while ((match = regex.exec(remaining)) !== null) {
        // Text before this match
        if (match.index > lastIndex) {
          parts.push({ type: 'text', content: remaining.slice(lastIndex, match.index) })
        }

        const raw = match[0]
        let type: 'display' | 'inline' = 'inline'
        let content = ''

        if (raw.startsWith('$$') && raw.endsWith('$$')) {
          type = 'display'
          content = raw.slice(2, -2)
        } else if (raw.startsWith('\\[') && raw.endsWith('\\]')) {
          type = 'display'
          content = raw.slice(2, -2)
        } else if (raw.startsWith('\\(') && raw.endsWith('\\)')) {
          type = 'inline'
          content = raw.slice(2, -2)
        } else if (raw.startsWith('$') && raw.endsWith('$')) {
          type = 'inline'
          content = raw.slice(1, -1)
        } else {
          content = raw
        }

        parts.push({ type, content })

        lastIndex = match.index + raw.length
      }

      // Remaining text
      if (lastIndex < remaining.length) {
        parts.push({ type: 'text', content: remaining.slice(lastIndex) })
      }

      // Render to HTML
      return parts.map((p, i) => {
        if (p.type === 'text') {
          return p.content
        }

        try {
          const html = katex.renderToString(p.content, {
            throwOnError: false,
            displayMode: p.type === 'display',
            trust: true,
            macros: {
              '\\cf': '\\ce{#1}',
            }
          })
          if (html.includes('katex-error')) {
            console.error('KaTeX rendering error for:', p.content, 'HTML:', html)
          }
          return `<span class="latex-${p.type}" key="${i}">${html}</span>`
        } catch {
          // If KaTeX fails entirely, show the raw LaTeX
          return p.content
        }
      }).join('')
    } catch {
      return children
    }
  }, [children])

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  )
}
