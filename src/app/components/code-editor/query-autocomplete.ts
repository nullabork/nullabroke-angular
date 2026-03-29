import {
  autocompletion,
  CompletionContext,
  CompletionResult,
  Completion,
  CompletionSection,
} from '@codemirror/autocomplete';
import { Extension } from '@codemirror/state';
import { FilingService } from '../../core/services/filing.service';
import { firstValueFrom } from 'rxjs';

// --- Sections for grouped autocomplete ---

const filingFieldsSection: CompletionSection = { name: 'Filing Fields', rank: 0 };
const sqlKeywordsSection: CompletionSection = { name: 'SQL Keywords', rank: 1 };
const fieldTypesSection: CompletionSection = { name: 'Field Types', rank: 0 };
const modifiersSection: CompletionSection = { name: 'Modifiers', rank: 0 };

// --- Static data ---

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'ILIKE',
  'ORDER BY', 'ORDER', 'BY', 'LIMIT', 'BETWEEN', 'DESC', 'ASC',
  'IS', 'NULL', 'AS', 'LEFT', 'RIGHT', 'JOIN', 'ON', 'INNER', 'OUTER',
  'GROUP BY', 'GROUP', 'HAVING', 'DISTINCT', 'UNION', 'EXCEPT',
  'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'TRUE', 'FALSE',
  'ARRAY', 'CAST',
];

const FIELD_TYPES = [
  { label: 'StringInput', detail: 'Free text input' },
  { label: 'NumberInput', detail: 'Numeric input' },
  { label: 'FormTypes', detail: 'SEC form type dropdown' },
  { label: 'Tags', detail: 'Tag multi-select' },
  { label: 'Favorites', detail: 'Inject favorite IDs' },
];

const MODIFIERS = [
  { label: 'csv', detail: 'Comma-separated values' },
  { label: 'array', detail: 'Parenthesized list for IN operator' },
  { label: 'pgarray', detail: "PostgreSQL array literal: array['a','b']" },
  { label: 'first', detail: 'First item only' },
  { label: 'last', detail: 'Last item only' },
];

// --- API cache ---

let cachedApiResults: Completion[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000; // 30 seconds

async function fetchApiCompletions(
  filingService: FilingService,
  word: string,
): Promise<Completion[]> {
  const now = Date.now();
  if (cachedApiResults && now - cacheTimestamp < CACHE_TTL) {
    return cachedApiResults;
  }

  try {
    const results = await firstValueFrom(filingService.autocomplete(word));
    const completions: Completion[] = results.map((r) => ({
      label: r.word,
      detail: r.description ?? undefined,
      section: filingFieldsSection,
      boost: 1,
    }));

    // Deduplicate by label
    const seen = new Set<string>();
    const unique = completions.filter((c) => {
      if (seen.has(c.label)) return false;
      seen.add(c.label);
      return true;
    });

    cachedApiResults = unique;
    cacheTimestamp = now;
    return unique;
  } catch {
    return cachedApiResults ?? [];
  }
}

// --- Context detection ---

interface BraceContext {
  /** Which segment the cursor is in: 'label' | 'type' | 'default' | 'modifier' */
  segment: 'label' | 'type' | 'default' | 'modifier';
  /** The text typed so far in this segment */
  typed: string;
  /** Start position of the typed text in the document */
  from: number;
}

/**
 * Detect if the cursor is inside {Label:Type:Default|modifier} syntax.
 * Returns context info or null if outside braces.
 */
function getBraceContext(doc: string, pos: number): BraceContext | null {
  // Scan backwards to find the opening brace
  let braceStart = -1;
  for (let i = pos - 1; i >= 0; i--) {
    if (doc[i] === '}') return null; // hit a close brace first → not inside
    if (doc[i] === '{' && (i === 0 || doc[i - 1] !== '\\')) {
      braceStart = i;
      break;
    }
  }
  if (braceStart === -1) return null;

  // Check there's no close brace between braceStart and pos
  const inside = doc.substring(braceStart + 1, pos);

  // Determine segment by counting colons and pipes
  const colonCount = (inside.match(/:/g) || []).length;
  const hasPipe = inside.includes('|');

  if (hasPipe) {
    // After the pipe → modifier segment
    const pipeIdx = inside.lastIndexOf('|');
    const typed = inside.substring(pipeIdx + 1);
    return { segment: 'modifier', typed, from: braceStart + 1 + pipeIdx + 1 };
  }

  if (colonCount === 0) {
    // Label segment
    return { segment: 'label', typed: inside, from: braceStart + 1 };
  }

  if (colonCount === 1) {
    // Type segment (after first colon)
    const colonIdx = inside.indexOf(':');
    const typed = inside.substring(colonIdx + 1);
    return { segment: 'type', typed, from: braceStart + 1 + colonIdx + 1 };
  }

  // colonCount >= 2 → default segment (or modifier if pipe present, handled above)
  // Check for pipe in the last part
  const lastColonIdx = inside.indexOf(':', inside.indexOf(':') + 1);
  const afterLastColon = inside.substring(lastColonIdx + 1);
  if (afterLastColon.includes('|')) {
    const pipeIdx = afterLastColon.lastIndexOf('|');
    const typed = afterLastColon.substring(pipeIdx + 1);
    return {
      segment: 'modifier',
      typed,
      from: braceStart + 1 + lastColonIdx + 1 + pipeIdx + 1,
    };
  }

  return {
    segment: 'default',
    typed: afterLastColon,
    from: braceStart + 1 + lastColonIdx + 1,
  };
}

// --- Main completion source ---

async function queryCompletionSource(
  context: CompletionContext,
  filingService: FilingService,
): Promise<CompletionResult | null> {
  const doc = context.state.doc.toString();
  const pos = context.pos;

  // Check if inside {braces}
  const braceCtx = getBraceContext(doc, pos);

  if (braceCtx) {
    if (braceCtx.segment === 'type') {
      // Suggest field types
      const word = braceCtx.typed.trim();
      const options: Completion[] = FIELD_TYPES
        .filter((ft) => !word || ft.label.toLowerCase().startsWith(word.toLowerCase()))
        .map((ft) => ({
          label: ft.label,
          detail: ft.detail,
          section: fieldTypesSection,
        }));
      if (options.length === 0) return null;
      return { from: braceCtx.from, options };
    }

    if (braceCtx.segment === 'modifier') {
      const word = braceCtx.typed.trim();
      const options: Completion[] = MODIFIERS
        .filter((m) => !word || m.label.startsWith(word.toLowerCase()))
        .map((m) => ({
          label: m.label,
          detail: m.detail,
          section: modifiersSection,
        }));
      if (options.length === 0) return null;
      return { from: braceCtx.from, options };
    }

    // Label or default segment → no autocomplete
    return null;
  }

  // Outside braces: SQL keywords + filing fields from API
  const wordMatch = context.matchBefore(/\w+/);
  if (!wordMatch && !context.explicit) return null;
  const from = wordMatch?.from ?? pos;
  const word = wordMatch?.text ?? '';

  // Build SQL keyword completions
  const sqlOptions: Completion[] = SQL_KEYWORDS
    .filter((kw) => !word || kw.toLowerCase().startsWith(word.toLowerCase()))
    .map((kw) => ({
      label: kw.toLowerCase(),
      detail: 'keyword',
      section: sqlKeywordsSection,
      apply: kw.toLowerCase(),
    }));

  // Fetch API completions (debounced/cached)
  let apiOptions: Completion[] = [];
  if (word.length >= 1 || context.explicit) {
    const allApi = await fetchApiCompletions(filingService, word);
    apiOptions = allApi.filter(
      (c) => !word || c.label.toLowerCase().startsWith(word.toLowerCase()),
    );
  }

  const options = [...apiOptions, ...sqlOptions];
  if (options.length === 0) return null;

  return { from, options };
}

/**
 * Create a CodeMirror autocomplete extension for the query editor.
 */
export function createQueryAutocomplete(filingService: FilingService): Extension {
  return autocompletion({
    override: [
      (context: CompletionContext) => queryCompletionSource(context, filingService),
    ],
    activateOnTyping: true,
    defaultKeymap: true,
  });
}
