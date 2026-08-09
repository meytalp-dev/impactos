import type { ReactNode } from 'react'
import type {
  SlideDefinition,
  SlideLayout,
  SlideVariant,
} from '../../lib/presentationTypes'
import { BudgetGame } from './BudgetGame'
import { ChoiceGame } from './ChoiceGame'
import { FamilyMap } from './FamilyMap'

type SlideRendererProps = {
  slide: SlideDefinition
  revealIndex: number
  slideNumber: number
  totalSlides: number
  resetToken?: number
}

type VisualSlide<Kind extends string> = Extract<
  SlideDefinition,
  { visual: { kind: Kind } }
>

const mistakeDetails = [
  'בוחרים לפי מה שמדברים עליו עכשיו',
  'מכריחים כל משימה להתאים להרגל',
  'פותחים אפליקציה לפני שמגדירים הצלחה',
]

function SlideHeading({ slide }: { slide: SlideDefinition }) {
  return (
    <div className="navi-slide-heading">
      {slide.eyebrow && <p className="navi-slide__eyebrow">{slide.eyebrow}</p>}
      <h2>{slide.title}</h2>
      {slide.body && <p className="navi-slide-heading__body">{slide.body}</p>}
    </div>
  )
}

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

function CoverSlide({ slide }: { slide: VisualSlide<'route-map'> }) {
  return (
    <div className="navi-slide-layout navi-slide-layout--mobile-stack navi-slide-cover" data-mobile-layout="stack">
      <div className="navi-slide-cover__copy">
        <p className="navi-slide__eyebrow">{slide.eyebrow}</p>
        <h2>{slide.title}</h2>
        <p className="navi-slide-cover__subtitle">{slide.body}</p>
      </div>
      <div className="navi-slide-cover__map" aria-label="מסלולים לקטגוריות עבודה">
        <span className="navi-slide-cover__hub">N</span>
        {slide.visual.routes.map((route, index) => (
          <span className={`navi-slide-cover__route navi-slide-cover__route--${index + 1}`} key={route}>
            <i aria-hidden="true" />
            <b>{route}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

function ToolOverloadSlide({ slide, revealIndex }: { slide: VisualSlide<'tool-overload'>; revealIndex: number }) {
  return (
    <div className="navi-slide-layout navi-slide-layout--mobile-stack navi-slide-overload" data-mobile-layout="stack">
      <div className="navi-slide-overload__copy">
        <p className="navi-slide__eyebrow">{slide.eyebrow}</p>
        <h2>{slide.title}</h2>
        <p>{slide.interactionPrompt}</p>
      </div>
      <div className="navi-slide-overload__cards" aria-label="עומס כלי בינה מלאכותית">
        {slide.visual.tools.map((tool, index) => {
          const disappearAt = 3 - (index % 3)
          const hidden = revealIndex >= disappearAt
          return <span key={tool} className={hidden ? 'is-hidden' : ''} aria-hidden={hidden}>{tool}</span>
        })}
      </div>
    </div>
  )
}

function ProblemSlide({ slide }: { slide: Extract<SlideDefinition, { variant: 'problem' }> }) {
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

function ComparisonSlide({ slide }: { slide: VisualSlide<'route-comparison'> }) {
  return (
    <div className="navi-slide-layout navi-slide-layout--mobile-stack navi-slide-comparison" data-mobile-layout="stack">
      <p className="navi-slide__eyebrow">{slide.eyebrow}</p>
      <h2>{slide.title}</h2>
      <div className="navi-slide-comparison__routes">
        <RouteSequence label="WAZE" items={slide.visual.waze} tone="blue" />
        <RouteSequence label="AI NAVI" items={slide.visual.aiNavi} tone="peach" />
      </div>
      <p className="navi-slide-comparison__message">{slide.body}</p>
    </div>
  )
}

function JunctionMapSlide({ slide }: { slide: Extract<SlideDefinition, { variant: 'junction-map' }> }) {
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

function OptionCloudSlide({ slide }: { slide: VisualSlide<'option-cloud'> }) {
  return (
    <div className="navi-slide-layout navi-slide-layout--mobile-stack navi-slide-options" data-mobile-layout="stack">
      <SlideHeading slide={slide} />
      <div className="navi-slide-options__content">
        {slide.visual.instruction && <strong className="navi-slide-options__instruction">{slide.visual.instruction}</strong>}
        <ul aria-label="ענן אפשרויות">
          {slide.visual.items.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              {item.meta && <small>{item.meta}</small>}
            </li>
          ))}
        </ul>
        {slide.visual.example && <p className="navi-slide-options__example">{slide.visual.example}</p>}
        {slide.visual.message && <p className="navi-slide-options__message">{slide.visual.message}</p>}
      </div>
    </div>
  )
}

function RoleModesSlide({ slide }: { slide: VisualSlide<'role-modes'> }) {
  const accessibleLabel = slide.variant === 'route-kinds' ? 'סוגי מסלולים' : 'מצבי מעורבות'
  return (
    <div className="navi-slide-layout navi-slide-layout--mobile-stack navi-slide-modes" data-mobile-layout="stack">
      <SlideHeading slide={slide} />
      <ol className="navi-slide-modes__list" aria-label={accessibleLabel}>
        {slide.visual.items.map((item, index) => (
          <li key={item.label}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{item.label}</strong>
            <p>{item.detail}</p>
          </li>
        ))}
      </ol>
      {slide.visual.message && <p className="navi-slide-modes__message">{slide.visual.message}</p>}
    </div>
  )
}

function RoutePlanSlide({ slide }: { slide: VisualSlide<'route-plan'> }) {
  return (
    <div className="navi-slide-layout navi-slide-layout--mobile-stack navi-slide-plan" data-mobile-layout="stack">
      <SlideHeading slide={slide} />
      <ol className="navi-slide-plan__route" aria-label="מסלול עבודה">
        {slide.visual.steps.map((step, index) => (
          <li key={`${step.label}-${index}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{step.label}</strong>
            {step.detail && <small>{step.detail}</small>}
            {index < slide.visual.steps.length - 1 && <i aria-hidden="true">←</i>}
          </li>
        ))}
      </ol>
      {slide.visual.outcome && <p className="navi-slide-plan__outcome">{slide.visual.outcome}</p>}
      {slide.visual.tradeoff && <p className="navi-slide-plan__tradeoff">{slide.visual.tradeoff}</p>}
    </div>
  )
}

function ActivitySlide({ slide, resetToken }: {
  slide: Extract<SlideDefinition, { layout: 'activity' }>
  resetToken: number
}) {
  return (
    <div className="navi-slide-layout navi-slide-layout--mobile-stack navi-slide-game" data-mobile-layout="stack" data-interaction={slide.interaction}>
      <SlideHeading slide={slide} />
      {slide.visual.kind === 'budget-game'
        ? <BudgetGame data={slide.visual} resetToken={resetToken} />
        : <ChoiceGame data={slide.visual} resetToken={resetToken} />}
    </div>
  )
}

function FamilyMapSlide({ slide, resetToken }: { slide: VisualSlide<'family-map'>; resetToken: number }) {
  return (
    <div className="navi-slide-layout navi-slide-layout--mobile-stack navi-slide-families" data-mobile-layout="stack">
      <SlideHeading slide={slide} />
      <FamilyMap data={slide.visual} resetToken={resetToken} />
    </div>
  )
}

function FamilyGroupSlide({ slide }: { slide: VisualSlide<'family-map'> }) {
  return (
    <div className="navi-slide-layout navi-slide-layout--mobile-stack navi-slide-families" data-mobile-layout="stack">
      <SlideHeading slide={slide} />
      <ol className="navi-slide-families__map" aria-label="מפת משפחות כלים">
        {slide.visual.families.map((family, index) => (
          <li className={`navi-slide-families__station navi-slide-families__station--${family.line}`} key={family.name}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{family.name}</strong>
            <small>{family.use}</small>
          </li>
        ))}
      </ol>
      {slide.visual.message && <p className="navi-slide-families__message">{slide.visual.message}</p>}
    </div>
  )
}

function NavigatorSlide({ slide }: { slide: VisualSlide<'navigator'> }) {
  return (
    <div className="navi-slide-layout navi-slide-layout--mobile-stack navi-slide-navigator" data-mobile-layout="stack">
      <SlideHeading slide={slide} />
      <ol className="navi-slide-navigator__questions" aria-label="שאלות הניווט">
        {slide.visual.questions.map((question, index) => (
          <li key={question}><span>{index + 1}</span><strong>{question}</strong></li>
        ))}
      </ol>
      <ul className="navi-slide-navigator__examples" aria-label="דוגמאות לקהלים">
        {slide.visual.examples.map((example) => (
          <li key={example.audience}><strong>{example.audience}</strong><span>{example.task}</span></li>
        ))}
      </ul>
      <a className="navi-slide-navigator__action" href={slide.visual.href}>{slide.visual.action}</a>
    </div>
  )
}

function TakeawaysSlide({ slide }: { slide: VisualSlide<'takeaways'> }) {
  return (
    <div className="navi-slide-layout navi-slide-layout--mobile-stack navi-slide-takeaways" data-mobile-layout="stack">
      <SlideHeading slide={slide} />
      <div className="navi-slide-takeaways__phrases">
        {slide.visual.keyPhrases.map((phrase) => <strong key={phrase}>{phrase}</strong>)}
      </div>
      <ol className="navi-slide-takeaways__list">
        {slide.visual.takeaways.map((takeaway, index) => (
          <li key={takeaway}><span>{index + 1}</span>{takeaway}</li>
        ))}
      </ol>
      <a className="navi-slide-takeaways__cta" href={slide.visual.href}>{slide.visual.cta}</a>
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

type SlideContentRenderer = (slide: SlideDefinition, revealIndex: number, resetToken: number) => ReactNode

function typedRenderer<Slide extends SlideDefinition>(
  render: (slide: Slide, revealIndex: number, resetToken: number) => ReactNode,
): SlideContentRenderer {
  return (slide, revealIndex, resetToken) => render(slide as Slide, revealIndex, resetToken)
}

const slideRenderers: Record<SlideLayout, Partial<Record<SlideVariant, SlideContentRenderer>>> = {
  cover: {
    'route-map': typedRenderer<VisualSlide<'route-map'>>((slide) => <CoverSlide slide={slide} />),
  },
  statement: {
    'tool-overload': typedRenderer<VisualSlide<'tool-overload'>>((slide, revealIndex) => <ToolOverloadSlide slide={slide} revealIndex={revealIndex} />),
    problem: typedRenderer<Extract<SlideDefinition, { variant: 'problem' }>>((slide) => <ProblemSlide slide={slide} />),
  },
  comparison: {
    'route-comparison': typedRenderer<VisualSlide<'route-comparison'>>((slide) => <ComparisonSlide slide={slide} />),
    'role-modes': typedRenderer<VisualSlide<'role-modes'>>((slide) => <RoleModesSlide slide={slide} />),
    'route-kinds': typedRenderer<VisualSlide<'role-modes'>>((slide) => <RoleModesSlide slide={slide} />),
  },
  map: {
    'junction-map': typedRenderer<Extract<SlideDefinition, { variant: 'junction-map' }>>((slide) => <JunctionMapSlide slide={slide} />),
    'option-cloud': typedRenderer<VisualSlide<'option-cloud'>>((slide) => <OptionCloudSlide slide={slide} />),
  },
  activity: {
    'choice-grid': typedRenderer<Extract<SlideDefinition, { layout: 'activity' }>>((slide, _revealIndex, resetToken) => (
      <ActivitySlide slide={slide} resetToken={resetToken} />
    )),
  },
  demo: {
    'route-plan': typedRenderer<VisualSlide<'route-plan'>>((slide) => <RoutePlanSlide slide={slide} />),
  },
  families: {
    'family-map': typedRenderer<VisualSlide<'family-map'>>((slide, _revealIndex, resetToken) => <FamilyMapSlide slide={slide} resetToken={resetToken} />),
    'family-group': typedRenderer<VisualSlide<'family-map'>>((slide) => <FamilyGroupSlide slide={slide} />),
  },
  summary: {
    navigator: typedRenderer<VisualSlide<'navigator'>>((slide) => <NavigatorSlide slide={slide} />),
    takeaways: typedRenderer<VisualSlide<'takeaways'>>((slide) => <TakeawaysSlide slide={slide} />),
  },
}

export function SlideRenderer({ slide, revealIndex, slideNumber, totalSlides, resetToken = 0 }: SlideRendererProps) {
  const runtimeLayout = slide.layout as string
  const runtimeVariant = (slide as { variant?: string }).variant ?? 'missing-variant'
  const renderer = slideRenderers[runtimeLayout as SlideLayout]?.[runtimeVariant as SlideVariant]
  const content = renderer
    ? renderer(slide, revealIndex, resetToken)
    : <UnsupportedSlide layout={runtimeLayout} variant={runtimeVariant} />

  return (
    <article className={`navi-slide navi-slide--${slide.layout}`} aria-roledescription="שקופית">
      <span className="navi-slide__section">{slide.section} · {String(slideNumber).padStart(2, '0')}</span>
      {content}
      <span className="navi-slide__counter" aria-hidden="true">{slideNumber} / {totalSlides}</span>
    </article>
  )
}
