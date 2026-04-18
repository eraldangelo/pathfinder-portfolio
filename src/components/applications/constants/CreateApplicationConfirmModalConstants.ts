import { australianSchools, canadianSchools, newZealandSchools, irelandSchools, germanySchools } from '../../../data/schools/schools';

export const schoolsByCountry = {
    'Australia': australianSchools.map(s => s.name).sort(),
    'Canada': canadianSchools.map(s => s.name).sort(),
    'New Zealand': newZealandSchools.map(s => s.name).sort(),
    'Ireland': irelandSchools.map(s => s.name).sort(),
    'Germany': germanySchools.map(s => s.name).sort(),
};

export const countries = Object.keys(schoolsByCountry);

export const aggregators = ['Adventus', 'GSM', 'Leap GeeBee', 'UP Education', 'Study Group'];
