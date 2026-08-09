import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../App'
import { saveNavigatorState } from '../lib/storage'

const readProjectFile = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('application accessibility and responsive contract', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('declares Hebrew RTL document semantics and one skip-targeted main landmark', () => {
    expect(readProjectFile('index.html')).toMatch(/<html\s+lang="he"\s+dir="rtl">/)
    render(<MemoryRouter><App /></MemoryRouter>)

    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'דלגו לתוכן הראשי' })).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  it('keeps focus, touch targets, horizontal containment and reduced motion explicit', () => {
    const globalCss = readProjectFile('src/styles/global.css')
    const presentationCss = readProjectFile('src/styles/presentation.css')

    expect(globalCss).toMatch(/body\s*\{[^}]*overflow-x:\s*clip/s)
    expect(globalCss).toMatch(/:focus-visible\s*\{[^}]*outline:\s*3px/s)
    expect(globalCss).toMatch(/:where\(button,\s*input,\s*textarea,\s*select\)[^{]*\{[^}]*min-height:\s*44px/s)
    expect(globalCss).toMatch(/\.navi-action-link\s*\{[^}]*display:\s*inline-flex[^}]*min-block-size:\s*44px[^}]*align-items:\s*center/s)
    expect(globalCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
    expect(presentationCss).toMatch(/@media\s*\(max-width:\s*32rem\)[\s\S]*?\.navi-presentation-controls button\s*\{[^}]*min-height:\s*2\.75rem/s)
    expect(presentationCss).toMatch(/@media\s*\(max-height:\s*35rem\)[\s\S]*?\.navi-presentation-controls button\s*\{[^}]*min-height:\s*2\.75rem/s)
    expect(presentationCss).toMatch(/\.navi-presenter-notes button,\s*\.navi-presenter-notes select\s*\{[^}]*min-height:\s*2\.75rem/s)
  })

  it.each([
    ['/', ['למצגת האינטראקטיבית', 'להתחלת ניווט אישי']],
    ['/results', ['חזרה לניווט']],
    ['/presentation', ['פתיחת ה־Navigator']],
  ])('applies the shared 44px action-link contract on %s', (route, names) => {
    if (route === '/presentation') {
      localStorage.setItem('ai-navi:presentation-state:v1', JSON.stringify({ version: 1, slideIndex: 24, revealIndex: 0 }))
    }
    render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>)

    expect(screen.getByRole('link', { name: 'דלגו לתוכן הראשי' })).toHaveClass('navi-action-link')
    for (const name of names) {
      expect(screen.getByRole('link', { name })).toHaveClass('navi-action-link')
    }
  })

  it('covers complete-result actions and the final presentation call to action', () => {
    saveNavigatorState({
      version: 1,
      mode: 'questions',
      currentStep: 6,
      taskText: 'הפיכת דוח למצגת',
      complete: true,
      privacyConfirmed: false,
      answers: {
        taskText: 'הפיכת דוח למצגת', taskTypes: ['present'], inputTypes: ['documents'], outputType: 'presentation',
        priorities: ['quality'], timeAvailable: 'under-one-hour', difficulty: 'intermediate', privacy: 'no',
      },
    })
    const results = render(<MemoryRouter initialEntries={['/results']}><App /></MemoryRouter>)
    for (const name of ['שינוי תשובה', 'פתיחת מצב מצגת']) {
      expect(screen.getByRole('link', { name })).toHaveClass('navi-action-link')
    }
    results.unmount()
    localStorage.setItem('ai-navi:presentation-state:v1', JSON.stringify({ version: 1, slideIndex: 25, revealIndex: 0 }))

    render(<MemoryRouter initialEntries={['/presentation']}><App /></MemoryRouter>)

    expect(screen.getByRole('link', { name: 'מה המשימה שלך היום?' })).toHaveClass('navi-action-link')
  })

  it('exposes the documented local preview command', () => {
    const packageJson = JSON.parse(readProjectFile('package.json')) as { scripts?: Record<string, string> }
    expect(packageJson.scripts?.preview).toBe('vite preview')
  })
})
