import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const INDEX_FILE = path.join(ROOT, 'firestore.indexes.json');

const RECOMMENDED_FIELD_OVERRIDES = {
  applications: new Set(['branch', 'assignedCounsellorUid', 'isArchived', 'status', 'statusChanged', 'archivedYear']),
};

const isCodeFile = (filePath) => filePath.endsWith('.ts') || filePath.endsWith('.tsx');

const walk = (dirPath) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (isCodeFile(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
};

const collectCollectionGroupVars = (content) => {
  const vars = [];
  const assignmentPattern = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*[^;\n]*?collectionGroup\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;
  while ((match = assignmentPattern.exec(content)) !== null) {
    vars.push({ varName: match[1], groupName: match[2] });
  }
  return vars;
};

const collectFieldsFromVarReassignments = (content, varName) => {
  const fields = new Set();
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escaped}\\s*=\\s*${escaped}\\.(?:where|orderBy)\\(\\s*['"]([^'"]+)['"]`, 'g');
  let match;
  while ((match = pattern.exec(content)) !== null) {
    fields.add(match[1]);
  }
  return fields;
};

const collectFieldsFromInlineChains = (content, groupName) => {
  const fields = new Set();
  const chainPattern = new RegExp(`collectionGroup\\(\\s*['"]${groupName}['"]\\s*\\)([\\s\\S]{0,260})`, 'g');
  let chainMatch;
  while ((chainMatch = chainPattern.exec(content)) !== null) {
    const chainText = chainMatch[1] || '';
    const fieldPattern = /(?:where|orderBy)\(\s*['"]([^'"]+)['"]/g;
    let fieldMatch;
    while ((fieldMatch = fieldPattern.exec(chainText)) !== null) {
      fields.add(fieldMatch[1]);
    }
  }
  return fields;
};

const detectedFieldsByGroup = new Map();

if (fs.existsSync(SRC_DIR)) {
  for (const filePath of walk(SRC_DIR)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const vars = collectCollectionGroupVars(content);
    for (const { varName, groupName } of vars) {
      if (!detectedFieldsByGroup.has(groupName)) {
        detectedFieldsByGroup.set(groupName, new Set());
      }
      const target = detectedFieldsByGroup.get(groupName);
      collectFieldsFromVarReassignments(content, varName).forEach((field) => target.add(field));
      collectFieldsFromInlineChains(content, groupName).forEach((field) => target.add(field));
    }
  }
}

const indexConfig = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
const overrides = Array.isArray(indexConfig.fieldOverrides) ? indexConfig.fieldOverrides : [];

const hasFieldOverride = (groupName, fieldPath) => {
  const entry = overrides.find(
    (override) => override.collectionGroup === groupName && override.fieldPath === fieldPath
  );
  if (!entry || !Array.isArray(entry.indexes)) return false;

  const hasAsc = entry.indexes.some(
    (idx) => idx?.queryScope === 'COLLECTION_GROUP' && idx?.order === 'ASCENDING'
  );
  const hasDesc = entry.indexes.some(
    (idx) => idx?.queryScope === 'COLLECTION_GROUP' && idx?.order === 'DESCENDING'
  );

  return hasAsc && hasDesc;
};

const missing = [];

for (const [groupName, fields] of detectedFieldsByGroup.entries()) {
  for (const fieldPath of fields) {
    if (!hasFieldOverride(groupName, fieldPath)) {
      missing.push({ groupName, fieldPath, source: 'detected-query' });
    }
  }
}

for (const [groupName, fields] of Object.entries(RECOMMENDED_FIELD_OVERRIDES)) {
  for (const fieldPath of fields) {
    if (!hasFieldOverride(groupName, fieldPath)) {
      missing.push({ groupName, fieldPath, source: 'recommended' });
    }
  }
}

if (missing.length > 0) {
  console.error('Missing Firestore field overrides detected:');
  for (const item of missing) {
    console.error(`- ${item.groupName}.${item.fieldPath} (${item.source})`);
  }
  process.exitCode = 1;
} else {
  console.log('Firestore index overrides look good.');
}
