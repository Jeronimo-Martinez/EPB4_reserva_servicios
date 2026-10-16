import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface RecaptchaCheckboxHandle {
  reset: () => void;
}

interface RecaptchaCheckboxProps {
  onToken: (token: string | null) => void;
}

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, params: Record<string, unknown>) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

/**
 * Widget reCAPTCHA v2 Checkbox reutilizable (login + ambos registros).
 * - Render explícito contra el script de index.html (render=explicit).
 * - Notifica el token al padre; en expiración/error limpia el token.
 * - Expone reset() para limpiar tras un error del backend (token de un solo uso).
 */
const RecaptchaCheckbox = forwardRef<RecaptchaCheckboxHandle, RecaptchaCheckboxProps>(
  function RecaptchaCheckbox({ onToken }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);
    const renderedRef = useRef(false);
    // Evita llamadas a onToken tras desmontar (React 19 StrictMode).
    const mountedRef = useRef(true);
    const onTokenRef = useRef(onToken);
    onTokenRef.current = onToken;

    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
      };
    }, []);

    useImperativeHandle(ref, () => ({
      reset: () => {
        onTokenRef.current(null);
        if (window.grecaptcha && widgetIdRef.current !== null) {
          try {
            window.grecaptcha.reset(widgetIdRef.current);
          } catch {
            /* widget aún no listo: solo se limpia el token local */
          }
        }
      },
    }));

    useEffect(() => {
      if (renderedRef.current || !SITE_KEY || !containerRef.current) return;

      let cancelled = false;
      let attempts = 0;

      const tryRender = () => {
        if (cancelled || renderedRef.current) return;
        if (window.grecaptcha && containerRef.current) {
          try {
            widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
              sitekey: SITE_KEY,
              callback: (token: string) => {
                if (mountedRef.current) onTokenRef.current(token || null);
              },
              'expired-callback': () => {
                if (mountedRef.current) onTokenRef.current(null);
              },
              'error-callback': () => {
                if (mountedRef.current) onTokenRef.current(null);
              },
            });
            renderedRef.current = true;
            return;
          } catch {
            /* reintenta abajo si el script aún no está listo */
          }
        }
        attempts += 1;
        if (attempts < 50) setTimeout(tryRender, 200);
      };

      tryRender();
      return () => {
        cancelled = true;
      };
    }, []);

    if (!SITE_KEY) {
      return (
        <div className="rounded-[8px] border border-[#f2bfbb] bg-[#fdf1f0] px-4 py-3">
          <p className="text-[#d94f41] text-[13px] leading-[20px]">
            Falta configurar <strong>VITE_RECAPTCHA_SITE_KEY</strong> en el archivo{' '}
            <strong>.env</strong> del frontend. El formulario queda bloqueado hasta configurarla.
          </p>
        </div>
      );
    }

    return <div ref={containerRef} className="flex justify-start" />;
  }
);

export default RecaptchaCheckbox;
