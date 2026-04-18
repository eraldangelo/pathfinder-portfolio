#!/usr/bin/env node
const { getFirestore } = require('./config/firebase-admin-utils.cjs');

const normalizeValue = (value) => String(value || '').trim().toLowerCase();

const normalizeApprovalBranchKey = (branch) => {
  const normalized = normalizeValue(branch);
  if (!normalized) return '';
  if (normalized.includes('makati') || normalized.includes('manila')) return 'manila';
  if (normalized.includes('davao')) return 'davao';
  if (normalized.includes('cebu')) return 'cebu';
  if (normalized.includes('pampanga')) return 'pampanga';
  return '';
};

const normalizeApprovalRoleKey = (role) => {
  const normalized = normalizeValue(role);
  if (!normalized) return '';
  if (normalized === 'operations') return 'operations';
  if (normalized === 'branch manager') return 'branch manager';
  if (normalized === 'developer' || normalized.startsWith('developer (')) return 'developer';
  return '';
};

const parseOptions = (argv) => ({
  apply: argv.includes('--apply'),
  verify: argv.includes('--verify') || argv.includes('--report'),
  strict: argv.includes('--strict'),
});

const chunk = (list, size) => {
  const output = [];
  for (let index = 0; index < list.length; index += size) {
    output.push(list.slice(index, index + size));
  }
  return output;
};

const hasChanged = (before, after) =>
  before.approvalBranchKey !== after.approvalBranchKey
  || before.approvalRoleKey !== after.approvalRoleKey
  || before.canApproveBranchChange !== after.canApproveBranchChange
  || before.isActive !== after.isActive;

const createMetrics = () => ({
  scanned: 0,
  missingApprovalBranchKey: 0,
  missingApprovalRoleKey: 0,
  missingApproverCanApprove: 0,
  activeCount: 0,
  inactiveCount: 0,
  unknownActiveCount: 0,
  updatesNeeded: 0,
});

const printMetrics = (metrics) => {
  console.log(`[personnel-approval-backfill] scanned: ${metrics.scanned}`);
  console.log(`[personnel-approval-backfill] missing approvalBranchKey: ${metrics.missingApprovalBranchKey}`);
  console.log(`[personnel-approval-backfill] missing approvalRoleKey: ${metrics.missingApprovalRoleKey}`);
  console.log(
    `[personnel-approval-backfill] potential approvers missing canApproveBranchChange: ${metrics.missingApproverCanApprove}`
  );
  console.log(`[personnel-approval-backfill] active personnel: ${metrics.activeCount}`);
  console.log(`[personnel-approval-backfill] inactive personnel: ${metrics.inactiveCount}`);
  console.log(`[personnel-approval-backfill] unknown isActive personnel: ${metrics.unknownActiveCount}`);
  console.log(`[personnel-approval-backfill] updates needed: ${metrics.updatesNeeded}`);
};

const hasIncompleteCoverage = (metrics) =>
  metrics.missingApprovalBranchKey > 0
  || metrics.missingApprovalRoleKey > 0
  || metrics.missingApproverCanApprove > 0
  || metrics.unknownActiveCount > 0;

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const db = getFirestore();

  const snapshot = await db.collection('personnel').get();
  const updates = [];
  const metrics = createMetrics();

  snapshot.docs.forEach((doc) => {
    metrics.scanned += 1;

    const data = doc.data() || {};
    const currentApprovalBranchKey =
      typeof data.approvalBranchKey === 'string' ? data.approvalBranchKey.trim() : '';
    const currentApprovalRoleKey =
      typeof data.approvalRoleKey === 'string' ? data.approvalRoleKey.trim() : '';
    const currentCanApproveBranchChange =
      typeof data.canApproveBranchChange === 'boolean' ? data.canApproveBranchChange : null;
    const currentIsActive = typeof data.isActive === 'boolean' ? data.isActive : null;

    if (!currentApprovalBranchKey) metrics.missingApprovalBranchKey += 1;
    if (!currentApprovalRoleKey) metrics.missingApprovalRoleKey += 1;
    if (currentIsActive === true) metrics.activeCount += 1;
    if (currentIsActive === false) metrics.inactiveCount += 1;
    if (currentIsActive == null) metrics.unknownActiveCount += 1;

    const approvalRoleKey = normalizeApprovalRoleKey(data.role);
    const approvalBranchKey = normalizeApprovalBranchKey(data.branch);
    const canApproveBranchChange =
      approvalRoleKey === 'operations'
      || approvalRoleKey === 'branch manager'
      || approvalRoleKey === 'developer';
    const isActive = typeof data.isActive === 'boolean' ? data.isActive : true;

    if (canApproveBranchChange && currentCanApproveBranchChange !== true) {
      metrics.missingApproverCanApprove += 1;
    }

    const current = {
      approvalBranchKey: currentApprovalBranchKey,
      approvalRoleKey: currentApprovalRoleKey,
      canApproveBranchChange: currentCanApproveBranchChange,
      isActive: currentIsActive,
    };
    const next = { approvalBranchKey, approvalRoleKey, canApproveBranchChange, isActive };
    if (!hasChanged(current, next)) return;

    updates.push({
      id: doc.id,
      payload: next,
    });
  });

  metrics.updatesNeeded = updates.length;
  const modeLabel = options.apply ? 'apply' : options.verify ? 'verify' : 'dry-run';
  console.log(`[personnel-approval-backfill] mode: ${modeLabel}`);
  printMetrics(metrics);

  if (!options.apply) {
    if (!options.verify) {
      console.log('[personnel-approval-backfill] dry-run mode (use --apply to persist updates)');
      updates.slice(0, 20).forEach((update) => {
        console.log(`- ${update.id}:`, update.payload);
      });
      if (updates.length > 20) {
        console.log(`... ${updates.length - 20} more`);
      }
    } else {
      console.log('[personnel-approval-backfill] verify mode: no writes performed.');
    }

    if (options.strict && hasIncompleteCoverage(metrics)) {
      console.error('[personnel-approval-backfill] strict verification failed: approval-field coverage is incomplete.');
      process.exit(1);
    }
    return;
  }

  const groups = chunk(updates, 400);
  for (const group of groups) {
    const batch = db.batch();
    group.forEach((entry) => {
      batch.set(
        db.collection('personnel').doc(entry.id),
        entry.payload,
        { merge: true }
      );
    });
    await batch.commit();
  }

  console.log(`[personnel-approval-backfill] applied ${updates.length} updates across ${groups.length} batch(es)`);
}

main().catch((error) => {
  console.error('[personnel-approval-backfill] failed:', error);
  process.exit(1);
});
