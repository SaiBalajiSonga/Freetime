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
          // Pre-process common chemistry typos:
          // Authors often accidentally close \ce{} early before an arrow, e.g. \ce{\text{...}} ->[...]
          // This causes the arrow to render as '- >' outside of mhchem.
          let content = p.content.replace(/}}\s*->/g, '} ->')

          const html = katex.renderToString(content, {
            throwOnError: true,
            displayMode: p.type === 'display',
            trust: true,
            macros: {
              '\\cf': '\\ce{#1}',
            }
          })
          return `<span class="latex-${p.type}" key="${i}">${html}</span>`
        } catch (err: any) {
          // Auto-fix: author accidentally added an extra closing brace at the end
          if (err.message && err.message.includes("Expected 'EOF', got '}'")) {
            try {
              const fixedContent = content.trim().replace(/}+$/, '')
              const fixedHtml = katex.renderToString(fixedContent, {
                throwOnError: true,
                displayMode: p.type === 'display',
                trust: true,
                macros: { '\\cf': '\\ce{#1}' }
              })
              // Successfully auto-fixed, no need to warn!
              return `<span class="latex-${p.type}" key="${i}">${fixedHtml}</span>`
            } catch (e2: any) {
              // Auto-fix failed, fallback to raw
              console.error('KaTeX auto-fix failed for:', content, 'Error:', e2.message)
            }
          }

          // If we reach here, it's a genuine failure we couldn't fix
          console.warn('KaTeX rendering error for:', content, err.message)
          
          // Fallback: render the raw string gracefully without bright red error colors
          return `<span class="latex-fallback font-mono opacity-80" key="${i}">${content}</span>`
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
