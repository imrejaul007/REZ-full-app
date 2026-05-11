/**
 * Payout validation utilities.
 *
 * BE-MER-007 FIX: Validates payout amounts and constraints.
 */

export interface PayoutValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Validates payout amount.
 *
 * BE-MER-007 FIX: Validates amount is positive, within bounds, and has valid precision.
 *
 * @param amount Payout amount in rupees
 * @param maxAmount Maximum allowed payout (default: 10 crores)
 * @returns Validation result
 */
export function validatePayoutAmount(amount: any, maxAmount: number = 100000000): PayoutValidation {
  // Convert to number
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Must be a valid number
  if (!Number.isFinite(amountNum)) {
    return { isValid: false, error: 'amount must be a valid number' };
  }

  // Must be positive
  if (amountNum <= 0) {
    return { isValid: false, error: 'amount must be greater than 0' };
  }

  // Must not exceed max
  if (amountNum > maxAmount) {
    return { isValid: false, error: `amount cannot exceed ${maxAmount}` };
  }

  // Check decimal precision (max 2 decimal places for rupees)
  const decimalPlaces = (amountNum.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return { isValid: false, error: 'amount must have at most 2 decimal places' };
  }

  return { isValid: true };
}

/**
 * Validates bank details format.
 *
 * BE-MER-010 FIX: Validates IFSC code, account number, and account holder name.
 */
export interface BankDetails {
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  bankName?: string;
}

export interface BankDetailsValidation {
  isValid: boolean;
  errors?: string[];
}

export function validateBankDetails(bankDetails: any): BankDetailsValidation {
  const errors: string[] = [];

  if (!bankDetails || typeof bankDetails !== 'object') {
    return { isValid: false, errors: ['bankDetails must be an object'] };
  }

  // IFSC code: 11 alphanumeric characters
  const ifsc = String(bankDetails.ifscCode || '').trim().toUpperCase();
  if (!ifsc || !/^[A-Z0-9]{11}$/.test(ifsc)) {
    errors.push('IFSC code must be 11 alphanumeric characters (e.g., SBIN0001234)');
  }

  // Account number: 8-18 digits
  const accountNum = String(bankDetails.accountNumber || '').trim();
  if (!accountNum || !/^\d{8,18}$/.test(accountNum)) {
    errors.push('Account number must be 8-18 digits');
  }

  // Account holder name: alphabetic characters and spaces only
  const accountName = String(bankDetails.accountHolderName || '').trim();
  if (!accountName || !/^[a-zA-Z\s]+$/.test(accountName)) {
    errors.push('Account holder name must contain only alphabetic characters and spaces');
  }

  return errors.length === 0
    ? { isValid: true }
    : { isValid: false, errors };
}
