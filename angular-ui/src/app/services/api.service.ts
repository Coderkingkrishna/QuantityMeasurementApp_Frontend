import { Injectable } from '@angular/core';

interface ApiConfig {
  apiBaseUrl: string;
  endpoints: Record<string, string>;
  googleClientId?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly defaultConfig: ApiConfig = {
    apiBaseUrl: '',
    endpoints: {
      signup: '/api/auth/signup',
      login: '/api/auth/login',
      google: '/api/auth/google',
      logout: '/api/auth/logout',
      convert: '/api/quantitymeasurement/convert',
      compare: '/api/quantitymeasurement/compare',
      add: '/api/quantitymeasurement/add',
      subtract: '/api/quantitymeasurement/subtract',
      divide: '/api/quantitymeasurement/divide',
      history: '/api/quantitymeasurement/history'
    },
    googleClientId: ''
  };

  private configPromise?: Promise<ApiConfig>;
  private activeBaseUrl = '';

  async request<T>(
    endpointKey: string,
    options: { method?: string; body?: unknown; requiresAuth?: boolean } = {}
  ): Promise<T> {
    const config = await this.loadConfig();
    const endpoint = config.endpoints[endpointKey];

    if (!endpoint) {
      throw new Error(`Endpoint key ${endpointKey} is not configured.`);
    }

    const method = options.method || 'GET';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const token = localStorage.getItem('qm_token');

    if (options.requiresAuth && !token) {
      throw new Error('Please login first.');
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const baseCandidates = this.getBaseUrlCandidates(this.activeBaseUrl || config.apiBaseUrl);

    if (!baseCandidates.length) {
      throw new Error('API base URL is not configured. Set API_BASE_URL in .env and run npm start or npm run build.');
    }

    let response: Response | null = null;
    let networkError: unknown;

    for (const baseUrl of baseCandidates) {
      try {
        response = await fetch(`${baseUrl}${endpoint}`, {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined
        });
        this.activeBaseUrl = baseUrl;
        break;
      } catch (error) {
        networkError = error;
      }
    }

    if (!response) {
      const networkMessage =
        networkError instanceof Error
          ? networkError.message
          : 'Unable to connect to backend. Verify API is running and URL/port are correct.';
      throw new Error(networkMessage);
    }

    const text = await response.text();
    const payload = text ? this.tryParseJson(text) : null;

    if (!response.ok) {
      const fallbackError = `Request failed with status ${response.status}`;
      const message = typeof payload === 'string' ? payload : payload?.message || fallbackError;
      throw new Error(message);
    }

    return payload as T;
  }

  private async loadConfig(): Promise<ApiConfig> {
    if (!this.configPromise) {
      this.configPromise = fetch('data/app-config.json')
        .then((response) => {
          if (!response.ok) {
            throw new Error('Unable to load app-config.json');
          }
          return response.json() as Promise<ApiConfig>;
        })
        .catch(() => this.defaultConfig);
    }

    return this.configPromise;
  }

  private getBaseUrlCandidates(configuredBaseUrl: string): string[] {
    const candidates: string[] = [];

    const pushUnique = (url: string) => {
      if (url && !candidates.includes(url)) {
        candidates.push(url);
      }
    };

    pushUnique(configuredBaseUrl);

    if (!configuredBaseUrl) {
      return candidates;
    }

    try {
      const parsed = new URL(configuredBaseUrl);
      const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

      if (isLocalhost) {
        const flippedProtocol = parsed.protocol === 'https:' ? 'http:' : 'https:';
        pushUnique(`${flippedProtocol}//${parsed.host}`);
      }
    } catch {
      // Keep only configured URL if parsing fails.
    }

    return candidates;
  }

  private tryParseJson(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}
