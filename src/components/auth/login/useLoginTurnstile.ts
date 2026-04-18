import { useCallback, useEffect, useRef, useState } from 'react';

export type TurnstileWidgetId = string | number;

export type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: 'auto' | 'light' | 'dark';
      action?: string;
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: (errorCode?: string) => void;
    }
  ) => TurnstileWidgetId;
  reset?: (widgetId?: TurnstileWidgetId) => void;
  remove?: (widgetId: TurnstileWidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const useLoginTurnstile = (siteKey?: string) => {
  const hasTurnstileKey = Boolean(siteKey && siteKey !== 'your_site_key');
  const [turnstileScriptReady, setTurnstileScriptReady] = useState(false);
  const [turnstileClientError, setTurnstileClientError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileVerified, setTurnstileVerified] = useState(false);
  const [turnstileTheme, setTurnstileTheme] = useState<'light' | 'dark'>('light');
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<TurnstileWidgetId | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    const resolveTheme = () => (root.classList.contains('dark') ? 'dark' : 'light');
    setTurnstileTheme(resolveTheme());
    const observer = new MutationObserver(() => {
      setTurnstileTheme(resolveTheme());
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (turnstileWidgetIdRef.current !== null && typeof window !== 'undefined' && window.turnstile?.remove) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (turnstileWidgetIdRef.current !== null && typeof window !== 'undefined' && window.turnstile?.remove) {
      window.turnstile.remove(turnstileWidgetIdRef.current);
      turnstileWidgetIdRef.current = null;
    }
    setTurnstileVerified(false);
    setTurnstileToken('');
  }, [turnstileTheme]);

  useEffect(() => {
    if (
      !turnstileScriptReady
      || !hasTurnstileKey
      || !siteKey
      || !turnstileContainerRef.current
      || typeof window === 'undefined'
      || !window.turnstile
      || turnstileWidgetIdRef.current !== null
    ) {
      return;
    }

    turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: siteKey,
      theme: turnstileTheme,
      action: 'login',
      callback: (token: string) => {
        if (token && token.trim().length > 0) {
          setTurnstileToken(token.trim());
          setTurnstileVerified(true);
          setTurnstileClientError(null);
        }
      },
      'expired-callback': () => {
        setTurnstileVerified(false);
        setTurnstileToken('');
        setTurnstileClientError('Captcha expired. Please retry.');
      },
      'error-callback': (errorCode?: string) => {
        setTurnstileVerified(false);
        setTurnstileToken('');
        if (errorCode?.startsWith('110200')) {
          setTurnstileClientError(
            'Turnstile domain is not authorized for this site key. Add this domain to allowed hostnames in Cloudflare.'
          );
          return;
        }
        setTurnstileClientError(`Turnstile failed to load (${errorCode ?? 'unknown error'}).`);
      },
    });
  }, [turnstileScriptReady, hasTurnstileKey, siteKey, turnstileTheme]);

  const onTurnstileScriptReady = useCallback(() => {
    setTurnstileScriptReady(true);
  }, []);

  const resetTurnstile = useCallback(() => {
    setTurnstileVerified(false);
    setTurnstileToken('');
    if (typeof window !== 'undefined' && window.turnstile && turnstileWidgetIdRef.current !== null) {
      window.turnstile.reset?.(turnstileWidgetIdRef.current);
    }
  }, []);

  return {
    hasTurnstileKey,
    turnstileContainerRef,
    turnstileClientError,
    turnstileToken,
    turnstileVerified,
    onTurnstileScriptReady,
    resetTurnstile,
  };
};
