import React from 'react';

type FlagIconProps = {
    countryCode?: string | null;
    label: string;
    className?: string;
    square?: boolean;
    fallback?: React.ReactNode;
};

const normalizeCountryCode = (countryCode?: string | null) => {
    const normalized = String(countryCode ?? '').trim().toLowerCase();
    return /^[a-z]{2}$/.test(normalized) ? normalized : '';
};

const joinClassNames = (...tokens: Array<string | undefined | false>) =>
    tokens.filter(Boolean).join(' ');

const FlagIcon: React.FC<FlagIconProps> = ({
    countryCode,
    label,
    className,
    square = false,
    fallback = null,
}) => {
    const normalizedCode = normalizeCountryCode(countryCode);
    if (!normalizedCode) return <>{fallback}</>;

    return (
        <span
            role="img"
            aria-label={`${label} flag`}
            title={`${label} flag`}
            className={joinClassNames('fi', `fi-${normalizedCode}`, square && 'fis', 'inline-block', className)}
        />
    );
};

export default FlagIcon;
