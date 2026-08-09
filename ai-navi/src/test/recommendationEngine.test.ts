import { describe, expect, it } from 'vitest'
import { buildPrompt } from '../lib/promptBuilder'
import { recommendRoute } from '../lib/recommendationEngine'
import { scoreTool } from '../lib/scoring'
import type { AITool, NavigatorAnswers } from '../lib/types'

const baseAnswers = (overrides: Partial<NavigatorAnswers> = {}): NavigatorAnswers => ({
  taskType: 'summarize',
  inputType: 'documents',
  outputType: 'presentation',
  context: 'management',
  privacy: 'public',
  difficulty: 'intermediate',
  ...overrides,
})

describe('recommendRoute', () => {
  it('selects the document-to-presentation route with unique safe tools', () => {
    const result = recommendRoute(baseAnswers())

    expect(result.routeId).toBe('document-to-presentation')
    expect(result.toolIds).toHaveLength(2)
    expect(new Set(result.toolIds).size).toBe(result.toolIds.length)
    expect(result.steps).toHaveLength(2)
  })

  it('selects the survey route for management insights', () => {
    expect(recommendRoute(baseAnswers({ taskType: 'analyze', inputType: 'data', outputType: 'report' })).routeId)
      .toBe('survey-to-insights')
  })

  it('selects the current-sources route for current research', () => {
    expect(recommendRoute(baseAnswers({ taskType: 'research', inputType: 'web-links', outputType: 'report' })).routeId)
      .toBe('current-information-with-sources')
  })

  it('selects the app-prototype route for an app idea', () => {
    expect(recommendRoute(baseAnswers({ taskType: 'build', inputType: 'idea', outputType: 'app', context: 'entrepreneurship' })).routeId)
      .toBe('idea-to-app')
  })

  it('never lets task-text route hints overtake a higher task/input/output overlap', () => {
    const result = recommendRoute(baseAnswers({
      taskType: 'present',
      inputType: 'data',
      outputType: 'automation',
      taskText: 'הכינו סקר להנהלה',
    }))

    expect(result.routeId).toBe('data-to-management-report')
  })

  it('builds generic stages from ranked catalog tools instead of a hard-coded ChatGPT first stage', () => {
    const result = recommendRoute({})

    expect(result.routeId).toBe('generic')
    expect(result.steps[0].primaryToolId).toBe('adobe-firefly')
    expect(result.steps[0].primaryToolId).not.toBe('chatgpt')
  })

  it('provides distinct usable fast, professional and budget alternatives', () => {
    const result = recommendRoute(baseAnswers())
    const alternativeIds = Object.values(result.alternatives).flat()

    expect(result.alternatives.fast).not.toEqual(result.toolIds)
    expect(result.alternatives.professional).not.toEqual(result.toolIds)
    expect(result.alternatives.budget).not.toEqual(result.toolIds)
    expect(result.alternatives.fast.length).toBeGreaterThan(0)
    expect(result.alternatives.professional.length).toBeGreaterThan(0)
    expect(result.alternatives.budget.length).toBeGreaterThan(0)
    expect(new Set(alternativeIds).size).toBe(alternativeIds.length)
    expect(alternativeIds).not.toEqual(expect.arrayContaining(result.toolIds))
  })

  it.each([
    ['prepared', baseAnswers()],
    ['generic', {}],
  ] as const)('returns two to four unique permitted tools and globally unique alternatives for %s routes', (_kind, answers) => {
    const result = recommendRoute(answers)
    const alternativeIds = Object.values(result.alternatives).flat()

    expect(result.toolIds.length).toBeGreaterThanOrEqual(2)
    expect(result.toolIds.length).toBeLessThanOrEqual(4)
    expect(new Set(result.toolIds).size).toBe(result.toolIds.length)
    expect(new Set(alternativeIds).size).toBe(alternativeIds.length)
    expect(alternativeIds.some((id) => result.toolIds.includes(id))).toBe(false)
  })

  it('ranks beginner and general tools ahead for a beginner with little time', () => {
    const answers = baseAnswers({ difficulty: 'beginner', priority: 'speed', timeAvailable: 'under-10-minutes' })
    const beginner = scoreTool({ ...tool('beginner-tool'), difficulty: 'beginner' }, answers, 'writer')
    const advanced = scoreTool({ ...tool('advanced-tool'), difficulty: 'advanced' }, answers, 'writer')

    expect(beginner.total).toBeGreaterThan(advanced.total)
  })

  it('filters caution tools and warns when data is sensitive or uncertain', () => {
    const result = recommendRoute(baseAnswers({ privacy: 'sensitive' }))

    expect(result.toolIds).not.toContain('excel-copilot')
    expect(result.warnings.join(' ')).toMatch(/פרט|ארגון/i)
  })

  it('treats maybe as sensitive and suppresses public caution tools', () => {
    const result = recommendRoute(baseAnswers({ privacy: 'maybe' }))

    expect(result.toolIds).not.toContain('excel-copilot')
    expect(result.warnings.join(' ')).toMatch(/פרט|ארגון/i)
  })

  it('uses every multi-selected task and input independently of selection order', () => {
    const first = recommendRoute(baseAnswers({
      taskTypes: ['write', 'present'], taskType: 'write',
      inputTypes: ['idea', 'documents'], inputType: 'idea',
    }))
    const reversed = recommendRoute(baseAnswers({
      taskTypes: ['present', 'write'], taskType: 'present',
      inputTypes: ['documents', 'idea'], inputType: 'documents',
    }))

    expect(first.routeId).toBe('document-to-presentation')
    expect(reversed.routeId).toBe(first.routeId)
    expect(reversed.toolIds).toEqual(first.toolIds)
  })

  it('scores matches found in secondary multi-select values', () => {
    const answers = baseAnswers({
      taskTypes: ['research', 'write'], taskType: 'research',
      inputTypes: ['web-links', 'text'], inputType: 'web-links',
    })

    const secondaryMatch: AITool = { ...tool('secondary-match'), taskTypes: ['write'], inputTypes: ['text'] }
    const noMatch: AITool = { ...tool('no-match'), taskTypes: ['create-image'], inputTypes: ['image'], tags: ['image'] }

    expect(scoreTool(secondaryMatch, answers, 'writer').total)
      .toBeGreaterThan(scoreTool(noMatch, answers, 'writer').total)
  })

  it('uses the tool ID as a stable tie breaker', () => {
    const answers = baseAnswers({ taskType: 'write', inputType: 'text', outputType: 'text' })
    const alpha = scoreTool(tool('alpha'), answers, 'writer')
    const beta = scoreTool(tool('beta'), answers, 'writer')

    expect(alpha.total).toBe(beta.total)
    expect([alpha, beta].sort((left, right) => left.toolId.localeCompare(right.toolId)).map((score) => score.toolId))
      .toEqual(['alpha', 'beta'])
  })

  it('builds a prompt with task, audience, I/O, priorities and applicable checks', () => {
    const answers = baseAnswers({
      taskText: 'סכמו את דוח הרבעון למצגת',
      audience: 'הנהלה בכירה',
      priorities: ['speed', 'quality'],
      privacy: 'sensitive',
    })
    const result = recommendRoute(answers)
    const prompt = buildPrompt(answers, result)

    expect(result.prompt).toContain('סכמו את דוח הרבעון למצגת')
    expect(prompt).toContain('סכמו את דוח הרבעון למצגת')
    expect(prompt).toContain('הנהלה בכירה')
    expect(prompt).toContain('כמה מסמכים')
    expect(prompt).toContain('presentation')
    expect(prompt).toContain('speed')
    expect(prompt).toContain('quality')
    expect(prompt).toMatch(/מקור|פרטיות|איכות/)
  })
})

const tool = (id: string): AITool => ({
  id,
  name: id,
  familyId: 'thinking-conversation',
  description: 'test tool',
  pricingModel: 'free',
  lastReviewed: '2026-08-07',
  caution: 'check output',
  tags: ['write', 'text'],
})
