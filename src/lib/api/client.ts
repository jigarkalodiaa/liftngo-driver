/**
 * Optional dedicated axios instance (legacy scripts/tests). **App code:** use default `import axios from "axios"`
 * so `QueryProvider` request/response interceptors apply (`baseURL`, Bearer, `{ success, data }` unwrap).
 */

import axios from "axios";

export const liftngoApi = axios.create({
  timeout: 30_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default liftngoApi;
