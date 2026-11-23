export const POSTMAN_ORIGIN = 'https://api.postman.com';
export const GATEWAY_PREFIX = '/api/postman';
export const PAGE_SIZE = 100;
export const MAX_OFFSET = 50_000;
export const REQUEST_TIMEOUT = 25_000;
export const MAX_RESPONSE_BYTES = 16 * 1024 * 1024;

const uuid = '[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}';
const workspaceId = new RegExp('^' + uuid + '$');
const resourceId = new RegExp('^(?:[0-9]{1,20}-)?' + uuid + '$');
const workspacePath = new RegExp('^/workspaces/(' + uuid + ')(?:/global-variables)?$');
const overviewPath = new RegExp('^/(?:[^/]+/)?workspaces?/([^/]+)(?:/overview)?/?$', 'i');

export function parseWorkspace(input: string): string {
  const value = input.trim();
  if (workspaceId.test(value)) return value.toLowerCase();
  try {
    const url = new URL(value);
    const trusted = ['postman.com', 'www.postman.com', 'web.postman.co'].includes(url.hostname) ||
      /^[a-z0-9-]+\.postman\.co$/.test(url.hostname);
    if (url.protocol === 'https:' && trusted && !url.port && !url.username && !url.password) {
      const parts = overviewPath.exec(url.pathname);
      const candidate = new RegExp('(?:^|~)(' + uuid + ')$', 'i').exec(parts?.[1] ?? '');
      if (candidate) return candidate[1].toLowerCase();
    }
  } catch {
    // Use the same error for invalid URLs and IDs.
  }
  throw new Error('Enter a workspace UUID or a Postman workspace Overview URL.');
}

export function validResourceId(value: unknown): value is string {
  return typeof value === 'string' && resourceId.test(value);
}

export function upstreamRoute(target: string): string | undefined {
  if (!target.startsWith('/') || target.startsWith('//') || /[\\#\s%]/.test(target)) return;
  const [path, query, extra] = target.split('?');
  if (extra !== undefined) return;
  const detail = /^\/(collections|environments)\/([^/]+)$/.exec(path);
  if (query === undefined && (workspacePath.test(path) || (detail && validResourceId(detail[2])))) {
    return path;
  }
  if ((path !== '/collections' && path !== '/environments') || query === undefined) return;
  const params = new URLSearchParams(query);
  const workspace = params.get('workspace');
  if (!workspace || !workspaceId.test(workspace)) return;
  const canonical = new URLSearchParams({ workspace: workspace.toLowerCase() });
  if (path === '/collections') {
    const limit = params.get('limit');
    const offset = params.get('offset');
    if ([...params].length !== 3 || !limit || !offset || !/^[0-9]{1,6}$/.test(limit) ||
        !/^[0-9]{1,6}$/.test(offset) || Number(limit) < 1 ||
        Number(limit) > PAGE_SIZE || Number(offset) > MAX_OFFSET) return;
    canonical.set('limit', String(Number(limit)));
    canonical.set('offset', String(Number(offset)));
  } else if ([...params].length !== 1) {
    return;
  }
  return path + '?' + canonical;
}

export function validApiKey(key: string) {
  return /^[\x21-\x7e]{1,256}$/.test(key);
}
