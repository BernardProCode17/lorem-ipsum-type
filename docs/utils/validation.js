/**
 * Validation Utilities
 * Input validation functions for username, abbreviation, PIN, and other inputs
 */

/**
 * Common PIN patterns to blacklist
 * These are too predictable and should be rejected
 */
const COMMON_PINS = [
  '00000', '11111', '22222', '33333', '44444', '55555', '66666', '77777', '88888', '99999',
  '12345', '23456', '34567', '45678', '56789', '54321', '65432', '76543', '87654', '98765',
  '123456', '234567', '345678', '456789', '654321', '765432', '876543', '987654',
  '1234567', '2345678', '3456789', '7654321', '8765432', '9876543',
  '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999',
  '000000', '123456', '112233', '121212', '123123', '234234'
];

/**
 * Common abbreviation patterns to blacklist
 */
const COMMON_ABBREVIATIONS = [
  'aaaaa', 'bbbbb', 'ccccc', 'ddddd', 'eeeee',
  'abcde', 'abcd', 'bcde', 'cdef', 'defg',
  '12345', '23456', '34567', '45678', '56789',
  'qwerty', 'asdf', 'zxcv', 'admin', 'test',
  'user', 'guest', 'login', 'password'
];

/**
 * Validate username
 * 
 * Rules:
 * - 3-30 characters
 * - Alphanumeric and underscores only
 * - Case-insensitive (converted to lowercase)
 * 
 * @param {string} username - The username to validate
 * @returns {object} { valid: boolean, error: string }
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return {
      valid: false,
      error: 'Username is required'
    };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return {
      valid: false,
      error: 'Username must be at least 3 characters long'
    };
  }

  if (trimmed.length > 30) {
    return {
      valid: false,
      error: 'Username must be 30 characters or less'
    };
  }

  // Check format: alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, and underscores'
    };
  }

  return {
    valid: true,
    error: null
  };
}

/**
 * Validate abbreviation
 * 
 * Rules:
 * - 4-5 characters
 * - Alphanumeric only (a-z, 0-9)
 * - Cannot be similar to username (first 5 chars)
 * - Cannot be common patterns (aaaaa, 12345, etc.)
 * - Cannot be sequential (abcde, 12345)
 * 
 * @param {string} abbreviation - The abbreviation to validate
 * @param {string} username - The username (to check similarity)
 * @returns {object} { valid: boolean, error: string, strength: string }
 */
function validateAbbreviation(abbreviation, username) {
  if (!abbreviation || typeof abbreviation !== 'string') {
    return {
      valid: false,
      error: 'Abbreviation is required',
      strength: 'weak'
    };
  }

  const trimmed = abbreviation.trim().toLowerCase();

  // Check length
  if (trimmed.length < 4) {
    return {
      valid: false,
      error: 'Abbreviation must be at least 4 characters',
      strength: 'weak'
    };
  }

  if (trimmed.length > 5) {
    return {
      valid: false,
      error: 'Abbreviation must be 5 characters or less',
      strength: 'weak'
    };
  }

  // Check format: alphanumeric only
  const abbreviationRegex = /^[a-z0-9]+$/;
  if (!abbreviationRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Abbreviation can only contain letters and numbers',
      strength: 'weak'
    };
  }

  // Check if too similar to username
  if (username) {
    const usernameLower = username.toLowerCase().substring(0, 5);
    if (trimmed === usernameLower || trimmed.includes(usernameLower.substring(0, 4))) {
      return {
        valid: false,
        error: 'Abbreviation is too similar to your username',
        strength: 'weak'
      };
    }
  }

  // Check against common patterns
  if (COMMON_ABBREVIATIONS.includes(trimmed)) {
    return {
      valid: false,
      error: 'This abbreviation is too common. Please choose a more unique one.',
      strength: 'weak'
    };
  }

  // Check for repeated characters (aaaa, 1111)
  const repeatedPattern = /^(.)\1+$/;
  if (repeatedPattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Abbreviation cannot be all the same character',
      strength: 'weak'
    };
  }

  // Check for sequential characters (abcd, 1234, dcba, 4321)
  if (isSequential(trimmed)) {
    return {
      valid: false,
      error: 'Abbreviation cannot be sequential characters',
      strength: 'weak'
    };
  }

  // Calculate strength
  const strength = calculateAbbreviationStrength(trimmed);

  return {
    valid: true,
    error: null,
    strength: strength
  };
}

/**
 * Validate PIN
 * 
 * Rules:
 * - 5-7 digits
 * - Cannot be sequential (12345, 54321)
 * - Cannot be repeated (11111, 12121)
 * - Cannot be common PINs
 * 
 * @param {string} pin - The PIN to validate
 * @returns {object} { valid: boolean, error: string, strength: string }
 */
function validatePIN(pin) {
  if (!pin || typeof pin !== 'string') {
    return {
      valid: false,
      error: 'PIN is required',
      strength: 'weak'
    };
  }

  const trimmed = pin.trim();

  // Check length
  if (trimmed.length < 5) {
    return {
      valid: false,
      error: 'PIN must be at least 5 digits',
      strength: 'weak'
    };
  }

  if (trimmed.length > 7) {
    return {
      valid: false,
      error: 'PIN must be 7 digits or less',
      strength: 'weak'
    };
  }

  // Check format: digits only
  const pinRegex = /^[0-9]+$/;
  if (!pinRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'PIN can only contain numbers',
      strength: 'weak'
    };
  }

  // Check against common PINs
  if (COMMON_PINS.includes(trimmed)) {
    return {
      valid: false,
      error: 'This PIN is too common. Please choose a more secure one.',
      strength: 'weak'
    };
  }

  // Check for repeated digits (11111, 12121)
  const repeatedPattern = /^(.)\1+$/;
  if (repeatedPattern.test(trimmed)) {
    return {
      valid: false,
      error: 'PIN cannot be all the same digit',
      strength: 'weak'
    };
  }

  // Check for alternating patterns (121212, 123123)
  if (hasAlternatingPattern(trimmed)) {
    return {
      valid: false,
      error: 'PIN has a predictable pattern',
      strength: 'weak'
    };
  }

  // Check for sequential digits (12345, 54321)
  if (isSequential(trimmed)) {
    return {
      valid: false,
      error: 'PIN cannot be sequential numbers',
      strength: 'weak'
    };
  }

  // Calculate strength
  const strength = calculatePINStrength(trimmed);

  return {
    valid: true,
    error: null,
    strength: strength
  };
}

/**
 * Check if a string is sequential
 * Examples: abcd, 1234, dcba, 4321
 * 
 * @param {string} str - The string to check
 * @returns {boolean}
 */
function isSequential(str) {
  if (str.length < 3) return false;

  let ascending = true;
  let descending = true;

  for (let i = 1; i < str.length; i++) {
    const diff = str.charCodeAt(i) - str.charCodeAt(i - 1);
    
    if (diff !== 1) ascending = false;
    if (diff !== -1) descending = false;
    
    if (!ascending && !descending) return false;
  }

  return ascending || descending;
}

/**
 * Check if a string has alternating pattern
 * Examples: 121212, 123123, 343434
 * 
 * @param {string} str - The string to check
 * @returns {boolean}
 */
function hasAlternatingPattern(str) {
  if (str.length < 6) return false;

  // Check for 2-digit pattern (121212)
  const pattern2 = str.substring(0, 2);
  if (str === pattern2.repeat(str.length / 2)) {
    return true;
  }

  // Check for 3-digit pattern (123123)
  if (str.length % 3 === 0) {
    const pattern3 = str.substring(0, 3);
    if (str === pattern3.repeat(str.length / 3)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate abbreviation strength
 * 
 * @param {string} abbreviation - The abbreviation
 * @returns {string} 'weak', 'medium', 'strong'
 */
function calculateAbbreviationStrength(abbreviation) {
  let score = 0;

  // Length bonus
  if (abbreviation.length === 5) score += 2;

  // Mix of letters and numbers
  const hasLetters = /[a-z]/.test(abbreviation);
  const hasNumbers = /[0-9]/.test(abbreviation);
  if (hasLetters && hasNumbers) score += 3;

  // Unique characters
  const uniqueChars = new Set(abbreviation).size;
  if (uniqueChars === abbreviation.length) score += 2;

  // No obvious patterns
  if (!/(.)\1\1/.test(abbreviation)) score += 1; // No triple repeats

  if (score >= 6) return 'strong';
  if (score >= 3) return 'medium';
  return 'weak';
}

/**
 * Calculate PIN strength
 * 
 * @param {string} pin - The PIN
 * @returns {string} 'weak', 'medium', 'strong'
 */
function calculatePINStrength(pin) {
  let score = 0;

  // Length bonus
  if (pin.length >= 6) score += 2;
  if (pin.length === 7) score += 1;

  // Unique digits
  const uniqueDigits = new Set(pin).size;
  if (uniqueDigits >= 4) score += 2;
  if (uniqueDigits >= 5) score += 1;

  // No triple repeats
  if (!/(\d)\1\1/.test(pin)) score += 1;

  // No obvious pairs (1122, 3344)
  if (!/(\d)\1(\d)\2/.test(pin)) score += 1;

  if (score >= 6) return 'strong';
  if (score >= 3) return 'medium';
  return 'weak';
}

/**
 * Generate a random recovery code
 * Format: LOREM-XXXX-XXXX-XXXX
 * 
 * @returns {string} Recovery code
 */
function generateRecoveryCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars (I, O, 1, 0)
  
  const generateSegment = (length) => {
    let segment = '';
    for (let i = 0; i < length; i++) {
      segment += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return segment;
  };

  return `LOREM-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}`;
}

/**
 * Validate email format
 * 
 * @param {string} email - The email to validate
 * @returns {boolean}
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Sanitize string input (prevent XSS)
 * 
 * @param {string} input - The input to sanitize
 * @returns {string}
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>\"\']/g, '') // Remove dangerous characters
    .substring(0, 1000); // Limit length
}

module.exports = {
  validateUsername,
  validateAbbreviation,
  validatePIN,
  generateRecoveryCode,
  validateEmail,
  sanitizeInput,
  isSequential,
  hasAlternatingPattern,
  calculateAbbreviationStrength,
  calculatePINStrength
};
