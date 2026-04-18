export const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

export const days = Array.from({ length: 31 }, (_, i) => i + 1);
export const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

export type CountryCodeOption = {
    name: string;
    code: string;
    countryCode?: string;
};

export const countryCodes = [
    {
        name: 'Philippines',
        code: '+63',
        countryCode: 'ph',
    },
    {
        name: 'South Korea',
        code: '+82',
        countryCode: 'kr',
    },
    {
        name: 'China',
        code: '+86',
        countryCode: 'cn',
    },
    {
        name: 'Japan',
        code: '+81',
        countryCode: 'jp',
    },
    {
        name: 'Vietnam',
        code: '+84',
        countryCode: 'vn',
    },
    {
        name: 'Australia',
        code: '+61',
        countryCode: 'au',
    },
] as const satisfies readonly CountryCodeOption[];
