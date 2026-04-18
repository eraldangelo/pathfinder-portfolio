const fs = require('fs');
const path = require('path');

const RULES_PATH = path.join(process.cwd(), 'firestore.rules');

const checks = [
  {
    id: 'educationProviders locked writes',
    pattern:
      /match\s+\/educationProviders\/\{providerId\}\s*\{[\s\S]*allow\s+create,\s*update,\s*delete:\s*if\s+false;/,
  },
  {
    id: 'personnel create blocked',
    pattern:
      /match\s+\/personnel\/\{personnelId\}\s*\{[\s\S]*allow\s+create:\s*if\s+false;/,
  },
  {
    id: 'notifications self-create only',
    pattern:
      /match\s+\/personnel\/\{personnelId\}\/notifications\/\{notificationId\}\s*\{[\s\S]*allow\s+create:\s*if\s+isSignedIn\(\)[\s\S]*request\.auth\.uid\s*==\s*personnelId/,
  },
  {
    id: 'leads read is role-scoped',
    pattern:
      /match\s+\/leads\/\{leadId\}\s*\{[\s\S]*allow\s+read:\s*if\s+canReadAssessmentSubmissionDoc\(\);/,
  },
  {
    id: 'leads create is scope-guarded',
    pattern:
      /match\s+\/leads\/\{leadId\}\s*\{[\s\S]*allow\s+create:\s*if\s+canCreateLeadDocument\(\);/,
  },
  {
    id: 'leads update is scope-guarded',
    pattern:
      /match\s+\/leads\/\{leadId\}\s*\{[\s\S]*allow\s+update:\s*if\s+canUpdateLeadDocument\(\);/,
  },
  {
    id: 'leads delete is scope-guarded',
    pattern:
      /match\s+\/leads\/\{leadId\}\s*\{[\s\S]*allow\s+delete:\s*if\s+canDeleteLeadDocument\(\);/,
  },
  {
    id: 'lead child writes are lead-scoped',
    pattern:
      /match\s+\/leads\/\{leadId\}\/logs\/\{logId\}\s*\{[\s\S]*allow\s+create,\s*update,\s*delete:\s*if\s+canWriteLeadChildren\(leadId\);/,
  },
  {
    id: 'archive lead writes are scope-guarded',
    pattern:
      /match\s+\/archives\/\{year\}\/leads\/\{leadId\}\s*\{[\s\S]*allow\s+create:\s*if\s+canCreateArchiveLeadDocument\(\);[\s\S]*allow\s+update:\s*if\s+canUpdateArchiveLeadDocument\(year,\s*leadId\);[\s\S]*allow\s+delete:\s*if\s+canDeleteArchiveLeadDocument\(year,\s*leadId\);/,
  },
  {
    id: 'self-mutable personnel fields no longer include passwordNeedsReset',
    pattern:
      /function\s+isSelfMutablePersonnelUpdate\(personnelId\)\s*\{[\s\S]*affectedKeys\(\)\.hasOnly\(\[[\s\S]*\]\);[\s\S]*\}/,
    forbidPattern:
      /function\s+isSelfMutablePersonnelUpdate\(personnelId\)\s*\{[\s\S]*passwordNeedsReset[\s\S]*\}/,
  },
  {
    id: 'leave request collectionGroup read is staff-scoped',
    pattern:
      /match\s+\/\{path=\*\*\}\/leaveRequests\/\{requestId\}\s*\{[\s\S]*allow\s+read:\s*if\s+isAuthorizedStaffUser\(\);/,
  },
  {
    id: 'branch change request user history path is present',
    pattern:
      /match\s+\/personnel\/\{personnelId\}\/branchChangeRequests\/\{requestId\}\s*\{[\s\S]*allow\s+create:\s*if\s+request\.auth\s*!=\s*null[\s\S]*request\.auth\.uid\s*==\s*personnelId/,
  },
  {
    id: 'branch change queue has requester create + approver/read access guard',
    pattern:
      /match\s+\/branchChangeRequestQueue\/\{requestId\}\s*\{[\s\S]*allow\s+create:\s*if\s+isSignedIn\(\)[\s\S]*request\.resource\.data\.requesterId\s*==\s*request\.auth\.uid[\s\S]*(allow\s+read:\s*if\s+isSignedIn\(\)|allow\s+get:\s*if\s+isSignedIn\(\)[\s\S]*allow\s+list:\s*if\s+isSignedIn\(\))/,
  },
  {
    id: 'deny-by-default fallback remains',
    pattern:
      /match\s+\/\{document=\*\*\}\s*\{[\s\S]*allow\s+read,\s*write:\s*if\s+false;/,
  },
];

function main() {
  const content = fs.readFileSync(RULES_PATH, 'utf8');
  const failed = checks.filter((check) => {
    if (!check.pattern.test(content)) return true;
    if (check.forbidPattern && check.forbidPattern.test(content)) return true;
    return false;
  });

  if (failed.length > 0) {
    console.error('Firestore rules contract check failed. Missing invariants:');
    failed.forEach((check) => {
      console.error(`- ${check.id}`);
    });
    process.exit(1);
  }

  console.log(`Firestore rules contract check passed (${checks.length} invariants).`);
}

main();
