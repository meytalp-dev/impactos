// ============================================================
// activities/trace-path.js — מעקב על מסלול האות
// "עקוב/י על האות עם האצבע"
//
// פדגוגיה: primary_island_id=19 (כתב יד), secondary=[3]
// Lenient — אין כישלון על סטייה. coverage ≥ 0.6 = הצלחה.
//
// תלוי בנתוני path מ-data/island-03-trace-paths.json.
// אם אין path data תקפים (status: awaiting_gpt_paths) — הפעילות מדלגת על עצמה.
// ============================================================

window.AvneiTracePath = (function() {

  const ACTIVITY_TYPE = 'tracePath';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  let _root = null;
  let _letter = null;
  let _letterData = null;
  let _strokes = [];
  let _currentStrokeIdx = 0;
  let _supportLevel = 1;
  let _strokeStartTime = 0;
  let _attempts = 0;
  let _hintUsed = false;
  let _autoHintTriggered = false;
  let _noniGuidanceUsed = false;
  let _onItemComplete = null;
  let _onActivityComplete = null;
  let _svg = null;
  let _activePath = null;
  let _tracePoints = [];
  let _drawing = false;
  let _autoHintTimer = null;

  // ===== Mount =====
  function mount(rootEl, opts) {
    _root = rootEl;
    _letter = opts.letter;
    _supportLevel = opts.supportLevel || 1;
    _onItemComplete = opts.onItemComplete || (() => {});
    _onActivityComplete = opts.onActivityComplete || (() => {});

    const item = (opts.items || [])[0];
    if (!isItemValid(item)) {
      console.warn('trace-path: skipping — no valid paths for letter', _letter);
      _onActivityComplete({ skipped: true, reason: 'no_paths', totalItems: 0, correctCount: 0 });
      return;
    }

    _letterData = item;
    _strokes = item.strokes;
    _currentStrokeIdx = 0;

    _root.innerHTML = '';
    AvneiInstruction.mount(_root, {
      text: 'עקוב/י על האות עם האצבע',
      onAudio: () => {
        _hintUsed = true;
        AvneiAudio.playLetterName(_letter);
      },
    });

    buildStage();
    AvneiNoni.setState('idle');
    startStroke(0);
  }

  function isItemValid(item) {
    if (!item || !Array.isArray(item.strokes) || item.strokes.length === 0) return false;
    return item.strokes.every(s =>
      typeof s.path_d === 'string' &&
      s.path_d.trim().length > 0 &&
      !s.path_d.includes('TBD')
    );
  }

  // ===== Unmount =====
  function unmount() {
    if (_autoHintTimer) { clearTimeout(_autoHintTimer); _autoHintTimer = null; }
    if (window.AvneiInstruction) AvneiInstruction.unmount();
    if (_root) _root.innerHTML = '';
    _root = null;
  }

  // ===== Stage build =====
  function buildStage() {
    const stage = document.createElement('section');
    stage.className = 'tp-stage';
    stage.innerHTML = `
      <div class="tp-canvas-wrap">
        <svg class="tp-canvas" viewBox="${_letterData.viewBox || '0 0 200 200'}"
             xmlns="${SVG_NS}" preserveAspectRatio="xMidYMid meet"></svg>
      </div>
      <div class="tp-progress" id="tpProgress"></div>
    `;
    _root.appendChild(stage);
    _svg = stage.querySelector('.tp-canvas');

    drawGuides();
    drawAllTemplates();
    renderStrokeProgress();
  }

  function drawGuides() {
    const gl = _letterData.guide_lines || {};
    if (typeof gl.top_baseline_y === 'number') {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', 10);  line.setAttribute('x2', 190);
      line.setAttribute('y1', gl.top_baseline_y); line.setAttribute('y2', gl.top_baseline_y);
      line.setAttribute('stroke', '#A8C4E0');
      line.setAttribute('stroke-width', '0.8');
      line.setAttribute('stroke-dasharray', '3 3');
      _svg.appendChild(line);
    }
    if (typeof gl.bottom_baseline_y === 'number') {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', 10);  line.setAttribute('x2', 190);
      line.setAttribute('y1', gl.bottom_baseline_y); line.setAttribute('y2', gl.bottom_baseline_y);
      line.setAttribute('stroke', '#A8C4E0');
      line.setAttribute('stroke-width', '0.8');
      line.setAttribute('stroke-dasharray', '3 3');
      _svg.appendChild(line);
    }
  }

  function drawAllTemplates() {
    const vd = _letterData.visual_design || {};
    _strokes.forEach(s => {
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', s.path_d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', vd.template_color || '#3D2E5C');
      p.setAttribute('stroke-width', '3.5');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      p.setAttribute('stroke-dasharray', '4 3');
      p.setAttribute('opacity', String(vd.template_opacity || 0.3));
      p.classList.add('tp-template');
      p.dataset.strokeId = String(s.id);
      _svg.appendChild(p);
    });
  }

  // ===== Stroke flow =====
  function startStroke(idx) {
    if (idx >= _strokes.length) {
      finishActivity();
      return;
    }
    _currentStrokeIdx = idx;
    _strokeStartTime = Date.now();
    _attempts = 0;
    _hintUsed = false;
    _autoHintTriggered = false;
    _noniGuidanceUsed = false;
    _tracePoints = [];
    if (_autoHintTimer) { clearTimeout(_autoHintTimer); _autoHintTimer = null; }

    clearActiveOverlay();
    drawStartMarker(_strokes[idx]);
    renderStrokeProgress();

    setupPointerEvents();

    const cfg = AvneiScaffolding.configFor(_supportLevel, 'trace-path');

    // narration
    if (AvneiAudio.isUnlocked() && _strokes[idx].narration) {
      // ב-MVP אין MP3 לnarrations הספציפיות — נשתמש בשם האות בלבד
      setTimeout(() => AvneiAudio.playLetterName(_letter), cfg.preAudio ? 150 : 400);
    }

    // auto-hint by support level
    if (cfg.autoHintDelayMs !== null) {
      _autoHintTimer = setTimeout(() => triggerAutoHint(), cfg.autoHintDelayMs);
    }
  }

  function renderStrokeProgress() {
    const el = document.getElementById('tpProgress');
    if (!el) return;
    el.innerHTML = '';
    _strokes.forEach((s, i) => {
      const dot = document.createElement('span');
      dot.className = 'tp-progress-dot';
      if (i < _currentStrokeIdx) dot.classList.add('done');
      else if (i === _currentStrokeIdx) dot.classList.add('active');
      el.appendChild(dot);
    });
  }

  // צבע ה-stroke הנוכחי — תומך ב-N צבעים מ-trace_colors[], או fallback
  function getStrokeColor() {
    const vd = _letterData.visual_design || {};
    const palette = Array.isArray(vd.trace_colors) && vd.trace_colors.length > 0
      ? vd.trace_colors
      : ['#E54545', '#F59E0B', '#8B5CF6', '#4A8FE0'];
    return palette[_currentStrokeIdx % palette.length];
  }

  function drawStartMarker(stroke) {
    // remove old marker
    const old = _svg.querySelector('.tp-marker');
    if (old) old.remove();
    if (!stroke.start_point || stroke.start_point.length !== 2) return;

    const vd = _letterData.visual_design || {};
    const g = document.createElementNS(SVG_NS, 'g');
    g.classList.add('tp-marker');

    const color = getStrokeColor();

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', stroke.start_point[0]);
    circle.setAttribute('cy', stroke.start_point[1]);
    circle.setAttribute('r', String(vd.start_marker_radius || 11));
    circle.setAttribute('fill', color);
    g.appendChild(circle);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', stroke.start_point[0]);
    text.setAttribute('y', stroke.start_point[1] + 4);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '13');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', 'white');
    text.setAttribute('font-family', 'Arial');
    text.textContent = String(stroke.id);
    g.appendChild(text);

    // pulse animation
    const animateR = document.createElementNS(SVG_NS, 'animate');
    animateR.setAttribute('attributeName', 'r');
    animateR.setAttribute('values', '11;14;11');
    animateR.setAttribute('dur', '1.5s');
    animateR.setAttribute('repeatCount', 'indefinite');
    circle.appendChild(animateR);

    _svg.appendChild(g);
  }

  function triggerAutoHint() {
    _autoHintTriggered = true;
    AvneiNoni.setState('hint');
    demonstrateStroke();
  }

  // הדגמה — נקודה זוהרת רצה לאורך ה-path
  function demonstrateStroke() {
    const stroke = _strokes[_currentStrokeIdx];
    const tpl = _svg.querySelector(`.tp-template[data-stroke-id="${stroke.id}"]`);
    if (!tpl) return;

    const length = tpl.getTotalLength ? tpl.getTotalLength() : 0;
    if (length === 0) return;

    const color = getStrokeColor();

    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('r', '6');
    dot.setAttribute('fill', color);
    dot.setAttribute('opacity', '0.85');
    dot.classList.add('tp-demo-dot');
    _svg.appendChild(dot);

    const DURATION = 2200;
    const t0 = performance.now();
    function step(now) {
      const t = Math.min(1, (now - t0) / DURATION);
      const pt = tpl.getPointAtLength(length * t);
      dot.setAttribute('cx', pt.x);
      dot.setAttribute('cy', pt.y);
      if (t < 1) requestAnimationFrame(step);
      else setTimeout(() => dot.remove(), 200);
    }
    requestAnimationFrame(step);
  }

  // ===== Pointer events =====
  function setupPointerEvents() {
    if (!_svg) return;
    _svg.onpointerdown = onPointerDown;
    _svg.onpointermove = onPointerMove;
    _svg.onpointerup   = onPointerEnd;
    _svg.onpointercancel = onPointerEnd;
    _svg.onpointerleave  = onPointerEnd;
  }

  function clientToSvgPoint(evt) {
    const pt = _svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = _svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    return pt.matrixTransform(ctm.inverse());
  }

  function onPointerDown(evt) {
    if (_autoHintTimer) { clearTimeout(_autoHintTimer); _autoHintTimer = null; }
    _drawing = true;
    _tracePoints = [];
    clearActiveOverlay();
    const p = clientToSvgPoint(evt);
    addTracePoint(p);
    if (_svg.setPointerCapture) {
      try { _svg.setPointerCapture(evt.pointerId); } catch {}
    }
  }

  function onPointerMove(evt) {
    if (!_drawing) return;
    const p = clientToSvgPoint(evt);
    addTracePoint(p);
  }

  function onPointerEnd(evt) {
    if (!_drawing) return;
    _drawing = false;
    evaluateTrace();
  }

  function addTracePoint(p) {
    _tracePoints.push([p.x, p.y]);
    drawActiveOverlay();
  }

  function clearActiveOverlay() {
    if (_activePath) { _activePath.remove(); _activePath = null; }
  }

  function drawActiveOverlay() {
    if (_tracePoints.length < 2) return;
    const vd = _letterData.visual_design || {};
    const color = getStrokeColor();

    if (!_activePath) {
      _activePath = document.createElementNS(SVG_NS, 'polyline');
      _activePath.setAttribute('fill', 'none');
      _activePath.setAttribute('stroke', color);
      _activePath.setAttribute('stroke-width', String(vd.stroke_width || 14));
      _activePath.setAttribute('stroke-linecap', 'round');
      _activePath.setAttribute('stroke-linejoin', 'round');
      _activePath.setAttribute('opacity', '0.9');
      _activePath.classList.add('tp-active');
      _svg.appendChild(_activePath);
    }
    _activePath.setAttribute('points', _tracePoints.map(p => p[0] + ',' + p[1]).join(' '));
  }

  // ===== Evaluation =====
  function evaluateTrace() {
    const stroke = _strokes[_currentStrokeIdx];
    const samples = stroke.direction_samples || [];
    if (samples.length === 0 || _tracePoints.length < 3) {
      // not enough data — count as miss
      return onStrokeMiss();
    }

    const threshold = (_supportLevel >= 4) ? 0.5 : 0.6;
    const tolerance = (_supportLevel >= 3) ? 35 : 25;

    let covered = 0;
    for (const s of samples) {
      const nearest = nearestDistance(s, _tracePoints);
      if (nearest <= tolerance) covered++;
    }
    const coverage = covered / samples.length;

    // also check stroke direction (start→end order roughly correct)
    const dirOk = checkDirection(stroke);

    if (coverage >= threshold && dirOk) {
      onStrokeSuccess(coverage);
    } else {
      onStrokeMiss(coverage);
    }
  }

  function nearestDistance(point, trace) {
    let best = Infinity;
    for (const t of trace) {
      const d = Math.hypot(t[0] - point[0], t[1] - point[1]);
      if (d < best) best = d;
    }
    return best;
  }

  function checkDirection(stroke) {
    if (!stroke.start_point || !stroke.end_point || _tracePoints.length < 4) return true;
    const first = _tracePoints[0];
    const last  = _tracePoints[_tracePoints.length - 1];
    const dStart = Math.hypot(first[0] - stroke.start_point[0], first[1] - stroke.start_point[1]);
    const dEnd   = Math.hypot(last[0]  - stroke.end_point[0],   last[1]  - stroke.end_point[1]);
    // התחלה צריכה להיות קרובה ל-start, סיום קרוב ל-end
    return dStart < 40 && dEnd < 40;
  }

  // ===== Stroke result =====
  function onStrokeSuccess(coverage) {
    // freeze the active overlay (make it the "done" stroke)
    if (_activePath) {
      _activePath.classList.add('tp-done');
      _activePath.setAttribute('opacity', '1');
    }
    AvneiNoni.setState('cheer');
    AvneiFeedback.show(_currentStrokeIdx === _strokes.length - 1
      ? 'האות מתחילה לזהור'
      : 'יופי! עכשיו המשיכה הבאה');

    if (_attempts === 0) {
      addPearl(1);
      renderPearlCounter();
    }

    // log per-stroke event
    const result = {
      activity_type: ACTIVITY_TYPE,
      activity_variant: 'stroke-' + (_currentStrokeIdx + 1),
      item_id: _letterData.letter_name + '-s' + (_currentStrokeIdx + 1),
      target_letter: _letter,
      supportLevel: _supportLevel,
      is_correct: _attempts === 0,
      attempts: _attempts,
      response_time_ms: Date.now() - _strokeStartTime,
      hint_used: _hintUsed,
      auto_hint_triggered: _autoHintTriggered,
      noni_guidance_used: _noniGuidanceUsed,
    };
    AvneiEventLogger.logActivityResult(result);
    _onItemComplete(result);

    setTimeout(() => startStroke(_currentStrokeIdx + 1), 1500);
  }

  function onStrokeMiss(coverage) {
    _attempts++;
    // remove the failed trace
    clearActiveOverlay();

    if (_attempts === 1) {
      AvneiNoni.setState('help');
      AvneiFeedback.show('בואי נחזור לנקודת ההתחלה');
    } else if (_attempts === 2) {
      AvneiNoni.setState('hint');
      AvneiFeedback.show('נראה את הדרך יחד');
      _hintUsed = true;
      _noniGuidanceUsed = true;
      demonstrateStroke();
    } else if (_attempts >= 3) {
      AvneiNoni.setState('hint');
      AvneiFeedback.show('עוקבים יחד');
      _noniGuidanceUsed = true;
      demonstrateStroke();
      // accept on 4th attempt — lenient
      setTimeout(() => acceptLenient(), 2400);
    }
  }

  function acceptLenient() {
    // mark stroke done by drawing the template path in full color
    const stroke = _strokes[_currentStrokeIdx];
    const vd = _letterData.visual_design || {};
    const color = getStrokeColor();

    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', stroke.path_d);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', color);
    p.setAttribute('stroke-width', String(vd.stroke_width || 14));
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    p.classList.add('tp-done');
    _svg.appendChild(p);

    onStrokeSuccess(0); // log as success after lenient accept
  }

  // ===== Activity end =====
  function finishActivity() {
    _onActivityComplete({
      correctCount: _strokes.length,
      totalItems: _strokes.length,
    });
  }

  return { mount, unmount, ACTIVITY_TYPE };
})();
