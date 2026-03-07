export function stripBaseUrl(fullUrl: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  if (fullUrl.startsWith(base)) {
    const p = fullUrl.slice(base.length).replace(/^\/+/, '');
    return p ? `/${p}` : '';
  }
  return fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`;
}
