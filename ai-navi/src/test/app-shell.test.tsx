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
    expect(screen.getByRole('link', { name: 'למצגת האינטראקטיבית' })).toHaveAttribute('href', '/presentation')
    expect(screen.getByRole('link', { name: 'להתחלת ניווט אישי' })).toHaveAttribute('href', '/navigator')
    expect(screen.getByText(/המלצות וכלים עשויים להשתנות/)).toBeInTheDocument()
  })

  it('makes its task-first guidance visibly relevant across core audiences', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    for (const context of ['חינוך', 'ניהול', 'יזמות', 'שיווק', 'שימוש כללי']) {
      expect(screen.getByText(context)).toBeVisible()
    }
  })

  it('has a print contract that removes the persistent freshness notice', () => {
    const globalCss = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8')

    expect(globalCss).toMatch(/@media print\s*\{[\s\S]*\.navi-freshness\s*,\s*\.navi-skip-link\s*\{\s*display:\s*none;?\s*\}/)
  })

  it.each([
    ['/presentation', 'בניית מצגת'],
    ['/navigator', 'התחלת ניווט'],
    ['/results', 'התוצאות שלך'],
  ])('renders route content on a direct visit to %s', (route, title) => {
    render(
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    expect(screen.queryByText('לא מתחילים בכלי. מתחילים במשימה.')).not.toBeInTheDocument()
  })
})
