import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { getSchoolByName } from '@/data/schools/schools';
import { getSchoolImageLink } from '@/config/imageLinks';

interface SchoolLogoProps {
  schoolName: string;
  className?: string;
  logoUrlOverride?: string | null;
}

const SchoolLogo: React.FC<SchoolLogoProps> = ({ schoolName, className, logoUrlOverride }) => {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);

    // Determine the primary school name for logo fetching.
    // If it's a pathway program (e.g., "Pathway College + Main University"), use the main university's name.
    const primarySchoolName = useMemo(() => {
        if (schoolName.includes('+')) {
            return schoolName.split('+').pop()?.trim() || schoolName;
        }
        return schoolName;
    }, [schoolName]);


    useEffect(() => {
        setHasError(false); // Reset error state on name change
        const school = getSchoolByName(primarySchoolName);

        if (logoUrlOverride) {
            setLogoUrl(logoUrlOverride);
        } else {
            const centralizedLogo = getSchoolImageLink(primarySchoolName);
            if (centralizedLogo) {
                setLogoUrl(centralizedLogo);
            } else if (school?.logoUrl) {
                // Use the provided high-quality logo URL
                setLogoUrl(school.logoUrl);
            } else {
                // No URL available
                setLogoUrl(null);
            }
        }
    }, [logoUrlOverride, primarySchoolName]);

    const getInitials = (name: string) => {
        const acronyms = ['TAFE', 'RMIT', 'UNSW', 'UWA', 'UQ', 'UTS', 'SCU', 'KPU', 'UBC', 'NYIT', 'NLC', 'TRU', 'UCW'];
        const specialName = acronyms.find(acronym => name.includes(acronym));
        if (specialName) return specialName;

        const words = name.replace(/[^a-zA-Z\s]/g, "").split(' ');
        if (words.length > 1 && words.every(w => w.length <= 4 && w.toUpperCase() === w)) {
            return words.join('');
        }
        return words
            .map(word => word[0])
            .filter(char => char && char.match(/[A-Z0-9]/))
            .slice(0, 3)
            .join('');
    };

    const handleError = () => {
        setHasError(true);
    };
    
    const initials = getInitials(primarySchoolName);

    if (hasError || !logoUrl) {
        return (
            <div title={schoolName} className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-bold ${className}`}>
                <span style={{ fontSize: initials.length > 2 ? '0.8em' : '1em' }}>{initials}</span>
            </div>
        );
    }

    return (
        <Image
            src={logoUrl}
            alt={`${schoolName} logo`}
            width={80}
            height={80}
            className={className}
            onError={handleError}
            title={schoolName}
        />
    );
};

export default SchoolLogo;
