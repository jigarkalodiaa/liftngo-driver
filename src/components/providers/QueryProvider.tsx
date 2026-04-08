'use client';

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { mergeLiftngoFetchHeaders } from '@/config/liftngoApi';
import { fetchHttp } from '@/lib/fetch';
import { getLiftngoBearerToken } from '@/lib/api/bearerToken';
import { getCsrfToken, SessionProvider, signOut } from 'next-auth/react';
import { ReactQueryDevtools as QueryDevTools } from '@tanstack/react-query-devtools';
import { environmentManager, MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

let appQueryClient: AppQueryClient | undefined = undefined;
let globalAxiosInterceptorsAttached = false;

class AppQueryClient extends QueryClient {
  constructor() {
    super({
      queryCache: new QueryCache({
        onError: (error: unknown | any) => {
          return error;
        },
      }),
      mutationCache: new MutationCache({
        onError: (error: any) => {
          return error;
        },
      }),
    });

    this.setDefaultOptions({
      queries: {
        retry: false,
        retryOnMount: true,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        gcTime: Infinity,
        staleTime: 5000,
      },
    });

    if (!globalAxiosInterceptorsAttached) {
      globalAxiosInterceptorsAttached = true;

      axios.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
          const url = config.url ?? '';
          if (url.startsWith('/api/')) {
            config.baseURL = '';
          } else {
            const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
            config.baseURL = base;
          }

          const merged = mergeLiftngoFetchHeaders(new Headers());
          merged.forEach((value, key) => {
            config.headers.set(key, value);
          });

          if (!config.headers.Authorization) {
            const localBearer = getLiftngoBearerToken();
            if (localBearer) {
              config.headers.Authorization = `Bearer ${localBearer}`;
            } else {
              const auth = await fetchHttp({
                method: 'GET',
                url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/session`,
              });
              if (auth?.accessToken) {
                config.headers.Authorization = `Bearer ${auth.accessToken}`;
              }
            }
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      axios.interceptors.response.use(
        (response: AxiosResponse) => {
          const body = response?.data;
          if (body && typeof body === 'object' && body.success === true && 'data' in body) {
            return { ...response, data: (body as { data: unknown }).data };
          }
          return response;
        },
      async (error: AxiosError) => {
        if (error?.config && error?.response?.status === 401) {
          try {
            const auth = await fetchHttp({
              method: 'GET',
              url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/session`,
            });
            const response = await fetchHttp({
              method: 'POST',
              url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
              data: {
                refresh: auth?.refreshToken ?? '',
              },
            });
            const authSession = await fetchHttp({
              method: 'POST',
              url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/session`,
              data: {
                data: {
                  accessToken: response.data.tokens.accessToken,
                  refreshToken: response.data.tokens.refreshToken,
                },
                csrfToken: await getCsrfToken(),
              },
            });
            return axios({
              ...error.config,
              headers: {
                Authorization: `Bearer ${authSession.accessToken}`,
              },
            });
          } catch {
            return await signOut({
              callbackUrl: process.env.NEXT_PUBLIC_BASE_URL,
            });
          }
        }
        return Promise.reject(error);
      }
      );
    }
  }
}

const getAppQueryClient = () => {
  return environmentManager.isServer() ? new AppQueryClient() : (appQueryClient ||= new AppQueryClient());
};

const AppProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [queryClient] = useState(getAppQueryClient());

  useEffect(() => {
    const mutationCache = queryClient.getMutationCache();

    const unsubscribe = mutationCache.subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error') {
        const error: any = event.action.error;
        let res = error?.response?.data;
        let errorMessage: string | undefined;
        // Try to extract first validation error from `errors`
        if (res?.errors && typeof res.errors === 'object') {
          const stack: any[] = [res.errors];
          while (stack.length && !errorMessage) {
            const current = stack.pop();
            if (!current || typeof current !== 'object') continue;

            for (const value of Object.values(current)) {
              if (Array.isArray(value) && typeof value[0] === 'string') {
                errorMessage = value[0];
                break;
              }
              if (typeof value === 'object') {
                stack.push(value);
              }
            }
          }
        }
        console.error(errorMessage ?? res?.message ?? error?.message ?? 'Something went wrong');
      }
    });
    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
        <QueryDevTools initialIsOpen={false} />
      </SessionProvider>
    </QueryClientProvider>
  );
};

export default AppProvider;
