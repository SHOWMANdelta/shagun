// API Client helper
// Mini College ERP System - BCA Project No. 41 - Shagun Kaushal

export interface ApiResponse<T = unknown> {
  data: T;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

/** Public pages must never be bounced to the sign-in page by a 401. */
function isPublicPath(): boolean {
  const path = window.location.pathname;
  return path === '/' || path.includes('/login');
}

export async function apiRequestFull<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T; meta: Record<string, unknown> }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'erp',
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && !isPublicPath()) {
    window.location.href = '/login?msg=session_expired';
  }

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `HTTP error ${response.status}`);
  }

  return { data: data.data, meta: data.meta ?? {} };
}

export async function apiRequest<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'erp',
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && !isPublicPath()) {
    window.location.href = '/login?msg=session_expired';
  }

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `HTTP error ${response.status}`);
  }

  return data.data;
}
