import { z } from 'zod';

export type LocationRequestItem = {
  key: string;
  query: string;
};

export type GeocodeResult = {
  lat: number;
  lng: number;
  country: string;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9,\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const LOCATION_QUERY_ALIASES: Record<string, string> = {
  'general sasntos city': 'General Santos City',
  'general santons city': 'General Santos City',
  gensan: 'General Santos City',
  'quezon city,comonwealth': 'Quezon City, Commonwealth',
  'quezon city, comonwealth': 'Quezon City, Commonwealth',
  'quezon city metro manila': 'Quezon City, Metro Manila',
  'san fernando pampanga': 'San Fernando, Pampanga',
  'sanfernanfo, pampanga': 'San Fernando, Pampanga',
  'sanfernanfo pampanga': 'San Fernando, Pampanga',
  'city of san fernando, pampanga': 'San Fernando, Pampanga',
  'angeles city, pampanga.': 'Angeles City, Pampanga',
  'angeles, pampanga': 'Angeles City, Pampanga',
  'pampanga, anglese city': 'Angeles City, Pampanga',
  'davao city, davao del sur': 'Davao City',
  'davao city': 'Davao City',
  'quezon city': 'Quezon City',
  'digos city, davao del sur': 'Digos City',
  'lipa batangas': 'Lipa, Batangas',
  'puerto princesa': 'Puerto Princesa, Palawan',
  'puerto princesa city': 'Puerto Princesa, Palawan',
  'puerto princesa city, palawan': 'Puerto Princesa, Palawan',
  'puerta princesa': 'Puerto Princesa, Palawan',
  'el nido palawan': 'El Nido, Palawan',
  'aborlan palawan': 'Aborlan, Palawan',
  'alcala pangasinan': 'Alcala, Pangasinan',
  'alcala, pangasinan': 'Alcala, Pangasinan',
  'pulilan bulacan': 'Pulilan, Bulacan',
  'negroa oriental': 'Negros Oriental',
  'baguio city benguet': 'Baguio City, Benguet',
  'metro manila': 'Manila',
  'sto tomas pampanga': 'Santo Tomas, Pampanga',
  'sto.tomas pampanga': 'Santo Tomas, Pampanga',
  'santo tomas pampanga': 'Santo Tomas, Pampanga',
  santotomas: 'Santo Tomas',
  'santotomas pampanga': 'Santo Tomas, Pampanga',
  'porac, pampang': 'Porac, Pampanga',
  'cabantian, davao coty': 'Cabantian, Davao City',
  cdo: 'Cagayan de Oro City',
  'cagayan de oro': 'Cagayan de Oro City',
  zambonga: 'Zamboanga',
  tundo: 'Tondo',
  'culbertson, mt 59218, usa': 'Culbertson, Montana, USA',
  'culbertson, montana, usa': 'Culbertson, Montana, USA',
  mondana: 'Montana',
  'dubai uae': 'Dubai, United Arab Emirates',
  'dubai, uae': 'Dubai, United Arab Emirates',
  'abu dhabi, uae': 'Abu Dhabi, United Arab Emirates',
  'abu dhabi united arab emirates': 'Abu Dhabi, United Arab Emirates',
  'united arab emirates dubai': 'Dubai, United Arab Emirates',
};

const KNOWN_PH_LOCATION_FALLBACKS: Array<{
  matcher: string | RegExp;
  result: GeocodeResult;
}> = [
  { matcher: /^manila$/, result: { lat: 14.5904492, lng: 120.9803621, country: 'Philippines' } },
  { matcher: /makati/, result: { lat: 14.554729, lng: 121.0244452, country: 'Philippines' } },
  { matcher: /quezon city/, result: { lat: 14.6760413, lng: 121.0437003, country: 'Philippines' } },
  { matcher: /taguig/, result: { lat: 14.5176184, lng: 121.0508645, country: 'Philippines' } },
  { matcher: /pasig/, result: { lat: 14.5763768, lng: 121.0851097, country: 'Philippines' } },
  { matcher: /pasay/, result: { lat: 14.5377516, lng: 120.9893138, country: 'Philippines' } },
  { matcher: /metro manila/, result: { lat: 14.5904492, lng: 120.9803621, country: 'Philippines' } },
  { matcher: /tondo/, result: { lat: 14.6171889, lng: 120.9668448, country: 'Philippines' } },
  { matcher: /^cebu$/, result: { lat: 10.2934946, lng: 123.9018183, country: 'Philippines' } },
  { matcher: /cebu city/, result: { lat: 10.2934946, lng: 123.9018183, country: 'Philippines' } },
  { matcher: /^davao$/, result: { lat: 7.0707155, lng: 125.6088173, country: 'Philippines' } },
  { matcher: /davao city/, result: { lat: 7.0707155, lng: 125.6088173, country: 'Philippines' } },
  { matcher: /^pampanga$/, result: { lat: 15.079409, lng: 120.6199895, country: 'Philippines' } },
  { matcher: /angeles city/, result: { lat: 15.1389351, lng: 120.5875321, country: 'Philippines' } },
  { matcher: /san fernando, pampanga/, result: { lat: 15.0355021, lng: 120.6896567, country: 'Philippines' } },
  { matcher: /mabalacat/, result: { lat: 15.22303, lng: 120.57109, country: 'Philippines' } },
  { matcher: /mexico, pampanga/, result: { lat: 15.0637078, lng: 120.7199815, country: 'Philippines' } },
  { matcher: /alcala[, ]+pangasinan/, result: { lat: 15.8479, lng: 120.5217, country: 'Philippines' } },
  { matcher: /general santos city/, result: { lat: 6.1122217, lng: 125.1721893, country: 'Philippines' } },
  { matcher: /baguio city/, result: { lat: 16.4023335, lng: 120.5960076, country: 'Philippines' } },
  { matcher: /bacolod city/, result: { lat: 10.6712982, lng: 122.9513363, country: 'Philippines' } },
  { matcher: /general trias, cavite/, result: { lat: 14.3214092, lng: 120.9073045, country: 'Philippines' } },
  { matcher: /dasmar.*cavite/, result: { lat: 14.3294444, lng: 120.9366667, country: 'Philippines' } },
  { matcher: /bacoor.*cavite/, result: { lat: 14.4624129, lng: 120.9643984, country: 'Philippines' } },
  { matcher: /lipa( city)?[, ]+batangas/, result: { lat: 13.9411, lng: 121.1622, country: 'Philippines' } },
  { matcher: /^palawan$/, result: { lat: 9.8349493, lng: 118.7383616, country: 'Philippines' } },
  { matcher: /puerto princesa( city)?[, ]+palawan/, result: { lat: 9.7391405, lng: 118.7352778, country: 'Philippines' } },
  { matcher: /el nido[, ]+palawan/, result: { lat: 11.2027449, lng: 119.4172387, country: 'Philippines' } },
  { matcher: /aborlan[, ]+palawan/, result: { lat: 9.455, lng: 118.55, country: 'Philippines' } },
  { matcher: /cagayan de oro city/, result: { lat: 8.4542363, lng: 124.6318977, country: 'Philippines' } },
  { matcher: /^cagayan de oro$/, result: { lat: 8.4542363, lng: 124.6318977, country: 'Philippines' } },
  { matcher: /^cdo$/, result: { lat: 8.4542363, lng: 124.6318977, country: 'Philippines' } },
  { matcher: /butuan city/, result: { lat: 8.9475378, lng: 125.5406234, country: 'Philippines' } },
  { matcher: /cainta[, ]+rizal/, result: { lat: 14.5750663, lng: 121.1225216, country: 'Philippines' } },
  { matcher: /^digos city$/, result: { lat: 6.7496114, lng: 125.3572183, country: 'Philippines' } },
  { matcher: /^leyte$/, result: { lat: 11.0487227, lng: 124.4641848, country: 'Philippines' } },
  { matcher: /taytay[, ]+rizal/, result: { lat: 14.5583778, lng: 121.1321158, country: 'Philippines' } },
  { matcher: /^valenzuela( city)?$/, result: { lat: 14.7005964, lng: 120.9830588, country: 'Philippines' } },
  { matcher: /gapan( city)?[, ]+nueva ecija/, result: { lat: 15.307577, lng: 120.946957, country: 'Philippines' } },
  { matcher: /taal[, ]+batangas/, result: { lat: 13.8798776, lng: 120.9236542, country: 'Philippines' } },
  { matcher: /bongabon[, ]+nueva ecija/, result: { lat: 15.6312968, lng: 121.1395555, country: 'Philippines' } },
  { matcher: /magalang[, ]+pampanga/, result: { lat: 15.2117, lng: 120.6592, country: 'Philippines' } },
  { matcher: /porac[, ]+pampanga/, result: { lat: 15.0718, lng: 120.5423, country: 'Philippines' } },
  { matcher: /laoag city[, ]+ilocos norte/, result: { lat: 18.197777, lng: 120.595556, country: 'Philippines' } },
  { matcher: /floridablanca[, ]+pampanga/, result: { lat: 14.9761125, lng: 120.4903813, country: 'Philippines' } },
  { matcher: /zamboanga/, result: { lat: 6.9214424, lng: 122.0790267, country: 'Philippines' } },
  { matcher: /^saudi arabia$/, result: { lat: 23.885942, lng: 45.079162, country: 'Saudi Arabia' } },
  { matcher: /^uae$/, result: { lat: 23.424076, lng: 53.847818, country: 'United Arab Emirates' } },
  { matcher: /united arab emirates/, result: { lat: 23.424076, lng: 53.847818, country: 'United Arab Emirates' } },
  { matcher: /dubai/, result: { lat: 25.2048493, lng: 55.2707828, country: 'United Arab Emirates' } },
  { matcher: /abu dhabi/, result: { lat: 24.453884, lng: 54.3773438, country: 'United Arab Emirates' } },
  { matcher: /^japan$/, result: { lat: 36.204824, lng: 138.252924, country: 'Japan' } },
  { matcher: /tokyo/, result: { lat: 35.6764225, lng: 139.650027, country: 'Japan' } },
  { matcher: /^australia$/, result: { lat: -25.274398, lng: 133.775136, country: 'Australia' } },
  { matcher: /perth/, result: { lat: -31.9523123, lng: 115.861309, country: 'Australia' } },
  { matcher: /qatar/, result: { lat: 25.354826, lng: 51.183884, country: 'Qatar' } },
  { matcher: /doha/, result: { lat: 25.2854473, lng: 51.5310398, country: 'Qatar' } },
];

const locationRequestItemSchema = z.object({
  key: z.string().trim().min(1).max(120),
  query: z.string().trim().min(1).max(240),
});

export const locationRequestBodySchema = z.object({
  locations: z.array(z.unknown()).max(200),
});

export const isInPhilippinesBounds = (lat: number, lng: number) =>
  lat >= 4.2 &&
  lat <= 21.8 &&
  lng >= 116.0 &&
  lng <= 127.3;

export const resolveAliasQuery = (query: string) => {
  const normalized = normalize(query);
  return LOCATION_QUERY_ALIASES[normalized] ?? query;
};

export const resolveKnownPhilippineFallback = (query: string): GeocodeResult | null => {
  const normalized = normalize(query);
  const matched = KNOWN_PH_LOCATION_FALLBACKS.find((entry) => {
    if (typeof entry.matcher === 'string') {
      return normalized === entry.matcher || normalized.includes(entry.matcher);
    }
    return entry.matcher.test(normalized);
  });
  return matched?.result ?? null;
};

export const parseLocationRequestPayload = (value: unknown): LocationRequestItem[] => {
  const parsed = locationRequestBodySchema.safeParse(value);
  if (!parsed.success) return [];
  return parsed.data.locations
    .map((item) => locationRequestItemSchema.safeParse(item))
    .filter((item) => item.success)
    .map((item) => item.data);
};
