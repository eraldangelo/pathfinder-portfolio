import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import { signInWithEmailAndPasswordWithAppCheckRecovery } from '@/services/firebase';
import { useTranslation } from '@/contexts/LanguageContext';
import { EyeIcon, EyeOffIcon, LoginIcon } from '../icons/LoginIcons';
import LoginRememberMeRow from '../login/LoginRememberMeRow';
import LoginTurnstileSection from '../login/LoginTurnstileSection';
import { useLoginTurnstile } from '../login/useLoginTurnstile';
import { getPublicEnv } from '@/config/publicClientEnv';
import { IMAGE_LINKS } from '@/config/imageLinks';

interface LoginPageProps {
    showPopup: (message: string) => void;
    setIsLoading: (loading: boolean) => void;
    isReady: boolean;
    authError?: string | null;
    clearAuthError?: () => void;
}

const EXPECTED_AUTH_ERROR_CODES = new Set([
    'auth/api-key-not-valid', 'auth/invalid-api-key', 'auth/firebase-app-check-token-is-invalid',
    'auth/app-check-token-invalid', 'auth/invalid-credential', 'auth/user-not-found',
    'auth/wrong-password', 'auth/too-many-requests',
]);

const LoginPage: React.FC<LoginPageProps> = ({ setIsLoading, isReady, authError, clearAuthError }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(
        () => (typeof window !== 'undefined' ? window.localStorage.getItem('rememberMe') === 'true' : false)
    );
    const [error, setError] = useState<string | null>(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const turnstileSiteKey = getPublicEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY');

    const {
        hasTurnstileKey,
        turnstileContainerRef,
        turnstileClientError,
        turnstileToken,
        turnstileVerified,
        onTurnstileScriptReady,
        resetTurnstile,
    } = useLoginTurnstile(turnstileSiteKey);

    useEffect(() => {
        if (authError) {
            setError(authError);
        }
    }, [authError]);

    useEffect(() => {
        if (rememberMe) {
            const rememberedEmail = localStorage.getItem('rememberedEmail');
            if (rememberedEmail) {
                setEmail(rememberedEmail);
            }
        }
    }, [rememberMe]);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (error || authError) {
            setError(null);
            clearAuthError?.();
        }
    };
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (error || authError) {
            setError(null);
            clearAuthError?.();
        }
    };

    const normalizeAuthErrorCode = (rawError: unknown): string => {
        const candidate = rawError as { code?: unknown; message?: unknown } | null;
        const fromCode = String(candidate?.code || '').trim().toLowerCase().replace(/[.)\]]+$/, '');
        if (fromCode) return fromCode;

        const message = String(candidate?.message || '');
        const bracketMatch = message.match(/\((auth\/[a-z0-9-]+)\.?\)/i);
        if (bracketMatch?.[1]) return bracketMatch[1].trim().toLowerCase();
        const inlineMatch = message.match(/\b(auth\/[a-z0-9-]+)\b/i);
        if (inlineMatch?.[1]) return inlineMatch[1].trim().toLowerCase();
        return '';
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        clearAuthError?.();
        
        if (!email || !password) {
            setError(t('enterEmailPasswordError'));
            return;
        }
        if (!hasTurnstileKey) {
            setError('Turnstile site key is missing or invalid.');
            return;
        }
        if (!turnstileVerified || !turnstileToken) {
            setError('Please complete the captcha before signing in.');
            return;
        }

        setIsLoading(true);

        try {
            const verifyRes = await fetch('/api/turnstile/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: turnstileToken }),
            });
            const verifyData = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok || !verifyData?.ok) {
                setError(verifyData?.message || 'Captcha verification failed. Please retry.');
                resetTurnstile();
                setIsLoading(false);
                return;
            }
            await signInWithEmailAndPasswordWithAppCheckRecovery(email, password);
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            // onAuthStateChanged in App.tsx will handle the rest
        } catch (e) {
            const error = e as any;
            const errorCode = normalizeAuthErrorCode(error);
            const isKnownAuthError = errorCode.startsWith('auth/');
            if (!EXPECTED_AUTH_ERROR_CODES.has(errorCode) && !isKnownAuthError) {
                console.error(errorCode, error?.message);
            }

            if (errorCode === 'auth/api-key-not-valid' || errorCode === 'auth/invalid-api-key') {
                setError(t('apiKeyInvalidError'));
            } else if (errorCode === 'auth/firebase-app-check-token-is-invalid' || errorCode === 'auth/app-check-token-invalid') {
                setError(t('appCheckInvalidError', 'Security verification expired. Please refresh and try again.'));
            } else if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
                setError(t('wrongCredentialsError'));
            } else if (errorCode === 'auth/too-many-requests') {
                 setError(t('tooManyRequestsError'));
            } else {
                setError(t('unexpectedError'));
            }
            setIsLoading(false);
        }
    };

    const canSubmit = hasTurnstileKey && turnstileVerified && !turnstileClientError;
    
    const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setRememberMe(isChecked);
        localStorage.setItem('rememberMe', String(isChecked));
    };

    return (
        <>
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                async
                defer
                onLoad={onTurnstileScriptReady}
                onReady={onTurnstileScriptReady}
            />
            <div className={`flex flex-col items-center transition-all duration-700 ease-out w-full max-w-sm sm:max-w-md px-4 ${isReady ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                <Image
                  src={IMAGE_LINKS.branding.loginLogoLight}
                  alt="Pathfinder"
                  width={640}
                  height={192}
                  priority
                  className="w-64 sm:w-72 h-auto object-contain drop-shadow-2xl mb-2"
                />
                {error && <p data-testid="login-error-message" className="text-red-200 bg-red-900/50 backdrop-blur-sm px-5 py-2 rounded-lg text-sm mt-4 whitespace-pre-line">{error}</p>}
                
                <form data-testid="login-form" onSubmit={handleLogin} noValidate className="w-full max-w-xs mt-5 sm:mt-6 space-y-3">
                    <input
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder={t('emailPlaceholder')}
                        data-testid="login-email-input"
                        required
                        autoComplete="email"
                        className="w-full px-4 py-3 text-base bg-white/40 dark:bg-black/50 backdrop-blur-md border border-gray-400/50 dark:border-white/20 rounded-lg text-[#004097] dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-300/80 outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
                    />
                    <div className="relative flex items-center">
                        <input
                            type={isPasswordVisible ? 'text' : 'password'}
                            value={password}
                            onChange={handlePasswordChange}
                            placeholder={t('passwordPlaceholder')}
                            data-testid="login-password-input"
                            required
                            autoComplete="current-password"
                            className="w-full px-4 py-3 pr-20 text-base bg-white/40 dark:bg-black/50 backdrop-blur-md border border-gray-400/50 dark:border-white/20 rounded-lg text-[#004097] dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-300/80 outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <button 
                                type="button" 
                                onClick={() => setIsPasswordVisible(!isPasswordVisible)} 
                                className="w-10 h-10 flex items-center justify-center text-[#004097]/80 dark:text-white/60"
                                aria-label={isPasswordVisible ? t('hidePassword') : t('showPassword')}
                            >
                                {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                            <button 
                                type="submit" 
                                className="w-10 h-10 flex items-center justify-center text-[#004097]/80 dark:text-white/60 ml-[-0.5rem] disabled:opacity-40 disabled:cursor-not-allowed" 
                                aria-label={t('login')}
                                data-testid="login-submit-button"
                                disabled={!canSubmit}
                            >
                                <LoginIcon />
                            </button>
                        </div>
                    </div>
                </form>
                <LoginTurnstileSection
                    hasTurnstileKey={hasTurnstileKey}
                    turnstileContainerRef={turnstileContainerRef}
                    turnstileClientError={turnstileClientError}
                />
                <LoginRememberMeRow
                    rememberMe={rememberMe}
                    onRememberMeChange={handleRememberMeChange}
                    rememberMeLabel={t('rememberMe')}
                />
            </div>
        </>
    );
};

export default LoginPage;
