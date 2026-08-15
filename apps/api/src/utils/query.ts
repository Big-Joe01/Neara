import type { Request } from 'express';

/** Coerce an express query value into a single string. */
export function qstr(req: Request, key: string): string | undefined {
  const v = req.query[key];
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return undefined;
}

/** Coerce an express route param into a single string. */
export function pstr(req: Request, key: string): string {
  const v = req.params[key];
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return '';
}
