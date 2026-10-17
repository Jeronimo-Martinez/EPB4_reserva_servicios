export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const USER_STORAGE_KEY = 'promarket_auth_user';
/** Fired when the backend rejects the stored session (expired, closed or account blocked). */
export const SESSION_EXPIRED_EVENT = 'promarket:session-expired';
export const SESSION_ENDED_MESSAGE = 'Tu sesión terminó. Inicia sesión de nuevo.';

function storedToken(): string | undefined {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null')?.token;
  } catch {
    return undefined;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const token = storedToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 && token) {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
        // Same text the app shows on logout, so a screen's own error toast does not contradict it.
        throw new ApiError(401, SESSION_ENDED_MESSAGE);
      }
      const message =
        data?.message ||
        `Error en la solicitud: ${response.status} ${response.statusText}`;
      throw new ApiError(response.status, message);
    }

    return data as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Error de red / conexión rechazada (Backend offline)
    throw new ApiError(
      0,
      'No fue posible conectar con el servidor backend. Se activará el modo local de respaldo.'
    );
  }
}
