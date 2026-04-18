// scripts/sync-translations.js
// Usage: node scripts/sync-translations.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const translationsPath = path.join(__dirname, '..', 'public', 'i18n', 'translations');
const MASTER_LOCALE = 'en';

const sortObject = (obj) =>
  Object.keys(obj)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const writeJson = (filePath, obj) => {
  fs.writeFileSync(filePath, JSON.stringify(sortObject(obj), null, 2) + '\n', 'utf8');
};

const resolveChunkForKey = (key, availableChunks) => {
  const first = String(key || '').trim().charAt(0).toLowerCase();
  if (!availableChunks.length) return null;

  if (availableChunks.includes('a-b') && first >= 'a' && first <= 'b') return 'a-b';
  if (availableChunks.includes('c-d') && first >= 'c' && first <= 'd') return 'c-d';
  if (availableChunks.includes('e-h') && first >= 'e' && first <= 'h') return 'e-h';
  if (availableChunks.includes('i-l') && first >= 'i' && first <= 'l') return 'i-l';
  if (availableChunks.includes('m-p') && first >= 'm' && first <= 'p') return 'm-p';
  if (availableChunks.includes('q-t') && first >= 'q' && first <= 't') return 'q-t';
  if (availableChunks.includes('u-z')) return 'u-z';

  return availableChunks[0];
};

const readLocale = (locale) => {
  const localeDir = path.join(translationsPath, locale);
  const singleFile = path.join(translationsPath, `${locale}.json`);

  if (fs.existsSync(localeDir) && fs.statSync(localeDir).isDirectory()) {
    const indexPath = path.join(localeDir, 'index.json');
    if (!fs.existsSync(indexPath)) {
      throw new Error(`Missing index.json for locale folder: ${locale}`);
    }

    const index = readJson(indexPath);
    const chunks = Array.isArray(index?.chunks) ? index.chunks : [];
    if (!chunks.length) {
      throw new Error(`Locale folder ${locale} has no chunks in index.json`);
    }

    const dataByChunk = {};
    const merged = {};
    chunks.forEach((chunk) => {
      const chunkPath = path.join(localeDir, `${chunk}.json`);
      const chunkData = fs.existsSync(chunkPath) ? readJson(chunkPath) : {};
      dataByChunk[chunk] = chunkData;
      Object.assign(merged, chunkData);
    });

    return {
      type: 'chunked',
      localeDir,
      chunks,
      dataByChunk,
      merged,
    };
  }

  if (fs.existsSync(singleFile)) {
    return {
      type: 'single',
      singleFile,
      merged: readJson(singleFile),
    };
  }

  throw new Error(`Locale ${locale} not found as folder or json file.`);
};

const writeLocale = (localeInfo) => {
  if (localeInfo.type === 'single') {
    writeJson(localeInfo.singleFile, localeInfo.merged);
    return;
  }

  localeInfo.chunks.forEach((chunk) => {
    const chunkPath = path.join(localeInfo.localeDir, `${chunk}.json`);
    writeJson(chunkPath, localeInfo.dataByChunk[chunk] || {});
  });
};

const syncLocale = (master, localeInfo, localeName) => {
  const missing = [];
  Object.keys(master).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(localeInfo.merged, key)) return;

    if (localeInfo.type === 'single') {
      localeInfo.merged[key] = master[key];
      missing.push(key);
      return;
    }

    const targetChunk = resolveChunkForKey(key, localeInfo.chunks);
    if (!targetChunk) return;
    if (!localeInfo.dataByChunk[targetChunk]) localeInfo.dataByChunk[targetChunk] = {};
    localeInfo.dataByChunk[targetChunk][key] = master[key];
    localeInfo.merged[key] = master[key];
    missing.push(key);
  });

  if (!missing.length) {
    console.log(`- ${localeName}: already up to date`);
    return false;
  }

  writeLocale(localeInfo);
  console.log(`- ${localeName}: added ${missing.length} missing key(s)`);
  return true;
};

const main = () => {
  console.log('Starting translation synchronization...');

  if (!fs.existsSync(translationsPath)) {
    throw new Error(`Translations path not found: ${translationsPath}`);
  }

  const masterLocale = readLocale(MASTER_LOCALE);
  const masterData = masterLocale.merged;

  const localeFolders = fs
    .readdirSync(translationsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name !== MASTER_LOCALE);

  const localeFiles = fs
    .readdirSync(translationsPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name.replace(/\.json$/, ''))
    .filter((name) => name !== MASTER_LOCALE);

  const locales = [...new Set([...localeFolders, ...localeFiles])];
  if (!locales.length) {
    console.log('No additional locales found. Nothing to sync.');
    return;
  }

  let updatedCount = 0;
  locales.forEach((locale) => {
    const localeInfo = readLocale(locale);
    if (syncLocale(masterData, localeInfo, locale)) {
      updatedCount += 1;
    }
  });

  console.log(`Synchronization complete. Updated locales: ${updatedCount}/${locales.length}`);
};

main();
