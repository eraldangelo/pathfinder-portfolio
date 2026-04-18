const parseArgs = () => {
  const options = {
    apply: false,
    dryRun: true,
    batchSize: 350,
    sampleSize: 20,
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
  }

  return options;
};

module.exports = {
  parseArgs,
};
