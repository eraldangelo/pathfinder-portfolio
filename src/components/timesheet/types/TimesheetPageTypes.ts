import type { User } from '../../../types';

export interface TimesheetPageProps {
  isReady: boolean;
  user: User;
  userRole: string;
  onOpenRequestLeaveModal: () => void;
  onOpenRequestOffsetModal: () => void;
  onOpenRequestUseOffsetModal: () => void;
}

