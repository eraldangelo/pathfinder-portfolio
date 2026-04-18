const { spawnSync } = require('child_process');

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

run('git', ['config', 'core.hooksPath', '.githooks']);
console.log('Git hooks configured: core.hooksPath=.githooks');

