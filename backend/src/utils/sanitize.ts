const UNSAFE_HTML_PATTERN = /[<>]/g;

export const sanitizeString = (value: string) => value.trim().replace(UNSAFE_HTML_PATTERN, '');

export const sanitizePayload = <T>(value: T): T => {
  if (typeof value === 'string') {
    return sanitizeString(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizePayload(entry)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce<Record<string, unknown>>((accumulator, [key, entry]) => {
      accumulator[key] = sanitizePayload(entry);
      return accumulator;
    }, {}) as T;
  }

  return value;
};