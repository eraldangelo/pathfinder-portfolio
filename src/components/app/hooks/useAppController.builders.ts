import type { useAppBootstrapDomain } from './controller/useAppBootstrapDomain';
import type { useAppDataDomain } from './controller/useAppDataDomain';
import type { useAppFeedbackDomain } from './controller/useAppFeedbackDomain';
import type { useAppInteractionDomain } from './controller/useAppInteractionDomain';

type BootstrapDomain = ReturnType<typeof useAppBootstrapDomain>;
type FeedbackDomain = ReturnType<typeof useAppFeedbackDomain>;
type DataDomain = ReturnType<typeof useAppDataDomain>;
type InteractionDomain = ReturnType<typeof useAppInteractionDomain>;

export const buildAuthControllerState = ({
    bootstrap,
    feedback,
}: {
    bootstrap: BootstrapDomain;
    feedback: FeedbackDomain;
}) => ({
    isLoading: bootstrap.isLoading,
    user: bootstrap.user,
    isForceResetRequired: bootstrap.isForceResetRequired,
    isReady: bootstrap.isReady,
    authError: bootstrap.error,
    showPopup: feedback.showPopup,
    setIsLoading: bootstrap.setIsLoading,
    clearAuthError: () => bootstrap.setError(null),
    handleForcePasswordReset: feedback.authHandlers.handleForcePasswordReset,
});

export const buildAppShellHandlers = ({
    feedback,
    interactions,
}: {
    feedback: FeedbackDomain;
    interactions: InteractionDomain;
}) => ({
    handleLogout: feedback.authHandlers.handleLogout,
    closeConfirm: feedback.confirmModal.closeConfirm,
    updateLead: interactions.handlers.updateLead,
    addLogEntry: interactions.handlers.addLogEntry,
    addNote: interactions.handlers.addNote,
    updateApplication: interactions.handlers.updateApplication,
    handleStatusUpdateWithNote: interactions.handlers.handleStatusUpdateWithNote,
    showPopup: feedback.showPopup,
    handleProfileUpdate: interactions.handlers.handleProfileUpdate,
    handleSubmitTransfer: interactions.handlers.handleSubmitTransfer,
    handleRequestLeaveSubmit: interactions.handlers.handleRequestLeaveSubmit,
    handleRequestOffsetSubmit: interactions.handlers.handleRequestOffsetSubmit,
    onLoginAgain: interactions.handlers.handleLoginAgain,
    onBranchChangeRequestSubmit: interactions.handlers.handleBranchChangeRequestSubmit,
});

export const buildAppShellControllerState = ({
    bootstrap,
    feedback,
    data,
    interactions,
}: {
    bootstrap: BootstrapDomain;
    feedback: FeedbackDomain;
    data: DataDomain;
    interactions: InteractionDomain;
}) => ({
    user: bootstrap.user,
    userRole: bootstrap.userRole,
    view: bootstrap.ui.view,
    theme: bootstrap.theme,
    toggleTheme: bootstrap.toggleTheme,
    isReady: bootstrap.isReady,
    ui: bootstrap.ui,
    navItems: bootstrap.navItems,
    confirmModal: feedback.confirmModalState,
    notificationsState: feedback.notificationsState,
    data: data.appData,
    timeTracking: feedback.timeTrackingState,
    handlers: buildAppShellHandlers({ feedback, interactions }),
});
