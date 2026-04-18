import { allSchools } from '../src/data/schools/schools';
import { getSchoolDetails } from '../src/data/schools/school-details';
import { getSchoolPrograms } from '../src/data/schools/school-programs';

type CliOptions = {
  apply: boolean;
  collection: string;
  limit: number | null;
};

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  const getValue = (flag: string) => {
    const index = args.indexOf(flag);
    if (index < 0 || index + 1 >= args.length) return null;
    return args[index + 1];
  };

  const apply = args.includes('--apply');
  const collection = (getValue('--collection') || 'educationProviders').trim();
  const limitValue = getValue('--limit');
  const parsedLimit = limitValue ? Number(limitValue) : null;
  const limit = Number.isInteger(parsedLimit) && parsedLimit && parsedLimit > 0 ? parsedLimit : null;

  return { apply, collection, limit };
};

const splitPrograms = (value: string | undefined) =>
  value
    ? value
        .split(';')
        .map((program) => program.trim())
        .filter(Boolean)
    : [];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);

const buildProviderId = (country: string, name: string) => {
  const countrySlug = slugify(country);
  const nameSlug = slugify(name);
  return `${countrySlug}--${nameSlug}`;
};

type EducationProviderSeed = {
  id: string;
  name: string;
  country: string;
  domain: string | null;
  logoUrl: string | null;
  website: string | null;
  intakes: string | null;
  generalPrograms: string[];
  popularPrograms: string[];
  isActive: boolean;
  source: string;
};

const buildSeedData = (): EducationProviderSeed[] => {
  const seenIds = new Map<string, number>();

  return allSchools.map((school) => {
    const details = getSchoolDetails(school.name);
    const programs = getSchoolPrograms(school.name);
    const baseId = buildProviderId(school.country, school.name);
    const duplicates = seenIds.get(baseId) || 0;
    seenIds.set(baseId, duplicates + 1);
    const id = duplicates === 0 ? baseId : `${baseId}-${duplicates + 1}`;

    return {
      id,
      name: school.name,
      country: school.country,
      domain: school.domain ?? null,
      logoUrl: school.logoUrl ?? null,
      website: details.website || (school.domain ? `https://${school.domain}` : null),
      intakes: details.intakes ?? null,
      generalPrograms: splitPrograms(programs.general),
      popularPrograms: splitPrograms(programs.popular),
      isActive: true,
      source: 'legacy-hardcoded-seed',
    };
  });
};

const main = async () => {
  const options = parseArgs();
  const seedData = buildSeedData();
  const targetData = options.limit ? seedData.slice(0, options.limit) : seedData;

  if (!options.apply) {
    console.log('Dry run only. No Firestore writes were executed.');
    console.log(`Collection: ${options.collection}`);
    console.log(`Providers prepared: ${targetData.length}`);
    targetData.slice(0, 10).forEach((provider) => {
      console.log(`- ${provider.id} :: ${provider.name} (${provider.country})`);
    });
    console.log("Run with '--apply' to write documents.");
    return;
  }

  const firebaseAdminUtils = await import('./config/firebase-admin-utils.cjs');
  const { admin, getFirestore } = firebaseAdminUtils;
  const firestore = getFirestore();
  const batchSize = 400;

  let batch = firestore.batch();
  let pendingOps = 0;
  let commits = 0;

  for (const provider of targetData) {
    const ref = firestore.collection(options.collection).doc(provider.id);
    batch.set(
      ref,
      {
        ...provider,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    pendingOps += 1;

    if (pendingOps >= batchSize) {
      await batch.commit();
      commits += 1;
      batch = firestore.batch();
      pendingOps = 0;
    }
  }

  if (pendingOps > 0) {
    await batch.commit();
    commits += 1;
  }

  console.log(`Migration complete. Wrote ${targetData.length} education providers in ${commits} batch(es).`);
};

main().catch((error) => {
  console.error('Education provider migration failed:', error);
  process.exit(1);
});
