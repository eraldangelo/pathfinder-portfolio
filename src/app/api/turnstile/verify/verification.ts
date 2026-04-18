type TurnstileVerificationPayload = {
  success?: boolean;
  hostname?: string;
  action?: string;
};

type TurnstileValidationOptions = {
  requestHost: string;
  expectedAction: string;
  allowedHostnames: string[];
};

const normalizeHost = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .split(':')[0]
    .replace(/\.+$/, '');

const normalizeAction = (value: string) => value.trim().toLowerCase();

const sanitizeHostList = (values: string[]) =>
  values.map(normalizeHost).filter(Boolean);

export const resolveTurnstileAllowedHostnames = (requestHost: string, rawEnv: string | undefined) => {
  const fromEnv = String(rawEnv || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return sanitizeHostList([requestHost, ...fromEnv]);
};

export const validateTurnstileVerification = (
  verification: TurnstileVerificationPayload,
  options: TurnstileValidationOptions,
) => {
  if (!verification?.success) {
    return { ok: false, message: 'Captcha verification failed.' as const };
  }

  const observedHost = normalizeHost(String(verification.hostname || ''));
  const allowedHosts = new Set(sanitizeHostList(options.allowedHostnames));
  if (!observedHost || !allowedHosts.has(observedHost)) {
    return { ok: false, message: 'Captcha host mismatch.' as const };
  }

  const expectedAction = normalizeAction(options.expectedAction);
  const observedAction = normalizeAction(String(verification.action || ''));
  if (!expectedAction || !observedAction || observedAction !== expectedAction) {
    return { ok: false, message: 'Captcha action mismatch.' as const };
  }

  return { ok: true as const, message: '' };
};
