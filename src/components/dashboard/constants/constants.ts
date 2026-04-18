export const BRANCH_COUNTRY_MAPPING = {
    Manila: 'Philippines',
    Davao: 'Philippines',
    Cebu: 'Philippines',
    Pampanga: 'Philippines',
} as const;

export const COUNTRY_OVERALL_MAPPING = {
    Philippines: 'Philippines Overall',
} as const;

export const COUNTRY_MAP_CONFIG: { [key: string]: { center: [number, number]; zoom: number } } = {
    Philippines: { center: [12.8797, 121.774], zoom: 5 },
};

export const ALL_LOCATION_KEYS = [
    'Overall',
    'Philippines Overall',
    'Cebu',
    'Davao',
    'Manila',
    'Pampanga',
];
