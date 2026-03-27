/**
 * Cognitive Performance Report - Data mapping and scoring utilities
 * Normalizes scores to 0-100, maps tests to domains, generates safe language
 * NO diagnostic claims - patterns and trends only
 */

// Test type → cognitive domain mapping
export const TEST_TO_DOMAIN = {
  'n-back': 'memory',
  'memory-match': 'memory',
  'delayed-recall': 'memory',
  'digit-span': 'memory',
  'stroop': 'attention',
  'flanker-task': 'attention',
  'go-no-go': 'attention',
  'visual-search': 'attention',
  'reaction-time': 'processing_speed',
  'symbol-digit': 'processing_speed',
  'trail-making': 'executive_function',
  'dual-task': 'executive_function',
  'verbal-fluency': 'fluency',
  'clock-drawing': 'executive_function',
  'quick-check': 'attention'
};

export const DOMAIN_LABELS = {
  memory: 'Memory',
  attention: 'Attention',
  processing_speed: 'Processing Speed',
  speed: 'Processing Speed',
  executive_function: 'Executive Function',
  verbal_fluency: 'Fluency',
  fluency: 'Fluency'
};

export const TEST_DISPLAY_NAMES = {
  'quick-check': 'Quick Cognitive Check',
  'n-back': 'N-Back',
  'stroop': 'Stroop',
  'trail-making': 'Trail Making',
  'reaction-time': 'Reaction Time',
  'memory-match': 'Memory Match',
  'verbal-fluency': 'Verbal Fluency',
  'flanker-task': 'Flanker',
  'go-no-go': 'Go/No-Go',
  'digit-span': 'Digit Span',
  'symbol-digit': 'Symbol-Digit',
  'visual-search': 'Visual Search',
  'dual-task': 'Dual Task',
  'clock-drawing': 'Clock Drawing',
  'delayed-recall': 'Delayed Recall',
  'speech': 'Speech',
  'facial': 'Facial'
};

/**
 * Normalize a raw metric (0-1) to 0-100 scale
 */
export function toScore100(value) {
  if (value == null || typeof value !== 'number') return null;
  return Math.round(Math.min(100, Math.max(0, value * 100)));
}

/**
 * Extract normalized score from a test result
 * Handles accuracy (0-1), score (raw), reaction_time (inverse)
 */
export function getTestScore(tr) {
  if (!tr) return null;
  if (tr.accuracy != null) return toScore100(tr.accuracy);
  if (tr.score != null) {
    // Normalize raw scores - assume 0-1 or 0-100
    const s = typeof tr.score === 'number' ? tr.score : 0;
    return s <= 1 ? toScore100(s) : Math.min(100, Math.round(s));
  }
  // Reaction time: lower is better - use inverse (e.g. 300ms = fast → high score)
  if (tr.avg_reaction_time != null || tr.reaction_time != null) {
    const rt = tr.avg_reaction_time ?? tr.reaction_time;
    const ms = typeof rt === 'number' ? (rt > 10 ? rt : rt * 1000) : 500;
    // 200ms = 100, 1000ms = 20, 2000ms = 10
    const inverse = Math.max(0, 100 - (ms - 200) / 20);
    return Math.round(Math.min(100, Math.max(0, inverse)));
  }
  return null;
}

/**
 * Build aggregate domain scores from history (0-100 scale)
 */
export function buildDomainScores(history, aggregateMetrics) {
  const domains = {
    memory: null,
    attention: null,
    processing_speed: null,
    executive_function: null,
    fluency: null
  };

  // Prefer backend aggregate_metrics if available
  if (aggregateMetrics && typeof aggregateMetrics === 'object') {
    const map = {
      memory: 'memory',
      attention: 'attention',
      speed: 'processing_speed',
      processing_speed: 'processing_speed',
      executive_function: 'executive_function',
      verbal_fluency: 'fluency'
    };
    for (const [key, val] of Object.entries(aggregateMetrics)) {
      const domain = map[key];
      if (domain && val != null) {
        domains[domain] = toScore100(val);
      }
    }
  }

  // Fill gaps from test results
  if (history && Array.isArray(history)) {
    const byDomain = {};
    for (const entry of history) {
      const tr = entry.test_results || {};
      const type = tr.test_type;
      const domain = TEST_TO_DOMAIN[type] || (tr.metrics ? null : null);
      if (!domain) continue;
      const score = getTestScore(tr) ?? (entry.metrics ? toScore100(entry.metrics[domain] ?? entry.metrics.attention ?? entry.metrics.memory) : null);
      if (score != null) {
        if (!byDomain[domain]) byDomain[domain] = [];
        byDomain[domain].push(score);
      }
    }
    for (const [domain, scores] of Object.entries(byDomain)) {
      if (scores.length > 0 && (domains[domain] == null || domains[domain] === 0)) {
        domains[domain] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }
    }
  }

  return domains;
}

/**
 * Build session-over-time data for line chart
 */
export function buildTrendData(history, aggregateMetrics) {
  if (!history || history.length === 0) return [];
  const valid = history.filter(e => e.metrics && typeof e.metrics === 'object');
  if (valid.length === 0) return [];

  return valid.map((entry, i) => {
    const m = entry.metrics;
    const memory = toScore100(m.memory) ?? 50;
    const attention = toScore100(m.attention) ?? 50;
    const speed = toScore100(m.speed ?? m.processing_speed) ?? 50;
    const exec = toScore100(m.executive_function) ?? 50;
    const fluency = toScore100(m.verbal_fluency) ?? 50;
    const composite = Math.round((memory + attention + speed + exec + fluency) / 5);
    const date = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `Session ${i + 1}`;
    return {
      session: i + 1,
      label: date,
      composite,
      memory,
      attention,
      speed,
      executive: exec,
      fluency
    };
  });
}

/**
 * Build bar chart data: accuracy per test type
 */
export function buildAccuracyByTest(history) {
  if (!history || history.length === 0) return [];
  const byType = {};
  for (const entry of history) {
    const tr = entry.test_results || {};
    const type = tr.test_type || 'unknown';
    if (type === 'speech' || type === 'facial') continue; // Skip non-numeric
    const score = getTestScore(tr);
    if (score != null) {
      if (!byType[type]) byType[type] = [];
      byType[type].push(score);
    }
  }
  return Object.entries(byType).map(([type, scores]) => ({
    test: TEST_DISPLAY_NAMES[type] || type,
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    count: scores.length
  })).sort((a, b) => b.score - a.score);
}

/**
 * Build radar chart data (Recharts format)
 */
export function buildRadarData(domainScores) {
  const labels = {
    memory: 'Memory',
    attention: 'Attention',
    processing_speed: 'Speed',
    executive_function: 'Executive',
    fluency: 'Fluency'
  };
  return Object.entries(labels).map(([key, label]) => ({
    category: label,
    value: domainScores[key] ?? 50,
    fullMark: 100
  }));
}

/**
 * Generate summary text - calm, non-diagnostic
 */
export function generateSummary(history, trends, domainScores) {
  const count = history?.length ?? 0;
  if (count === 0) return 'Complete cognitive tests to build your personalized report and track patterns over time.';
  const avg = Object.values(domainScores).filter(Boolean).reduce((a, b) => a + b, 0) / 5 || 50;
  const improving = trends ? Object.values(trends).filter(t => t === 'improving').length : 0;
  const stable = trends ? Object.values(trends).filter(t => t === 'stable').length : 0;
  if (improving >= 2) return `Your cognitive performance has shown steady improvement over time across ${count} sessions. Continue regular practice to maintain these patterns.`;
  if (stable >= 2) return `Your cognitive performance patterns have remained consistent over ${count} sessions. Regular practice helps maintain consistency.`;
  return `Based on ${count} test sessions, your performance patterns are taking shape. More sessions will help refine your insights.`;
}

/**
 * Generate insights - safe language only
 */
export function generateInsights(domainScores, trends, backendInsights) {
  const items = [];
  const safe = (msg) => msg; // Already vetted

  if (backendInsights && Array.isArray(backendInsights)) {
    for (const i of backendInsights) {
      let text = i.message || i.recommendation;
      if (!text) continue;
      // Soften language
      text = text.replace(/\bdecline\s+detected\b/gi, 'changes observed');
      text = text.replace(/\bdisorder\b/gi, 'patterns');
      text = text.replace(/\byou have\b/gi, 'patterns may indicate');
      items.push({ type: i.type || 'neutral', text: safe(text) });
    }
  }

  // Fallback insights from data
  if (items.length === 0 && domainScores) {
    const speed = domainScores.processing_speed ?? domainScores.speed;
    if (speed != null && speed >= 70) items.push({ type: 'positive', text: 'Reaction speed patterns suggest consistent processing with practice.' });
    const mem = domainScores.memory;
    if (mem != null && mem >= 70) items.push({ type: 'positive', text: 'Memory-related performance has been steady across sessions.' });
    const att = domainScores.attention;
    if (att != null && att < 50) items.push({ type: 'neutral', text: 'Attention performance varies during different sessions. More tests can clarify patterns.' });
  }

  return items.length > 0 ? items : [{ type: 'neutral', text: 'Continue taking tests to uncover personalized insights.' }];
}

/**
 * Generate suggestions - actionable, non-medical
 */
export function generateSuggestions(domainScores, trends) {
  const items = [];
  if (domainScores?.attention != null && domainScores.attention < 60) {
    items.push('Try attention-based tasks more frequently to build consistency.');
  }
  if (domainScores?.memory != null && domainScores.memory < 60) {
    items.push('Memory-focused exercises like N-Back or Memory Match may help reinforce patterns.');
  }
  items.push('Continue regular sessions for better consistency over time.');
  return [...new Set(items)].slice(0, 4);
}
