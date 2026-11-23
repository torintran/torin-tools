export type DateInputFormat =
  | 'auto'
  | 'js-locale'
  | 'iso8601'
  | 'iso9075'
  | 'rfc3339'
  | 'rfc7231'
  | 'unix-s'
  | 'unix-ms'
  | 'utc'
  | 'mongo'
  | 'excel';

export type DateOutputId =
  | 'js-locale'
  | 'iso8601'
  | 'iso9075'
  | 'rfc3339'
  | 'rfc7231'
  | 'unix-s'
  | 'unix-ms'
  | 'utc'
  | 'mongo'
  | 'excel';

export type DateTimeParts = {
  instant: Date;
  detected: Exclude<DateInputFormat, 'auto'>;
  outputs: ReadonlyArray<{ id: DateOutputId; value: string }>;
};

/** Excel serial day 0 is 1899-12-30 (Lotus 1-2-3 compatibility). */
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const DAY_MS = 86_400_000;

const ISO_RE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/i;
const ISO9075_RE = /^\d{4}-\d{2}-\d{2}[ ]\d{2}:\d{2}(?::\d{2})?$/;
const UNIX_S_RE = /^-?\d{1,10}$/;
const UNIX_MS_RE = /^-?\d{11,16}$/;
const MONGO_RE = /^[a-f0-9]{24}$/i;
const EXCEL_RE = /^-?\d+(?:\.\d+)?$/;
const RFC7231_RE = /^(?:[A-Za-z]{3},\s+)?\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{2}:\d{2}(?::\d{2})?\s+(?:GMT|[+-]\d{4}|[A-Za-z]{1,5})$/;

function pad(value: number, width = 2) {
  return String(Math.trunc(Math.abs(value))).padStart(width, '0');
}

function fromUnix(value: string, unit: 's' | 'ms'): Date {
  const raw = Number(value);
  if (!Number.isFinite(raw) || !Number.isSafeInteger(Math.trunc(raw))) {
    throw new Error('Enter a finite Unix timestamp.');
  }
  const ms = unit === 's' ? Math.trunc(raw) * 1000 : Math.trunc(raw);
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid Unix timestamp.');
  return date;
}

function fromIsoFamily(value: string): Date {
  const normalized = value.includes('T') || /Z|[+-]\d{2}:?\d{2}$/i.test(value)
    ? value
    : value.includes(' ')
      ? value.replace(' ', 'T')
      : value + 'T00:00:00';
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid ISO date-time.');
  return date;
}

function fromJsLocale(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid JS locale date string.');
  return date;
}

function fromRfc7231(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid RFC 7231 / HTTP-date string.');
  return date;
}

function fromMongoObjectId(value: string): Date {
  if (!MONGO_RE.test(value.trim())) throw new Error('Enter a 24-character Mongo ObjectId.');
  const seconds = Number.parseInt(value.trim().slice(0, 8), 16);
  if (!Number.isFinite(seconds)) throw new Error('Enter a valid Mongo ObjectId timestamp.');
  return new Date(seconds * 1000);
}

function fromExcel(value: string): Date {
  const serial = Number(value);
  if (!Number.isFinite(serial)) throw new Error('Enter a valid Excel serial date.');
  const date = new Date(EXCEL_EPOCH_MS + serial * DAY_MS);
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid Excel serial date.');
  return date;
}

export function detectDateFormat(input: string): Exclude<DateInputFormat, 'auto'> {
  const value = input.trim();
  if (!value) throw new Error('Enter a date-time value.');
  if (MONGO_RE.test(value) && /[a-f]/i.test(value)) return 'mongo';
  if (UNIX_MS_RE.test(value)) return 'unix-ms';
  if (UNIX_S_RE.test(value)) return 'unix-s';
  if (ISO9075_RE.test(value)) return 'iso9075';
  if (ISO_RE.test(value)) return value.includes('T') || /Z|[+-]\d{2}/i.test(value) ? 'rfc3339' : 'iso8601';
  if (RFC7231_RE.test(value)) return 'rfc7231';
  if (EXCEL_RE.test(value) && value.includes('.')) return 'excel';
  if (!Number.isNaN(Date.parse(value))) {
    if (value.includes('GMT') || RFC7231_RE.test(value)) return 'rfc7231';
    return 'js-locale';
  }
  throw new Error('Unrecognized date-time format.');
}

export function parseDateTime(input: string, format: DateInputFormat = 'auto'): {
  instant: Date;
  detected: Exclude<DateInputFormat, 'auto'>;
} {
  const value = input.trim();
  const detected = format === 'auto' ? detectDateFormat(value) : format;
  let instant: Date;
  switch (detected) {
    case 'unix-s':
      instant = fromUnix(value, 's');
      break;
    case 'unix-ms':
      instant = fromUnix(value, 'ms');
      break;
    case 'iso8601':
    case 'iso9075':
    case 'rfc3339':
      instant = fromIsoFamily(value);
      break;
    case 'rfc7231':
    case 'utc':
      instant = fromRfc7231(value);
      break;
    case 'js-locale':
      instant = fromJsLocale(value);
      break;
    case 'mongo':
      instant = fromMongoObjectId(value);
      break;
    case 'excel':
      instant = fromExcel(value);
      break;
  }
  return { instant, detected };
}

/** Local-offset ISO-8601 / RFC 3339 profile without fractional seconds. */
export function formatOffsetDateTime(instant: Date): string {
  const offsetMin = -instant.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  return instant.getFullYear()
    + '-' + pad(instant.getMonth() + 1)
    + '-' + pad(instant.getDate())
    + 'T' + pad(instant.getHours())
    + ':' + pad(instant.getMinutes())
    + ':' + pad(instant.getSeconds())
    + sign + pad(Math.floor(Math.abs(offsetMin) / 60))
    + ':' + pad(Math.abs(offsetMin) % 60);
}

export function formatIso9075Local(instant: Date): string {
  return instant.getFullYear()
    + '-' + pad(instant.getMonth() + 1)
    + '-' + pad(instant.getDate())
    + ' ' + pad(instant.getHours())
    + ':' + pad(instant.getMinutes())
    + ':' + pad(instant.getSeconds());
}

export function formatMongoObjectId(instant: Date): string {
  const seconds = Math.floor(instant.getTime() / 1000);
  if (seconds < 0) throw new Error('Mongo ObjectId timestamp must be non-negative.');
  return seconds.toString(16).padStart(8, '0') + '0000000000000000';
}

export function formatExcelSerial(instant: Date): string {
  return String((instant.getTime() - EXCEL_EPOCH_MS) / DAY_MS);
}

export function formatInTimeZone(instant: Date, timeZone: string, locale = 'en-GB'): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'shortOffset',
    }).format(instant);
  } catch {
    throw new Error('Enter a valid IANA time zone.');
  }
}

export function convertDateTime(input: string, format: DateInputFormat = 'auto'): DateTimeParts {
  const { instant, detected } = parseDateTime(input, format);
  const ms = instant.getTime();
  const offsetIso = formatOffsetDateTime(instant);
  const utc = instant.toUTCString();
  return {
    instant,
    detected,
    outputs: [
      { id: 'js-locale', value: instant.toString() },
      { id: 'iso8601', value: offsetIso },
      { id: 'iso9075', value: formatIso9075Local(instant) },
      { id: 'rfc3339', value: offsetIso },
      { id: 'rfc7231', value: utc },
      { id: 'unix-s', value: String(Math.trunc(ms / 1000)) },
      { id: 'unix-ms', value: String(ms) },
      { id: 'utc', value: utc },
      { id: 'mongo', value: formatMongoObjectId(instant) },
      { id: 'excel', value: formatExcelSerial(instant) },
    ],
  };
}

export const inputFormats: DateInputFormat[] = [
  'auto', 'js-locale', 'iso8601', 'iso9075', 'rfc3339', 'rfc7231',
  'unix-s', 'unix-ms', 'utc', 'mongo', 'excel',
];
