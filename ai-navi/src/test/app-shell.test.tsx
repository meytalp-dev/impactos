import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import App from '../App'

describe('AI NAVI application shell', () => {
  afterEach(cleanup)

  it('provides the Hebrew task-first home shell and navigation destinations', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'דלגו לתוכן הראשי' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByText('AI NAVI')).toBeInTheDocument()
    expect(screen.getByText('לא מתחילים בכלי. מתחילים במשימה.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'למצגת' })).toHaveAttribute('href', '/presentation')
    expect(screen.getByRole('link', { name: 'להתחלת ניווט' })).toHaveAttribute('href', '/navigator')
    expect(screen.getByText(/המלצות וכלים עשויים להשתנות/)).toBeInTheDocument()
  })

  it('makes its task-first guidance visibly relevant across core audiences', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText('מתאים לחינוך, ניהול, יזמות, שיווק ולכל משימה כללית.')).toBeInTheDocument()
  })

  it('has a print contract that removes the persistent freshness notice', () => {
    const globalCss = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8')

    expect(globalCss).toMatch(/@media print\s*\{[\s\S]*\.navi-freshness\s*,\s*\.navi-skip-link\s*\{\s*display:\s*none;?\s*\}/)
  })
})
