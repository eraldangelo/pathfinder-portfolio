import { useAppBootstrapDomain } from './controller/useAppBootstrapDomain';
import { useAppFeedbackDomain } from './controller/useAppFeedbackDomain';
import { useAppDataDomain } from './controller/useAppDataDomain';
import { useAppInteractionDomain } from './controller/useAppInteractionDomain';
import {
    buildAppShellControllerState,
    buildAuthControllerState,
} from './useAppController.builders';

export const useAppController = () => {
    const bootstrap = useAppBootstrapDomain();
    const feedback = useAppFeedbackDomain({
        user: bootstrap.user,
        userRole: bootstrap.userRole,
        t: bootstrap.t,
        setIsReady: bootstrap.setIsReady,
        setView: bootstrap.ui.setView,
    });
    const data = useAppDataDomain({
        user: bootstrap.user,
        userRole: bootstrap.userRole,
        selectedApplicationId: bootstrap.ui.selectedApplicationId,
        openStudentModalId: bootstrap.ui.openStudentModalId,
        openStudentModalPath: bootstrap.ui.openStudentModalPath,
        minimizedStudentModals: bootstrap.ui.minimizedStudentModals,
        modalInitialTab: bootstrap.ui.modalInitialTab,
    });
    const interactions = useAppInteractionDomain({
        user: bootstrap.user,
        setUser: bootstrap.setUser,
        userRole: bootstrap.userRole,
        t: bootstrap.t,
        showPopup: feedback.showPopup,
        setView: bootstrap.ui.setView,
        setIsReady: bootstrap.setIsReady,
        closeTransferModal: bootstrap.ui.closeTransferModal,
        closeRequestLeaveModal: bootstrap.ui.closeRequestLeaveModal,
        closeRequestOffsetModal: bootstrap.ui.closeRequestOffsetModal,
    });

    const auth = buildAuthControllerState({ bootstrap, feedback });
    const appShell = buildAppShellControllerState({ bootstrap, feedback, data, interactions });

    return {
        auth,
        appShell,
    };
};
