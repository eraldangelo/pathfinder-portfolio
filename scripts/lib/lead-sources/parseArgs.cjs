const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    apply: false,
    dryRun: true,
    limit: Number.POSITIVE_INFINITY,
    pageSize: 500,
    batchSize: 400,
    sampleSize: 20,
    branch: null,
    activeOnly: false,
  };

  for (const arg of args) {
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
    if (arg.startsWith('--limit=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) options.limit = value;
      continue;
    }
    if (arg.startsWith('--page-size=')) {
      const value = Number(arg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) options.pageSize = Math.floor(value);
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
    if (arg.startsWith('--branch=')) {
      const value = arg.split('=')[1];
      options.branch = value ? String(value).trim() : null;
      continue;
    }
    if (arg === '--active-only') {
      options.activeOnly = true;
      continue;
    }
  }

  return options;
};

module.exports = {
  parseArgs,
};
