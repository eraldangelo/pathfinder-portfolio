import React from 'react';
import type { DashboardContentProps } from '../types/DashboardContentTypes';
import {
    isAdministrativeStaffRole,
    isBranchManagerRole,
    isCounsellorRole,
    isOperationsLikeRole,
    isSatelliteOfficeRole,
} from '../../../utils/roles';
import DashboardContentAdmin from './DashboardContentAdmin';
import DashboardContentConsultant from './DashboardContentConsultant';
import DashboardContentDefault from './DashboardContentDefault';

const DashboardContent: React.FC<DashboardContentProps> = (props) => {
    if (isSatelliteOfficeRole(props.role)) {
        return <DashboardContentAdmin {...props} />;
    }

    if (
        isOperationsLikeRole(props.role)
        || isAdministrativeStaffRole(props.role)
        || isBranchManagerRole(props.role)
    ) {
        return <DashboardContentDefault {...props} />;
    }

    if (isCounsellorRole(props.role)) {
        return <DashboardContentConsultant {...props} />;
    }

    return <DashboardContentDefault {...props} />;
};

export default DashboardContent;

