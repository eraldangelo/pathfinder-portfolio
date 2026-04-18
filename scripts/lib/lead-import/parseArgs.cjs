const parseArgs = () => {
  const options = {
    file: '',
    sheet: 'Raw Data',
    apply: false,
    dryRun: true,
    fromRow: 2,
    limit: Number.POSITIVE_INFINITY,
    batchSize: 300,
    sampleSize: 10,
    duplicateReport: '',
    includeExisting: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === '--apply') {
      options.apply = true;
      options.dryRun = false;
      continue;
    }
    if (arg === '--dry-run') {
      options.apply = false;
      options.dryRun = true;
      continue;
    }
    if (arg.startsWith('--file=')) {
      options.file = arg.split('=')[1] || '';
      continue;
    }
    if (arg.startsWith('--sheet=')) {
      options.sheet = arg.split('=')[1] || 'Raw Data';
      continue;
    }
    if (arg.startsWith('--from-row=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value >= 2) options.fromRow = Math.floor(value);
      continue;
    }
    if (arg.startsWith('--limit=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) options.limit = Math.floor(value);
      continue;
    }
    if (arg.startsWith('--batch-size=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) options.batchSize = Math.floor(value);
      continue;
    }
    if (arg.startsWith('--sample-size=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) options.sampleSize = Math.floor(value);
      continue;
    }
    if (arg.startsWith('--duplicate-report=')) {
      const value = String(arg.split('=')[1] || '').trim();
      if (value) options.duplicateReport = value;
      continue;
    }
    if (arg === '--include-existing') {
      options.includeExisting = true;
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
