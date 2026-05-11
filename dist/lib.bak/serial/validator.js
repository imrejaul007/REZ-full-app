"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSerialFormat = validateSerialFormat;
exports.validateSignature = validateSignature;
exports.validateSerial = validateSerial;
const generator_1 = require("./generator");
function validateSerialFormat(serial) {
    if (!serial || serial.trim() === '') {
        return { valid: false, error: 'Serial number is required' };
    }
    const cleaned = serial.trim().toUpperCase();
    if (cleaned.length < 20) {
        return { valid: false, error: 'Serial number too short' };
    }
    if (cleaned.length > 50) {
        return { valid: false, error: 'Serial number too long' };
    }
    const parsed = (0, generator_1.parseSerialNumber)(cleaned);
    if (!parsed) {
        return { valid: false, error: 'Invalid serial format' };
    }
    return { valid: true, parsed };
}
function validateSignature(serial, signature, secretKey) {
    if (!signature || signature.trim() === '') {
        return { valid: false, error: 'Signature is required' };
    }
    try {
        const isValid = (0, generator_1.verifySignature)(serial, signature, secretKey);
        if (!isValid) {
            return { valid: false, error: 'Invalid signature - possible fake serial' };
        }
        return { valid: true };
    }
    catch {
        return { valid: false, error: 'Signature validation failed' };
    }
}
function validateSerial(serial, signature, secretKey) {
    const formatResult = validateSerialFormat(serial);
    if (!formatResult.valid) {
        return formatResult;
    }
    const sigResult = validateSignature(serial, signature, secretKey);
    if (!sigResult.valid) {
        return sigResult;
    }
    return { valid: true, parsed: formatResult.parsed };
}
//# sourceMappingURL=validator.js.map