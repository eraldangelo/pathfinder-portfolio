export const leadProfileScore = (raw: any) => {
    if (!raw || typeof raw !== 'object') return 0;

    let score = 0;
    const textFields = [
        'fullName',
        'name',
        'email',
        'emailAddress',
        'branch',
        'referredStaffBranch',
        'assignedCounsellor',
        'currentLocation',
        'dob',
        'dateOfBirth',
        'phoneNumber',
        'mobileNumber',
    ];

    textFields.forEach((field) => {
        if (String(raw?.[field] ?? '').trim()) {
            score += 1;
        }
    });

    if (Array.isArray(raw?.studyDestinations) && raw.studyDestinations.length > 0) {
        score += 1;
    }

    return score;
};

export const fetchArchivedLeadSnapshot = async (db: any, leadId: string) => {
    const yearsSnapshot = await db.collection('archives').get();
    const yearIds = yearsSnapshot.docs
        .map((doc: any) => String(doc.id || '').trim())
        .filter(Boolean)
        .sort((a, b) => Number(b) - Number(a));

    for (const yearId of yearIds) {
        const archivedLeadSnapshot = await db
            .collection('archives')
            .doc(yearId)
            .collection('leads')
            .doc(leadId)
            .get();
        if (archivedLeadSnapshot.exists) {
            return archivedLeadSnapshot;
        }
    }

    return null;
};
