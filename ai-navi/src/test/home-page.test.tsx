import { cleanup, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import HomePage from '../pages/HomePage'

describe('AI NAVI product gateway', () => {
  afterEach(cleanup)

  it('starts from the task and gives exactly the two product destinations', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByText('לא מתחילים בכלי. מתחילים במשימה.')).toBeVisible()

    const destinations = screen.getAllByRole('link')
    expect(destinations).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'למצגת האינטראקטיבית' })).toHaveAttribute('href', '/presentation')
    expect(screen.getByRole('link', { name: 'להתחלת ניווט אישי' })).toHaveAttribute('href', '/navigator')
  })

  it('keeps each decision junction and context visible in the document', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    for (const label of ['משימה', 'חומר גלם', 'תוצר', 'עדיפויות', 'מעורבות', 'כלי או מסלול']) {
      expect(screen.getByText(label)).toBeVisible()
    }

    for (const context of ['חינוך', 'ניהול', 'יזמות', 'שיווק', 'שימוש כללי']) {
      expect(screen.getByText(context)).toBeVisible()
    }
  })

  it('gives destination links a local high-contrast keyboard focus treatment', () => {
    const homeCss = readFileSync(resolve(process.cwd(), 'src/styles/home.css'), 'utf8')

    expect(homeCss).toMatch(
      /\.navi-gateway__destination-link:focus-visible\s*\{[\s\S]*outline:\s*3px solid var\(--navi-ink\);[\s\S]*outline-offset:\s*3px;[\s\S]*background:\s*var\(--navi-paper\);[\s\S]*\}/,
    )
  })
})
