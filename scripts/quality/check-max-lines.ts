import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const MAX_LINES = 250;
const ROOTS = ['src', 'scripts', 'e2e', 'functions'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.md']);
const IGNORED_DIRS = new Set(['node_modules', '.next', '.git', 'test-results']);
const MAX_LINES_BY_PATH: Record<string, number> = {
  'functions/index.js': 400,
  'src/components/dashboard/widgets/performance/VisaApprovalRateTrend.tsx': 300,
  'src/components/dashboard/hooks/metrics/trendMetrics.ts': 280,
  'src/components/app/hooks/useAppController.ts': 160,
  'src/components/dashboard/hooks/useDashboardDownloads.ts': 260,
};

const hasSupportedExtension = (filePath: string) =>
  Array.from(EXTENSIONS).some((extension) => filePath.endsWith(extension));

const getLineCount = (filePath: string) => readFileSync(filePath, 'utf8').split(/\r?\n/).length;

const normalizeRelativePath = (relativePath: string) => relativePath.replace(/\\/g, '/');

const resolveLineLimit = (relativePath: string) =>
  MAX_LINES_BY_PATH[normalizeRelativePath(relativePath)] ?? MAX_LINES;

const scan = (
  basePath: string,
  offenders: Array<{ path: string; lines: number; limit: number }>,
) => {
  for (const entry of readdirSync(basePath)) {
    const entryPath = join(basePath, entry);
    const stats = statSync(entryPath);
    if (stats.isDirectory()) {
      if (IGNORED_DIRS.has(entry)) continue;
      scan(entryPath, offenders);
      continue;
    }
    if (!hasSupportedExtension(entryPath)) continue;
    const lines = getLineCount(entryPath);
    const relativePath = relative(process.cwd(), entryPath);
    const limit = resolveLineLimit(relativePath);
    if (lines > limit) {
      offenders.push({ path: relativePath, lines, limit });
    }
  }
};

const main = () => {
  const offenders: Array<{ path: string; lines: number; limit: number }> = [];
  ROOTS.forEach((root) => {
    if (!existsSync(root)) return;
    scan(root, offenders);
  });

  if (offenders.length === 0) {
    console.log(`PASS - all tracked source/test files satisfy max-lines limits (default: ${MAX_LINES}).`);
    return;
  }

  console.error(`FAIL - found ${offenders.length} file(s) over the configured max-lines limit:`);
  offenders
    .sort((a, b) => b.lines - a.lines)
    .forEach((offender) => console.error(`${offender.lines}/${offender.limit}\t${offender.path}`));
  process.exit(1);
};

main();
