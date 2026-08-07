import type { ReactNode } from 'react'
import type { SlideDefinition, SlideLayout, SlideVariant } from '../../lib/presentationTypes'

type SlideRendererProps = {
  slide: SlideDefinition
  revealIndex: number
  slideNumber: number
  totalSlides: number
}

type RouteVisual = {
  waze?: string[]
  aiNavi?: string[]
  routes?: string[]
  tools?: string[]
}

const mistakeDetails = [
  'בוחרים לפי מה שמדברים עליו עכשיו',
  'מכריחים כל משימה להתאים להרגל',
  'פותחים אפליקציה לפני שמגדירים הצלחה',
]

function RouteSequence({ label, items, tone }: { label: string; items: string[]; tone: string }) {
  return (
    <div className={`navi-slide-route navi-slide-route--${tone}`}>
      <span className="navi-slide-route__label">{label}</span>
      <ol>
        {items.map((item, index) => (
          <li key={item}>
            <span>{item}</span>
            {index < items.length - 1 && <i aria-hidden="true">←</i>}
          </li>
        ))}
      </ol>
    </div>
  )
}

function CoverSlide({ slide }: { slide: SlideDefinition }) {
  const routes = (slide.visual as RouteVisual | undefined)?.routes ?? []
  return (
    <div className="navi-slide-layout navi-slide-layout--mobile-stack navi-slide-cover" data-mobile-layout="stack">
      <div className="navi-slide-cover__copy">
        <p className="navi-slide__eyebrow">{slide.eyebrow}</p>
        <h2>{slide.title}</h2>
        <p className="navi-slide-cover__subtitle">{slide.body}</p>
      </div>
      <div className="navi-slide-cover__map" aria-label="מסלולים לקטגוריות עבודה">
        <span className="navi-slide-cover__hub">N</span>
        {routes.map((route, index) => (
          <span className={`navi-slide-cover__route navi-slide-cover__route--${index + 1}`} key={route}>
            <i aria-hidden="true" />
            <b>{route}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

function ToolOverloadSlide({ slide, revealIndex }: { slide: SlideDefinition; revealIndex: number }) {
  const tools = (slide.visual as RouteVisual | undefined)?.tools ?? []
  return (
    <div className="navi-slide-layout navi-slide-layout--mobile-stack navi-slide-overload" data-mobile-layout="stack">
      <div className="navi-slide-overload__copy">
        <p className="navi-slide__eyebrow">{slide.eyebrow}</p>
        <h2>{slide.title}</h2>
        <p>{slide.interaction}</p>
      </div>
      <div className="navi-slide-overload__cards" aria-label="עומס כלי בינה מלאכותית">
        {tools.map((tool, index) => {
          const disappearAt = 3 - (index % 3)
          const hidden = revealIndex >= disappearAt
          return <span key={tool} className={hidden ? 'is-hidden' : ''} aria-hidden={hidden}>{tool}</span>
        })}
      </div>
    </div>
  )
}

function ProblemSlide({ slide }: { slide: SlideDefinition }) {
  return (
    <div className="navi-slide-layout navi-slide-layout--mobile-stack navi-slide-problem" data-mobile-layout="stack">
      <p className="navi-slide__eyebrow">{slide.eyebrow}</p>
      <h2>{slide.title}</h2>
      <p className="navi-slide-problem__statement">{slide.body}</p>
      <ol className="navi-slide-problem__mistakes">
        {slide.bullets?.map((bullet, index) => (
          <li key={bullet}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{bullet}</strong>
            <small>{mistakeDetails[index]}</small>
          </li>
        ))}
      </ol>
    </div>
  )
}

function ComparisonSlide({ slide }: { slide: SlideDefinition }) {
  const visual = slide.visual as RouteVisual | undefined
  return (
    <div className="navi-slide-layout navi-slide-layout--mobile-stack navi-slide-comparison" data-mobile-layout="stack">
      <p className="navi-slide__eyebrow">{slide.eyebrow}</p>
      <h2>{slide.title}</h2>
      <div className="navi-slide-comparison__routes">
        <RouteSequence label="WAZE" items={visual?.waze ?? []} tone="blue" />
        <RouteSequence label="AI NAVI" items={visual?.aiNavi ?? []} tone="peach" />
      </div>
      <p className="navi-slide-comparison__message">{slide.body}</p>
    </div>
  )
}

function JunctionMapSlide({ slide }: { slide: SlideDefinition }) {
  return (
    <div className="navi-slide-layout navi-slide-layout--mobile-stack navi-slide-junctions" data-mobile-layout="stack">
      <div className="navi-slide-junctions__heading">
        <p className="navi-slide__eyebrow">{slide.eyebrow}</p>
        <h2>{slide.title}</h2>
        <p>{slide.body}</p>
      </div>
      <ol className="navi-slide-junctions__map">
        {slide.bullets?.map((bullet, index) => (
          <li key={bullet}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{bullet}</strong>
            {index < (slide.bullets?.length ?? 0) - 1 && <i aria-hidden="true" />}
          </li>
        ))}
      </ol>
    </div>
  )
}

function StandardSlide({ slide }: { slide: SlideDefinition }) {
  return (
    <div className={`navi-slide-layout navi-slide-layout--mobile-stack navi-slide-generic navi-slide-generic--${slide.layout}`} data-mobile-layout="stack" aria-label={`תוכן שקופית ${slide.layout}`}>
      <p className="navi-slide__eyebrow">{slide.eyebrow}</p>
      <h2>{slide.title}</h2>
      {slide.body && <p>{slide.body}</p>}
      {slide.bullets && <ul>{slide.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
    </div>
  )
}

function UnsupportedSlide({ layout, variant }: { layout: string; variant: string }) {
  return (
    <div className="navi-slide-unsupported" role="alert">
      תצורת שקופית אינה נתמכת: {layout} / {variant}
    </div>
  )
}

type SlideContentRenderer = (slide: SlideDefinition, revealIndex: number) => ReactNode

const slideRenderers: Record<SlideLayout, Partial<Record<SlideVariant, SlideContentRenderer>>> = {
  cover: {
    'route-map': (slide) => <CoverSlide slide={slide} />,
  },
  statement: {
    'tool-overload': (slide, revealIndex) => <ToolOverloadSlide slide={slide} revealIndex={revealIndex} />,
    problem: (slide) => <ProblemSlide slide={slide} />,
  },
  comparison: {
    'route-comparison': (slide) => <ComparisonSlide slide={slide} />,
  },
  map: {
    'junction-map': (slide) => <JunctionMapSlide slide={slide} />,
  },
  activity: { standard: (slide) => <StandardSlide slide={slide} /> },
  demo: { standard: (slide) => <StandardSlide slide={slide} /> },
  families: { standard: (slide) => <StandardSlide slide={slide} /> },
  summary: { standard: (slide) => <StandardSlide slide={slide} /> },
}

export function SlideRenderer({ slide, revealIndex, slideNumber, totalSlides }: SlideRendererProps) {
  const runtimeLayout = slide.layout as string
  const runtimeVariant = (slide as { variant?: string }).variant ?? 'missing-variant'
  const renderer = slideRenderers[runtimeLayout as SlideLayout]?.[runtimeVariant as SlideVariant]
  const content = renderer
    ? renderer(slide, revealIndex)
    : <UnsupportedSlide layout={runtimeLayout} variant={runtimeVariant} />

  return (
    <article className={`navi-slide navi-slide--${slide.layout}`} aria-roledescription="שקופית">
      <span className="navi-slide__section">{slide.section} · {String(slideNumber).padStart(2, '0')}</span>
      {content}
      <span className="navi-slide__counter" aria-hidden="true">{slideNumber} / {totalSlides}</span>
    </article>
  )
}
