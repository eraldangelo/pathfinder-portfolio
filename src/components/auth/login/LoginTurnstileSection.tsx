import React from 'react';

interface LoginTurnstileSectionProps {
  hasTurnstileKey: boolean;
  turnstileContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  turnstileClientError: string | null;
}

const LoginTurnstileSection: React.FC<LoginTurnstileSectionProps> = ({
  hasTurnstileKey,
  turnstileContainerRef,
  turnstileClientError,
}) => (
  <div className="w-full max-w-xs mt-3">
    <div className="flex justify-center">
      {hasTurnstileKey ? (
        <div ref={turnstileContainerRef} data-testid="login-turnstile-container" />
      ) : (
        <p className="text-sm text-red-200 bg-red-900/50 backdrop-blur-sm px-5 py-2 rounded-lg text-center">
          Turnstile site key is missing or invalid.
        </p>
      )}
    </div>
    {turnstileClientError ? (
      <p className="mt-2 text-sm text-red-200 bg-red-900/50 backdrop-blur-sm px-5 py-2 rounded-lg text-center">
        {turnstileClientError}
      </p>
    ) : null}
  </div>
);

export default LoginTurnstileSection;
