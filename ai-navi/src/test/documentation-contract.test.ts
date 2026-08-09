import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8')

describe('README editing and safety contract', () => {
  it('maps task examples to the file non-developers should edit', () => {
    expect(readme).toContain('`src/data/tasks.ts`')
    expect(readme).toMatch(/tasks\.ts`[^\n]*(דוגמאות|משימות)[^\n]*(לערוך|לעדכן)/)
  })

  it('states the legal and information-security boundary in Hebrew', () => {
    expect(readme).toMatch(/אינו (?:מהווה )?ייעוץ משפטי/)
    expect(readme).toMatch(/אינו (?:מהווה )?ייעוץ (?:ב)?אבטחת מידע/)
    expect(readme).toMatch(/מדיניות הארגון (?:היא הקובעת|קובעת)/)
  })

  it('instructs editors to use cautious language without guarantees', () => {
    expect(readme).toMatch(/ניסוח זהיר/)
    expect(readme).toMatch(/אין להבטיח|ללא הבטחה|אינו מבטיח/)
  })
})
