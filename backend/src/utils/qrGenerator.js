const crypto = require('crypto');

/**
 * Generates a unique check-in ticket code
 * Format: ES-YEAR-RANDOMHEX
 */
const generateTicketCode = () => {
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  const year = new Date().getFullYear();
  return `ES-${year}-${randomHex}`;
};

module.exports = { generateTicketCode };
