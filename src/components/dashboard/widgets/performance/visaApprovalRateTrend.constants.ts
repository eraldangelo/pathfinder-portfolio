export const TREND_COUNTRIES = [
    'All Countries',
    'Australia',
    'Canada',
    'New Zealand',
    'Ireland',
    'Germany',
    'United Kingdom',
    'United States',
] as const;

export type TrendCountry = (typeof TREND_COUNTRIES)[number];

export const COUNTRY_FLAG_CODES: Partial<Record<TrendCountry, string>> = {
    Australia: 'au',
    Canada: 'ca',
    Germany: 'de',
    Ireland: 'ie',
    'New Zealand': 'nz',
    'United States': 'us',
    'United Kingdom': 'gb',
};

export const getCountryFlagCode = (country: TrendCountry) => COUNTRY_FLAG_CODES[country];
