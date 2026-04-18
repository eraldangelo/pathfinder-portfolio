const normalizeSearchText = (value: unknown) =>
  String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const digitsOnly = (value: unknown) => String(value ?? '').replace(/\D+/g, '');

export const tokenizeSearchTerm = (searchTerm: string) =>
  normalizeSearchText(searchTerm)
    .split(' ')
    .filter(Boolean);

export const matchesSearchTerm = ({
  searchTerm,
  textCandidates,
  numericCandidates = [],
}: {
  searchTerm: string;
  textCandidates: unknown[];
  numericCandidates?: unknown[];
}) => {
  const tokens = tokenizeSearchTerm(searchTerm);
  if (tokens.length === 0) return true;

  const normalizedHaystack = textCandidates
    .map((value) => normalizeSearchText(value))
    .filter(Boolean)
    .join(' ');

  if (normalizedHaystack && tokens.every((token) => normalizedHaystack.includes(token))) {
    return true;
  }

  const normalizedDigitsQuery = digitsOnly(searchTerm);
  if (!normalizedDigitsQuery) return false;

  const numericHaystack = numericCandidates
    .map((value) => digitsOnly(value))
    .filter(Boolean)
    .join(' ');

  return numericHaystack.includes(normalizedDigitsQuery);
};

