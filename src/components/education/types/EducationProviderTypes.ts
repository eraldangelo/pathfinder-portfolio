export type EducationProviderPrograms = string[] | string | null | undefined;

export interface EducationProvider {
    id: string;
    name: string;
    country: string;
    domain: string | null;
    logoUrl?: string | null;
    website?: string | null;
    intakes?: string | null;
    generalPrograms?: EducationProviderPrograms;
    popularPrograms?: EducationProviderPrograms;
    isActive?: boolean;
}
