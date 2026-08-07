import type { SlideDefinition } from '../../lib/presentationTypes'

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
    <div className="navi-slide-cover">
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
    <div className="navi-slide-overload">
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
    <div className="navi-slide-problem">
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
    <div className="navi-slide-comparison">
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
    <div className="navi-slide-junctions">
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

export function SlideRenderer({ slide, revealIndex, slideNumber, totalSlides }: SlideRendererProps) {
  let content
  if (slide.id === 'opening-cover') content = <CoverSlide slide={slide} />
  else if (slide.id === 'tool-overload') content = <ToolOverloadSlide slide={slide} revealIndex={revealIndex} />
  else if (slide.id === 'real-problem') content = <ProblemSlide slide={slide} />
  else if (slide.id === 'waze-metaphor') content = <ComparisonSlide slide={slide} />
  else content = <JunctionMapSlide slide={slide} />

  return (
    <article className={`navi-slide navi-slide--${slide.layout}`} aria-roledescription="שקופית">
      <span className="navi-slide__section">{slide.section} · {String(slideNumber).padStart(2, '0')}</span>
      {content}
      <span className="navi-slide__counter" aria-hidden="true">{slideNumber} / {totalSlides}</span>
    </article>
  )
}
