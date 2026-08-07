import { describe, expect, it } from 'vitest'
import { toolFamilies } from '../data/families'
import { preparedRoutes } from '../data/routes'
import { taskExamples } from '../data/tasks'
import { aiTools } from '../data/tools'

describe('AI NAVI catalog integrity', () => {
  it('provides nine unique tool families', () => {
    expect(toolFamilies).toHaveLength(9)
    expect(new Set(toolFamilies.map((family) => family.id)).size).toBe(9)
  })

  it('provides at least twelve unique prepared routes', () => {
    expect(preparedRoutes.length).toBeGreaterThanOrEqual(12)
    expect(new Set(preparedRoutes.map((route) => route.id)).size).toBe(preparedRoutes.length)
  })

  it('catalogs at least twenty-four tools in known families with ISO review dates', () => {
    const familyIds = new Set(toolFamilies.map((family) => family.id))

    expect(aiTools.length).toBeGreaterThanOrEqual(24)
    for (const tool of aiTools) {
      expect(familyIds.has(tool.familyId)).toBe(true)
      expect(tool.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(`${tool.lastReviewed}T00:00:00Z`))).toBe(false)
      expect(tool).not.toHaveProperty('price')
      expect(tool).not.toHaveProperty('exactPrice')
    }
  })

  it('keeps every prepared route complete, ordered, and linked to catalog tools', () => {
    const toolIds = new Set(aiTools.map((tool) => tool.id))

    for (const route of preparedRoutes) {
      expect(route.steps.length).toBeGreaterThan(0)
      expect(route.warning.trim()).not.toBe('')
      expect(route.finalOutput.trim()).not.toBe('')
      expect(route.starterPrompt.trim()).not.toBe('')

      route.steps.forEach((step, index) => {
        expect(step.order).toBe(index + 1)
        expect(step.role.trim()).not.toBe('')
        expect(step.primaryToolIds.length).toBeGreaterThan(0)
        for (const toolId of [...step.primaryToolIds, ...step.alternativeToolIds]) {
          expect(toolIds.has(toolId)).toBe(true)
        }
      })
    }
  })

  it('offers examples for education, management, entrepreneurship, marketing, and general use', () => {
    expect(new Set(taskExamples.map((example) => example.context))).toEqual(
      new Set(['education', 'management', 'entrepreneurship', 'marketing', 'general']),
    )
  })
})
