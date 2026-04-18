const { normalizeSpace } = require('./valueUtils.cjs');

const parseArgs = () => {
  const options = {
    file: '',
    sheet: 'Raw Data',
    apply: false,
    dryRun: true,
    limit: Number.POSITIVE_INFINITY,
    fromRow: 2,
    batchSize: 300,
    defaultYear: null,
    sampleSize: 10,
    excludeNames: [],
    duplicateReport: '',
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === '--apply') { options.apply = true; options.dryRun = false; continue; }
    if (arg === '--dry-run') { options.apply = false; options.dryRun = true; continue; }
    if (arg.startsWith('--file=')) { options.file = arg.split('=')[1] || ''; continue; }
    if (arg.startsWith('--sheet=')) { options.sheet = arg.split('=')[1] || 'Raw Data'; continue; }
    if (arg.startsWith('--limit=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) options.limit = Math.floor(value);
      continue;
    }
    if (arg.startsWith('--from-row=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value >= 2) options.fromRow = Math.floor(value);
      continue;
    }
    if (arg.startsWith('--batch-size=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) options.batchSize = Math.floor(value);
      continue;
    }
    if (arg.startsWith('--default-year=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value >= 2000) options.defaultYear = Math.floor(value);
      continue;
    }
    if (arg.startsWith('--sample-size=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) options.sampleSize = Math.floor(value);
      continue;
    }
    if (arg.startsWith('--exclude-name=')) {
      const value = normalizeSpace(arg.split('=')[1] || '');
      if (value) options.excludeNames.push(value);
      continue;
    }
    if (arg.startsWith('--exclude-names=')) {
      const value = String(arg.split('=')[1] || '');
      value
        .split('|')
        .map((name) => normalizeSpace(name))
        .filter(Boolean)
        .forEach((name) => options.excludeNames.push(name));
      continue;
    }
    if (arg.startsWith('--duplicate-report=')) {
      const value = String(arg.split('=')[1] || '').trim();
      if (value) options.duplicateReport = value;
      continue;
    }
  }

  if (!options.file) {
    throw new Error('Missing required --file=<path-to-xlsx>');
  }

  return options;
};

module.exports = {
  parseArgs,
};
