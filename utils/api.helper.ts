import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import env from '../config/env.config';

/**
 * Thin wrapper around Playwright's request context so specs don't repeat
 * the base URL, headers, or response-shape assertions.
 */
export class ApiHelper {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseURL: string = env.apiURL,
  ) {}

  private url(endpoint: string): string {
    return `${this.baseURL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  }

  async get(endpoint: string, params?: Record<string, string | number | boolean>): Promise<APIResponse> {
    return this.request.get(this.url(endpoint), { params });
  }

  async post(endpoint: string, form?: Record<string, string | number | boolean>): Promise<APIResponse> {
    return this.request.post(this.url(endpoint), { form });
  }

  async put(endpoint: string, form?: Record<string, string | number | boolean>): Promise<APIResponse> {
    return this.request.put(this.url(endpoint), { form });
  }

  async delete(endpoint: string, form?: Record<string, string | number | boolean>): Promise<APIResponse> {
    return this.request.delete(this.url(endpoint), { form });
  }

  /**
   * Some endpoints return a JSON body with a 200 HTTP status but their own
   * `responseCode` inside. Parse and assert on both.
   */
  async json<T = any>(response: APIResponse): Promise<T> {
    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Expected JSON but got:\n${text.slice(0, 500)}`);
    }
  }

  async expectResponseCode(response: APIResponse, code: number): Promise<any> {
    const body = await this.json(response);
    expect(body.responseCode, `responseCode in ${JSON.stringify(body).slice(0, 200)}`).toBe(code);
    return body;
  }
}
