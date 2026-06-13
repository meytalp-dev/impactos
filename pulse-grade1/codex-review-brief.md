# הנחיה ל-Codex · סקירת קוד לפולס א'-ב'

> **גרסה:** v1 · 13.6.2026 · מיטל פלג / אימפקט.OS
> **איך משתמשים:** מעתיקים את כל מה שמתחת לקו לשיחה עם Codex, ומצרפים את קבצי ה-HTML/CSS לבדיקה (או את הריפו).

---

You are a senior front-end + accessibility + security reviewer. Review a static, dependency-free Hebrew RTL educational web app ("פולס א'-ב'") meant for a school pilot starting 1.9.2026. No build step, no backend yet, no login, no AI/NLP. Everything is plain HTML/CSS/JS. Hebrew UI, RTL throughout.

## What the app is
A bi-weekly social-emotional "pulse" for Grade 1, with 4 audiences, each its own screen:
- **Child (6-7):** `pulse-questionnaire.html` + `pulse-summary.html` — drag an octopus character (Noni) between 3 faces, 4 stations, pre-recorded MP3 audio, fully-niqud Hebrew.
- **Teacher:** `pulse-dashboard.html` (daily dashboard) + `pulse-teacher-form-mockup.html` (8-item rating form).
- **Parent:** `pulse-parent-monthly.html` (5-item monthly + `?mode=micro` single question; `?child=NAME` pre-fill).
- **Principal:** `pulse-principal-dashboard.html` (school-wide widgets).
- **Hubs:** `pulse-live-pilot.html`, `pulse-onboarding-mockup.html`, `pulse-admin-mockup.html`.
- **Shared:** `pulse-core.css` (design tokens + shared components).

## What changed recently (focus your review here)
1. **All buttons were just wired** so nothing is a dead end — navigation, modals/drawers, localStorage toggles, `window.print()` exports, and toast feedback. Verify the wiring is correct, accessible, and has no JS errors or broken links.
2. **A redesign** applied a shared `pulse-core.css` and a "Calm Educational Intelligence" pastel system. Check for CSS regressions, RTL bugs, contrast, and responsive breakage.
3. **Audio** in the child screen is MP3-only (`assets/audio/*.mp3`); any browser Web-Speech/TTS fallback was removed by design — flag if any remains.

## What I need you to check (prioritized)

**🔴 Critical**
- **Dead ends / broken wiring:** every `<button>`, clickable element, and link must do something and resolve. List any `href` to a non-existent file, any handler that throws, any control with no effect.
- **JS correctness:** run a mental (or real) `node --check` on each inline `<script>`. Report syntax errors, undefined references, listeners bound to missing elements, and event bugs.
- **Security (static-app scope):** any use of `innerHTML` with non-constant/user-derived data without escaping (note: an `escapeHtml()` helper exists — verify it's used everywhere dynamic text is injected). `?child=`/`?parent=` query params must be treated as display text only (textContent), never `innerHTML`. Flag any localStorage that stores sensitive free-text.

**🟡 High**
- **Accessibility (WCAG):** keyboard reachability of every interactive control; visible focus; `role`/`tabindex`/`aria-*` correctness on custom controls (drag faces = radiogroup, heat cells, PIN keypad, rating buttons, modals with focus trap + Esc); labels associated via `for`/`id`; never color-only signaling; `aria-live` for toasts. The child drag mechanism must also be operable by keyboard.
- **Mobile/tablet:** the pilot runs on parent-provided tablets. Check `viewport` (must allow zoom — no `maximum-scale`/`user-scalable=no`), touch target sizes (≥44px), `100dvh`/`100vh` fallbacks, `overflow` clipping on short screens, and that drag works with Pointer/touch events.
- **Modals/drawers:** focus management, Esc to close, backdrop click, restoring focus.

**🔵 Quality**
- Duplicated CSS/JS that could move into `pulse-core.css`; inline styles that should be classes; inline `onclick` that should be `addEventListener` (CSP-friendliness for future backend).
- `backdrop-filter`, `conic-gradient`, `aspect-ratio`, `color-mix` — provide fallbacks for older WebViews.
- Note where the future backend will need server-side validation (the parent form submit, child responses) — there are already HTML comments marking this; verify they're accurate.

## Hard constraints — do NOT propose changing these
- Static, dependency-free, no build, no backend, no login, no AI/NLP. (You may *describe* what a future backend needs, but don't add one.)
- 4 dimensions only; child mechanism = drag-3-faces only; MP3-only audio (no browser TTS); Noni = existing PNG octopus (`assets/noni-*.png`), never an SVG fish.
- Hebrew text a child sees must keep full niqud. Don't anglicize UI.

## Output format
For each finding: **file:line — severity — problem → why it matters → concrete fix** (with code where useful). End with the **top 5 must-fix-before-pilot** items ranked by risk. Be specific and blunt; if something is fragile or fake-clickable, say so.
