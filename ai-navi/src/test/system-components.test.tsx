import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  NaviLogo,
  Notice,
  PageHeader,
  ProgressPath,
  RouteLine,
  Station,
  StatusBadge,
} from '../components/system'

describe('metro navigation component system', () => {
  afterEach(cleanup)

  it('renders an interactive station as a native button with its accessible label', () => {
    const onClick = vi.fn()

    render(
      <Station
        label="בחירת קהל"
        asButton
        ariaLabel="בחירת קהל, שלב 2"
        onClick={onClick}
      />,
    )

    const station = screen.getByRole('button', { name: 'בחירת קהל, שלב 2' })
    expect(station).toHaveTextContent('בחירת קהל')
    fireEvent.click(station)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('announces the current progress step and marks it as the current step', () => {
    render(
      <ProgressPath
        steps={[
          { id: 'goal', label: 'מטרה' },
          { id: 'audience', label: 'קהל' },
          { id: 'route', label: 'מסלול' },
        ]}
        currentIndex={1}
      />,
    )

    expect(screen.getByText('שלב 2 מתוך 3')).toBeInTheDocument()
    expect(screen.getByText('קהל').closest('.navi-station')).toHaveAttribute('aria-current', 'step')
  })

  it('makes decorative route lines invisible to assistive technology', () => {
    render(<RouteLine tone="lavender" direction="vertical" active />)

    expect(screen.getByTestId('route-line')).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders a written status label in addition to its visual state', () => {
    render(<StatusBadge status="risk">נדרשת בדיקה של נתוני המקור</StatusBadge>)

    expect(screen.getByText('סיכון')).toBeVisible()
    expect(screen.getByText('נדרשת בדיקה של נתוני המקור')).toBeVisible()
  })

  it('provides composable branded, notice, and header content', () => {
    render(
      <>
        <NaviLogo />
        <PageHeader eyebrow="מסלול 01" title="תכנון מצגת" description="בוחרים תחנה." />
        <Notice tone="warning" title="שימו לב">בדקו את הפרטים לפני שיתוף.</Notice>
      </>,
    )

    expect(screen.getByText('AI NAVI')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'תכנון מצגת' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('שימו לב')
  })
})
