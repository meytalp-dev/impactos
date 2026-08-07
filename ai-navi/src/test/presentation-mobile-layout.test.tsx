import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { slides } from '../data/slides'
import { SlideRenderer } from '../features/presentation/SlideRenderer'

function cssBlock(source: string, selector: string): string {
  const selectorIndex = source.indexOf(selector)
  if (selectorIndex < 0) return ''
  const openingBrace = source.indexOf('{', selectorIndex)
  if (openingBrace < 0) return ''
  let depth = 0
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    if (source[index] === '}') depth -= 1
    if (depth === 0) return source.slice(openingBrace + 1, index)
  }
  return ''
}

describe('presentation mobile readability contract', () => {
  afterEach(cleanup)

  it('marks every opening layout as a mobile-stackable content structure', () => {
    for (const [index, slide] of slides.entries()) {
      const view = render(
        <SlideRenderer slide={slide} revealIndex={0} slideNumber={index + 1} totalSlides={slides.length} />,
      )

      const mobileLayout = view.container.querySelector('.navi-slide-layout--mobile-stack')
      expect(mobileLayout).toHaveAttribute('data-mobile-layout', 'stack')
      view.unmount()
    }
  })

  it('keeps desktop 16:9 while switching <=640px slides to a readable vertical canvas', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/presentation.css'), 'utf8')
    const desktopStage = cssBlock(css, '.navi-presentation-stage-frame')
    const narrowMobile = cssBlock(css, '@media (max-width: 40rem)')
    const mobileStage = cssBlock(narrowMobile, '.navi-presentation-stage-frame')
    const mobileSlide = cssBlock(narrowMobile, '.navi-slide')
    const mobileStack = cssBlock(narrowMobile, '.navi-slide-layout--mobile-stack')

    expect(desktopStage).toMatch(/aspect-ratio:\s*16\s*\/\s*9/)
    expect(mobileStage).toMatch(/aspect-ratio:\s*auto/)
    expect(mobileStage).toMatch(/overflow:\s*visible/)
    expect(mobileSlide).toMatch(/height:\s*auto/)
    expect(mobileSlide).toMatch(/overflow:\s*visible/)
    expect(mobileStack).toMatch(/grid-template-columns:\s*1fr/)
  })

  it('sets explicit readable type floors for meaningful content at <=640px', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/presentation.css'), 'utf8')
    const narrowMobile = cssBlock(css, '@media (max-width: 40rem)')
    const twelvePixelSelectors = [
      '.navi-slide-cover__route',
      '.navi-slide-overload__cards span',
      '.navi-slide-route__label',
    ]
    const fourteenPixelSelectors = [
      '.navi-slide-route li',
      '.navi-slide-junctions__map strong',
      '.navi-slide-options__content li',
      '.navi-slide-modes__list strong',
      '.navi-slide-plan__route strong',
      '.navi-slide-game__board li strong',
      '.navi-slide-families__station strong',
      '.navi-slide-navigator__questions strong',
      '.navi-slide-takeaways__list li',
    ]

    for (const selector of twelvePixelSelectors) {
      expect(cssBlock(narrowMobile, selector), selector).toMatch(/font-size:\s*0\.75rem/)
    }
    for (const selector of fourteenPixelSelectors) {
      expect(cssBlock(narrowMobile, selector), selector).toMatch(/font-size:\s*0\.875rem/)
    }
  })
})
