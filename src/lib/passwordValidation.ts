export interface PasswordValidationRule {
  key: 'length' | 'uppercase' | 'lowercase' | 'number' | 'special';
  label: string;
  passed: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  error?: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
  rules: PasswordValidationRule[];
}

/**
 * Validates password strength:
 * - At least 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&* etc.)
 */
export function validatePassword(password: string): PasswordValidationResult {
  const pwd = password || '';
  const checks = {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
  };

  const rules: PasswordValidationRule[] = [
    { key: 'length', label: 'At least 8 characters', passed: checks.length },
    { key: 'uppercase', label: 'One uppercase letter (A-Z)', passed: checks.uppercase },
    { key: 'lowercase', label: 'One lowercase letter (a-z)', passed: checks.lowercase },
    { key: 'number', label: 'One number (0-9)', passed: checks.number },
    { key: 'special', label: 'One special character (!@#$%^&*)', passed: checks.special },
  ];

  const isValid = checks.length && checks.uppercase && checks.lowercase && checks.number && checks.special;

  if (isValid) {
    return { isValid: true, checks, rules };
  }

  const missing: string[] = [];
  if (!checks.length) missing.push('at least 8 characters');
  if (!checks.uppercase) missing.push('an uppercase letter');
  if (!checks.lowercase) missing.push('a lowercase letter');
  if (!checks.number) missing.push('a number');
  if (!checks.special) missing.push('a special character');

  let error = '';
  if (missing.length === 1) {
    if (!checks.length) error = 'Password must be at least 8 characters long';
    else if (!checks.uppercase) error = 'Password must include at least one uppercase letter (A-Z)';
    else if (!checks.lowercase) error = 'Password must include at least one lowercase letter (a-z)';
    else if (!checks.number) error = 'Password must include at least one number (0-9)';
    else if (!checks.special) error = 'Password must include at least one special character';
  } else {
    error = `Password must include: ${missing.join(', ')}`;
  }

  return { isValid: false, error, checks, rules };
}

