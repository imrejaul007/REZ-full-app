"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSerialNumber = generateSerialNumber;
exports.generateSignature = generateSignature;
exports.verifySignature = verifySignature;
exports.generateBatchId = generateBatchId;
exports.generateSerialBatch = generateSerialBatch;
exports.parseSerialNumber = parseSerialNumber;
exports.generateQRContent = generateQRContent;
exports.generateQRData = generateQRData;
const crypto_1 = __importDefault(require("crypto"));
function generateSerialNumber(brandPrefix, productCode) {
    const random = generateRandomString(12);
    return `REZ-${brandPrefix}-${productCode}-${random}`.toUpperCase();
}
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const randomBytes = crypto_1.default.randomBytes(length);
    for (let i = 0; i < length; i++) {
        result += chars[randomBytes[i] % chars.length];
    }
    return result;
}
function generateSignature(serialNumber, secretKey) {
    return crypto_1.default
        .createHmac('sha256', secretKey)
        .update(serialNumber)
        .digest('hex');
}
function verifySignature(serialNumber, signature, secretKey) {
    const expected = generateSignature(serialNumber, secretKey);
    return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
function generateBatchId() {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const random = generateRandomString(6).toUpperCase();
    return `BATCH-${dateStr}-${random}`;
}
function generateSerialBatch(brandPrefix, productCode, quantity, secretKey) {
    const batchId = generateBatchId();
    const serials = [];
    for (let i = 0; i < quantity; i++) {
        const serial = generateSerialNumber(brandPrefix, productCode);
        const signature = generateSignature(serial, secretKey);
        serials.push({ serial, signature, batchId });
    }
    return serials;
}
function parseSerialNumber(serial) {
    const match = serial.match(/^REZ-([A-Z0-9]{2,6})-([A-Z0-9]{1,4})-([A-Z0-9]{12})$/);
    if (!match)
        return null;
    return {
        prefix: 'REZ',
        brand: match[1],
        product: match[2],
        random: match[3],
    };
}
function generateQRContent(serialNumber, signature, baseUrl = 'https://verify.rez.money') {
    const params = new URLSearchParams({
        s: serialNumber,
        sig: signature.substring(0, 32),
    });
    return `${baseUrl}/verify?${params.toString()}`;
}
function generateQRData(serialNumber, signature, brandName, productName) {
    return {
        serial: serialNumber,
        signature,
        brand: brandName,
        product: productName,
        qrUrl: generateQRContent(serialNumber, signature),
        createdAt: new Date().toISOString(),
    };
}
//# sourceMappingURL=generator.js.map