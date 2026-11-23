export type JsonMode = 'format' | 'minify';
export type JsonIndent = '2' | '4' | 'tab';

export type FormatJsonOptions = {
  /** Torin JSONC: allow line/block comments and trailing commas before } or ]. Output remains strict JSON. */
  jsonc?: boolean;
};

export const jsonIndents: JsonIndent[] = ['2', '4', 'tab'];

function spaceFor(indent: JsonIndent): string | number {
  if (indent === 'tab') return '\t';
  return Number(indent);
}

function asJsonError(failure: unknown): Error {
  if (failure instanceof SyntaxError) {
    return new Error(failure.message || 'Invalid JSON.');
  }
  return failure instanceof Error ? failure : new Error('JSON formatting failed.');
}

function stripComments(input: string): string {
  let out = '';
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    const next = input[i + 1];

    if (ch === '"') {
      out += ch;
      i += 1;
      while (i < input.length) {
        const cur = input[i];
        out += cur;
        if (cur === '\\') {
          if (i + 1 < input.length) {
            out += input[i + 1];
            i += 2;
            continue;
          }
        } else if (cur === '"') {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    if (ch === '/' && next === '/') {
      i += 2;
      while (i < input.length && input[i] !== '\n' && input[i] !== '\r') i += 1;
      continue;
    }

    if (ch === '/' && next === '*') {
      i += 2;
      while (i < input.length && !(input[i] === '*' && input[i + 1] === '/')) i += 1;
      if (i >= input.length) throw new Error('Unterminated block comment in JSONC input.');
      i += 2;
      continue;
    }

    out += ch;
    i += 1;
  }
  return out;
}

function stripTrailingCommas(input: string): string {
  let out = '';
  let i = 0;
  while (i < input.length) {
    const ch = input[i];

    if (ch === '"') {
      out += ch;
      i += 1;
      while (i < input.length) {
        const cur = input[i];
        out += cur;
        if (cur === '\\') {
          if (i + 1 < input.length) {
            out += input[i + 1];
            i += 2;
            continue;
          }
        } else if (cur === '"') {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    if (ch === ',') {
      let j = i + 1;
      while (j < input.length && /\s/.test(input[j])) j += 1;
      if (input[j] === '}' || input[j] === ']') {
        i += 1;
        continue;
      }
    }

    out += ch;
    i += 1;
  }
  return out;
}

/**
 * Strip JSONC comments and trailing commas outside string literals.
 * Not JSON5: no bare keys, single quotes, hex, or Infinity.
 */
export function stripJsonc(input: string): string {
  return stripTrailingCommas(stripComments(input));
}

/** Parse then re-serialize. Numbers follow ECMA-262 Number precision. */
export function formatJson(
  input: string,
  mode: JsonMode,
  indent: JsonIndent = '2',
  options: FormatJsonOptions = {},
): string {
  const text = input.trim();
  if (!text) throw new Error('Enter JSON to format.');
  const source = options.jsonc ? stripJsonc(text) : text;
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (failure) {
    throw asJsonError(failure);
  }
  try {
    return mode === 'minify'
      ? JSON.stringify(value)
      : JSON.stringify(value, null, spaceFor(indent));
  } catch (failure) {
    throw asJsonError(failure);
  }
}
