import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('AI NAVI application shell', () => {
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
})
