export interface HttpRequestConfig {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    params?: Record<string, any>;
    data?: any;
    headers?: Record<string, string>;
  }
  
  /**
   * 🔄 `fetch-http` API.
   *
   * Features:
   * - Supports method, params, data (body), and headers
   * - Auto-handles query parameters
   * - Throws consistent errors for non-2xx responses
   * - Returns parsed JSON responses
   *
   * Example usage:
   *   await http({ url: '/api/products', method: 'GET', params: { q: 'toys' } });
   *   await http({ url: '/api/products', method: 'POST', data: { name: 'Shampoo' } });
   */
  export const fetchHttp = async <T = any>({
    url,
    method = 'GET',
    params,
    data,
    headers = {},
  }: HttpRequestConfig): Promise<T> => {
    const queryString = params
      ? '?' +
        Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&')
      : '';
  
    const response = await fetch(url + queryString, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: ['POST', 'PUT', 'PATCH'].includes(method) ? JSON.stringify(data) : undefined,
    });
  
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: errorBody.message || response.statusText,
        body: errorBody,
      };
    }
  
    return response.json();
  };
  