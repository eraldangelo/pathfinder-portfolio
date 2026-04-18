
import { type School, australianSchools } from './australian-schools';
import {
    canadianSchools,
    newZealandSchools,
    irelandSchools,
    germanySchools,
} from './international-schools';

// Re-export the type for any component that might need it
export type { School };

// Re-export individual arrays for components that need them (like the application modal)
export {
    australianSchools,
    canadianSchools,
    newZealandSchools,
    irelandSchools,
    germanySchools,
};


export const allSchools: School[] = [
  ...australianSchools,
  ...canadianSchools,
  ...newZealandSchools,
  ...irelandSchools,
  ...germanySchools,
];

// Helper function to find a school by name
export const getSchoolByName = (name: string): School | undefined => {
    // Attempt an exact match first
    let school = allSchools.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (school) return school;

    // Attempt a match ignoring parenthetical parts
    const cleanName = name.replace(/\s*\(.*\)\s*/, '').trim().toLowerCase();
    school = allSchools.find(s => s.name.replace(/\s*\(.*\)\s*/, '').trim().toLowerCase() === cleanName);
    if (school) return school;

    // No match found
    return undefined;
};
