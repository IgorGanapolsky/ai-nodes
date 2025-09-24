import React from 'react';
import { Alert } from '../types';
interface AlertBannerProps {
    alert: Alert;
    onDismiss: (alertId: string) => void;
    onPress?: (alert: Alert) => void;
}
export declare const AlertBanner: React.FC<AlertBannerProps>;
export default AlertBanner;
//# sourceMappingURL=AlertBanner.d.ts.map