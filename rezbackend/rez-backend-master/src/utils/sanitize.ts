/**
 * Escape special regex characters in a string for safe use in MongoDB $regex queries.
 * Prevents ReDoS attacks and regex injection.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate a sort field against a whitelist of allowed fields.
 * Prevents MongoDB sort field injection (e.g., "$where", "__proto__").
 */
export function validateSortField(
  sortBy: string | undefined,
  allowedFields: readonly string[],
  defaultField: string,
): string {
  if (!sortBy || typeof sortBy !== 'string') return defaultField;
  return allowedFields.includes(sortBy) ? sortBy : defaultField;
}

/**
 * SANA: Mask phone number for logging and responses
 * Shows only last 4 digits: +919876543210 → ***7654
 * @param phone Phone number (any format)
 * @returns Masked phone (last 4 digits visible) or '***' if too short
 */
export function maskPhoneNumber(phone: string | undefined): string {
  if (!phone) return '***';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***${digits.slice(-4)}`;
}

/**
 * SANA: Mask bank account number
 * Shows only last 4 digits: 1234567890 → XXXXXX7890
 * @param account Bank account number
 * @returns Masked account (last 4 digits visible) or 'XXXXXX' if too short
 */
export function maskBankAccount(account: string | undefined): string {
  if (!account) return 'XXXXXX';
  const digits = account.replace(/\D/g, '');
  if (digits.length < 4) return 'XXXXXX';
  return `XXXXXX${digits.slice(-4)}`;
}

/**
 * SANA: Mask PAN (Permanent Account Number)
 * Shows only last 4 characters: ABCDE1234F → XXXXX1234F
 * @param pan PAN number
 * @returns Masked PAN (last 4 chars visible) or 'XXXXXX' if too short
 */
export function maskPAN(pan: string | undefined): string {
  if (!pan) return 'XXXXXX';
  const cleaned = (pan || '').toUpperCase().trim();
  if (cleaned.length < 4) return 'XXXXXX';
  return `XXXXX${cleaned.slice(-4)}`;
}

/**
 * SANA: Mask credit/debit card number
 * Shows only last 4 digits: 4532123456789123 → XXXX XXXX XXXX 9123
 * @param card Card number
 * @returns Masked card (last 4 digits visible) or 'XXXX XXXX XXXX XXXX' if invalid
 */
export function maskCardNumber(card: string | undefined): string {
  if (!card) return 'XXXX XXXX XXXX XXXX';
  const digits = card.replace(/\D/g, '');
  if (digits.length < 4) return 'XXXX XXXX XXXX XXXX';
  return `XXXX XXXX XXXX ${digits.slice(-4)}`;
}
