import type { User } from '../../../../types';
import type { TranslateFn } from '../../../../types/translation';

export type { TranslateFn } from '../../../../types/translation';

export type ShowPopupFn = (message: string, meta?: { eventKey?: string; persist?: boolean }) => void;

export interface LeadHandlersBaseDeps {
    user: User | null;
    userRole: string | null;
    t: TranslateFn;
    showPopup: ShowPopupFn;
}
