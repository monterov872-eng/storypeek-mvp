import type { AppConfig } from '../../../../config.js';

/** Anonymous + optional server session cookies for Instagram web API. */
export class IgSession {
  private cookies = new Map<string, string>();
  private csrfToken: string | null = null;
  private bootstrapped = false;

  constructor(private readonly config: AppConfig) {
    if (config.INSTAGRAM_SESSION_ID) {
      this.cookies.set('sessionid', config.INSTAGRAM_SESSION_ID);
    }
  }

  get hasSession(): boolean {
    return this.cookies.has('sessionid');
  }

  cookieHeader(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  csrf(): string | null {
    return this.csrfToken;
  }

  async ensureBootstrap(userAgent: string): Promise<void> {
    if (this.bootstrapped) return;

    const res = await fetch('https://www.instagram.com/', {
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    this.ingestSetCookie(res);
    const html = await res.text();
    const fromHtml = html.match(/"csrf_token":"([^"]+)"/)?.[1];
    if (fromHtml) this.csrfToken = fromHtml;
    if (this.cookies.has('csrftoken')) {
      this.csrfToken = this.cookies.get('csrftoken') ?? this.csrfToken;
    }

    this.bootstrapped = true;
  }

  ingestSetCookie(res: Response) {
    const list = res.headers.getSetCookie?.() ?? [];
    for (const raw of list) {
      const part = raw.split(';')[0];
      const eq = part.indexOf('=');
      if (eq === -1) continue;
      const name = part.slice(0, eq).trim();
      const value = part.slice(eq + 1).trim();
      if (name && value) this.cookies.set(name, value);
    }
  }
}
