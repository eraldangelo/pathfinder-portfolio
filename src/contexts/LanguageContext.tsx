import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

// Define the shape of the context
interface LanguageContextType {
    locale: string;
    setLocale: (locale: string) => void;
    // FIX: Updated `t` function signature to allow a string as a fallback value.
    t: (key: string, options?: { [key: string]: string | number } | string) => string;
}

// FIX: Added country codes to the language map to support flag icons in the UI.
export const languageFullDataMap: { [key: string]: { native: string; english: string; countryCode: string; } } = {
  'en': { native: 'English (United States)', english: 'English (United States)', countryCode: 'us' },
  'en-AU': { native: 'English (Australia)', english: 'English (Australia)', countryCode: 'au' },
  'zh-CN': { native: '????', english: 'Simplified Chinese', countryCode: 'cn' },
  'zh-TW': { native: '????', english: 'Traditional Chinese', countryCode: 'tw' },
  'ja': { native: '???', english: 'Japanese', countryCode: 'jp' },
  'ko': { native: '???', english: 'Korean', countryCode: 'kr' },
  'vi': { native: 'Ti?ng Vi?t', english: 'Vietnamese', countryCode: 'vn' },
  'th': { native: '???????', english: 'Thai', countryCode: 'th' },
};

// Create the context with a default value
const LanguageContext = createContext<LanguageContextType>({
    locale: 'en',
    setLocale: () => console.warn('setLocale function not ready'),
    t: (key) => key,
});

const humanizeMissingTranslationKey = (key: string) => {
    const withoutBrandPrefix = key.replace(/^pathfinder[-_\s]*/i, '');
    const spaced = withoutBrandPrefix
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .trim();

    if (!spaced) return 'Label';
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

// The provider component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocaleState] = useState<string>(() => {
        if (typeof window === 'undefined') {
            return 'en';
        }
        // Try to get locale from localStorage, fallback to browser language, then to 'en'
        const savedLocale = window.localStorage.getItem('locale');
        if (savedLocale) return savedLocale;

        const browserLang = window.navigator.language;
        if (browserLang.startsWith('zh')) {
            if (browserLang.match(/TW|HK|MO|Hant/i)) return 'zh-TW';
            return 'zh-CN';
        }
        if (browserLang.startsWith('ja')) return 'ja';
        if (browserLang.startsWith('ko')) return 'ko';
        if (browserLang.startsWith('vi')) return 'vi';
        if (browserLang.startsWith('th')) return 'th';
        if (browserLang.startsWith('en-AU')) return 'en-AU';

        return 'en';
    });
    const [translations, setTranslations] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadTranslations = async (lang: string) => {
            setIsLoading(true);
            let loadedData = null;

            const fetchJson = async (filePath: string) => {
                try {
                    const response = await fetch(filePath);
                    if (response.ok) {
                        const contentType = response.headers.get('content-type') ?? '';
                        if (!contentType.includes('application/json')) {
                            return null;
                        }
                        return await response.json();
                    }
                    return null;
                } catch {
                    return null;
                }
            };

            const fetchTranslation = async (localeCode: string) => {
                const index = await fetchJson(`/i18n/translations/${localeCode}/index.json`);
                const chunks = Array.isArray(index?.chunks) ? index.chunks : Array.isArray(index?.files) ? index.files : null;
                if (!chunks || !chunks.length) {
                    const direct = await fetchJson(`/i18n/translations/${localeCode}.json`);
                    if (direct) {
                        return direct;
                    }
                    return null;
                }

                const parts = await Promise.all(
                    chunks.map((chunk: string) => fetchJson(`/i18n/translations/${localeCode}/${chunk}.json`))
                );
                const merged: { [key: string]: string } = {};
                parts.forEach((part) => {
                    if (part && typeof part === 'object') {
                        Object.assign(merged, part);
                    }
                });
                return Object.keys(merged).length ? merged : null;
            };

            loadedData = await fetchTranslation(lang);

            // Fallback for regional dialects (e.g., en-AU -> en, zh-TW -> zh)
            if (!loadedData && lang.includes('-')) {
                const baseLang = lang.split('-')[0];
                console.log(`Translation for "${lang}" not found, trying base language "${baseLang}".`);
                loadedData = await fetchTranslation(baseLang);
            }

            // Fallback to English if all else fails
            if (!loadedData && lang !== 'en') {
                console.warn(`Translation for "${lang}" not found. Falling back to English.`);
                loadedData = await fetchTranslation('en');
            }

            if (loadedData) {
                setTranslations(loadedData);
            } else {
                console.error('Could not load any translation files, not even English fallback.');
                setTranslations({}); // Set to empty to avoid using stale data
            }

            setIsLoading(false);
        };

        loadTranslations(locale);
    }, [locale]);

    const setLocale = (newLocale: string) => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('locale', newLocale);
        }
        setLocaleState(newLocale);
    };

    // FIX: Updated `t` function implementation to handle a string fallback value.
    const t = useCallback((key: string, options?: { [key: string]: string | number } | string): string => {
        let translation = translations[key];

        if (!translation) {
            if (typeof options === 'string') {
                return options; // Use the provided string as a fallback.
            }
            // Fall back to a readable label and strip legacy brand-prefixed keys.
            translation = humanizeMissingTranslationKey(key);
        }

        if (options && typeof options === 'object') {
            Object.keys(options).forEach(optionKey => {
                const regex = new RegExp(`{{${optionKey}}}`, 'g');
                translation = translation.replace(regex, String(options[optionKey]));
            });
        }
        return translation;
    }, [translations]);

    const value = {
        locale,
        setLocale,
        t,
    };

    // Render a global spinner instead of null to prevent race conditions on initial load.
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

// Custom hook for easy consumption
export const useTranslation = () => useContext(LanguageContext);
