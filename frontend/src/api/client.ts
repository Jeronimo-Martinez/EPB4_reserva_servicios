export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
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
