import axios from 'axios';

const RAW_BASE = import.meta.env.VITE_API_URL || '';
const BASE_URL = RAW_BASE.replace(/\/$/, '');
const REQUEST_TIMEOUT = 12_000;
const RETRY_COUNT = 2;

let authToken = null;

export function setAuthToken(token) {
  authToken = token || null;
}

export function clearAuthToken() {
  authToken = null;
}

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const apiClient = axios.create({
  baseURL: BASE_URL || undefined,
  timeout: REQUEST_TIMEOUT,
  headers: {
    Accept: 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const next = { ...config };
  next.headers = { ...(config.headers || {}) };
  if (authToken) {
    next.headers.Authorization = `Bearer ${authToken}`;
  }
  next.headers['Content-Type'] = next.headers['Content-Type'] || 'application/json';
  return next;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeApiError(error);
    return Promise.reject(normalized);
  },
);

export function normalizeApiError(error) {
  if (!error) {
    return new Error('Unexpected network error.');
  }

  if (error.response) {
    const { status, data } = error.response;
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      error.message ||
      `Request failed with status ${status}`;

    const normalized = new Error(message);
    normalized.status = status;
    normalized.data = data;
    normalized.isApiError = true;
    return normalized;
  }

  if (error.code === 'ECONNABORTED') {
    const normalized = new Error('Request timed out. Please try again.');
    normalized.code = 'TIMEOUT';
    normalized.isApiError = true;
    return normalized;
  }

  const normalized = new Error(error.message || 'Network request failed.');
  normalized.code = error.code;
  normalized.isApiError = true;
  return normalized;
}

async function withRetry(fn) {
  let lastError = null;
  for (let attempt = 0; attempt <= RETRY_COUNT; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = error?.status || error?.response?.status;
      const retryable = !status || status >= 500 || status === 429;
      if (attempt === RETRY_COUNT || !retryable) {
        throw error;
      }
      await sleep(300 * (attempt + 1));
    }
  }
  throw lastError;
}

export async function request(method, path, body = null, params = null, config = {}) {
  return withRetry(async () => {
    const response = await apiClient.request({
      url: buildUrl(path),
      method,
      data: body,
      params,
      ...config,
    });
    return response.data;
  });
}

export async function upload(path, formData, config = {}) {
  return withRetry(async () => {
    const response = await apiClient.request({
      url: buildUrl(path),
      method: 'POST',
      data: formData,
      headers: {
        ...(config.headers || {}),
      },
      ...config,
    });
    return response.data;
  });
}

export function apiUrl(path) {
  return buildUrl(path);
}
