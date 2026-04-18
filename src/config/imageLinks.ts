import { SCHOOL_IMAGE_LINKS, getSchoolImageLink } from './schoolImageLinks';

export const IMAGE_LINKS = {
    branding: {
        logoDark: '/assets/branding/pathfinder-logo-dark.png',
        logoLight: '/assets/branding/pathfinder-logo-light.png',
        loginLogoLight: '/assets/branding/pathfinder-logo-light.png',
        bgLight: '/assets/branding/background-light.png',
        bgDark: '/assets/branding/background-dark.jpg',
        favicon32: '/assets/branding/pathfinder-favicon.png',
        defaultAvatar: '/assets/avatar.svg',
        welcomeBg: '/assets/branding/background-light.png',
    },
    ui: {
        transferIcon: '/assets/ui/transfer-icon.svg',
        applicationStatusRunner:
            '/assets/ui/status-runner.svg',
        studyNaviFavicon: '/assets/branding/studynavi-favicon.png',
        leadHeader: '/assets/ui/header-generic.svg',
        applicationsHeader: '/assets/ui/header-generic.svg',
        educationHeader: '/assets/ui/header-generic.svg',
        dashboardHeader: '/assets/ui/header-generic.svg',
    },
    schools: SCHOOL_IMAGE_LINKS,
} as const;
export { SCHOOL_IMAGE_LINKS, getSchoolImageLink };
