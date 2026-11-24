/**
 * Common API Client Foundation
 * 
 * Reusable HTTP layer for all domain services.
 * Features:
 * - Centralized Base URL resolution from apiConfig
 * - Common headers and auth token management
 * - AbortController request timeouts
 * - Standardized response unwrapping and error formatting
 * - Zero domain-specific logic (domain logic belongs in individual services)
 */

import { apiConfig } from '../config/apiConfig';
import { ApiResponse, ApiError, RequestOptions } from '../types/api';

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = apiConfig.baseUrl;
    this.defaultHeaders = { ...apiConfig.headers };
  }

  /**
   * Set or update authentication token for future Phase 4 auth
   */
  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Get the active token
   */
  public getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Update base URL if needed dynamically
   */
  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Low-level fetch wrapper with timeout, headers, and error parsing
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    // Construct full URL
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

    // Append query params if provided
    let finalUrl = url;
    if (options?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
      }
    }

    // Merge headers
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...options?.headers,
    };

    if (this.authToken && !options?.skipAuthToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Setup Timeout with AbortController
    const timeoutMs = options?.timeoutMs || apiConfig.timeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body !== undefined && method !== 'GET') {
        if (body instanceof FormData) {
          // Let browser set multipart boundary
          delete headers['Content-Type'];
          fetchOptions.body = body;
        } else {
          fetchOptions.body = JSON.stringify(body);
        }
      }

      const response = await fetch(finalUrl, fetchOptions);
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      // Handle non-2xx responses
      if (!response.ok) {
        let errorData: any = {};
        if (isJson) {
          try {
            errorData = await response.json();
          } catch {
            // fallback if json parsing fails
          }
        }

        const apiError: ApiError = {
          success: false,
          statusCode: response.status,
          message: errorData.message || response.statusText || `Request failed with status ${response.status}`,
          errors: errorData.errors,
          timestamp: new Date().toISOString(),
        };

        throw apiError;
      }

      // Check if response is actually JSON before parsing (prevents <!doctype HTML syntax errors on static hosts)
      if (!isJson) {
        const text = await response.text();
        // If it starts with '<', it's HTML from a static host rewrite (e.g. index.html)
        if (text.trim().startsWith('<')) {
          const apiError: ApiError = {
            success: false,
            statusCode: 404,
            message: 'API endpoint unavailable or returned HTML (static host fallback)',
            timestamp: new Date().toISOString(),
          };
          throw apiError;
        }

        // Try parsing text as json just in case headers were omitted
        try {
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed === 'object' && 'success' in parsed && 'data' in parsed) {
            return parsed as ApiResponse<T>;
          }
          return {
            success: true,
            data: parsed as T,
            timestamp: new Date().toISOString(),
          };
        } catch {
          const apiError: ApiError = {
            success: false,
            statusCode: 0,
            message: 'Server returned non-JSON response',
            timestamp: new Date().toISOString(),
          };
          throw apiError;
        }
      }

      // Parse JSON response safely
      let data: any;
      try {
        data = await response.json();
      } catch (jsonErr: any) {
        const apiError: ApiError = {
          success: false,
          statusCode: 0,
          message: 'Malformed JSON received from server',
          timestamp: new Date().toISOString(),
        };
        throw apiError;
      }

      // Return standardized envelope if not already enveloped
      if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
        return data as ApiResponse<T>;
      }

      return {
        success: true,
        data: data as T,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const timeoutError: ApiError = {
          success: false,
          statusCode: 408,
          message: `Request timed out after ${timeoutMs}ms`,
          timestamp: new Date().toISOString(),
        };
        throw timeoutError;
      }

      // Re-throw standardized ApiError
      if (err.statusCode && err.timestamp) {
        throw err as ApiError;
      }

      const genericError: ApiError = {
        success: false,
        statusCode: 0,
        message: err.message || 'Network error or unreachable service',
        timestamp: new Date().toISOString(),
      };
      throw genericError;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // HTTP Method Convenience Methods
  public async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'GET', undefined, options);
  }

  public async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'POST', body, options);
  }

  public async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PUT', body, options);
  }

  public async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PATCH', body, options);
  }

  public async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'DELETE', undefined, options);
  }
}

// Export single reusable foundation instance
export const apiClient = new ApiClient();
