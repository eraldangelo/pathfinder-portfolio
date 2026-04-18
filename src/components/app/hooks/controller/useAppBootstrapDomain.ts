import { useTranslation } from '../../../../contexts/LanguageContext';
import { useTheme } from '../useTheme';
import { useAppUiState } from '../useAppUiState';
import { useDisableContextMenu } from '../useDisableContextMenu';
import { useAuthSession } from '../useAuthSession';
import { useAppReady } from '../useAppReady';
import { useAppNavItems } from '../useAppNavItems';
import { useYearlyArchiveRollover } from '../useYearlyArchiveRollover';

export const useAppBootstrapDomain = () => {
    const { t } = useTranslation();
    const ui = useAppUiState();
    useDisableContextMenu();

    const { theme, toggleTheme } = useTheme();
    const authSession = useAuthSession({ t });
    const readyState = useAppReady(authSession.isLoading);
    const navItems = useAppNavItems({
        t,
        userRole: authSession.userRole,
        view: ui.view,
        isNotificationDropdownOpen: ui.isNotificationDropdownOpen,
    });

    useYearlyArchiveRollover({ user: authSession.user, userRole: authSession.userRole });

    return {
        t,
        ui,
        theme,
        toggleTheme,
        navItems,
        ...authSession,
        ...readyState,
    };
};
