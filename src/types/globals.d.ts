import "axios";

/**
 * Global `axios` (QueryProvider) may unwrap `{ success, data }` into `response.data`.
 */
declare module "axios" {
  export interface AxiosInstance {
    request<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    head<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    options<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  }
}

export {};
