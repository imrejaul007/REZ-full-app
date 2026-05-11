"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCode = generateQRCode;
exports.generateQRCodeBuffer = generateQRCodeBuffer;
exports.generateQRSvg = generateQRSvg;
exports.batchGenerateQRCodes = batchGenerateQRCodes;
exports.generateQRSheet = generateQRSheet;
const qrcode_1 = __importDefault(require("qrcode"));
const DEFAULT_OPTIONS = {
    width: 300,
    margin: 2,
    color: {
        dark: '#000000',
        light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
};
async function generateQRCode(data, options = {}) {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    try {
        const dataUrl = await qrcode_1.default.toDataURL(data, {
            width: mergedOptions.width,
            margin: mergedOptions.margin,
            color: mergedOptions.color,
            errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
        });
        return dataUrl;
    }
    catch (error) {
        throw new Error(`Failed to generate QR code: ${error}`);
    }
}
async function generateQRCodeBuffer(data, options = {}) {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    try {
        const buffer = await qrcode_1.default.toBuffer(data, {
            width: mergedOptions.width,
            margin: mergedOptions.margin,
            color: mergedOptions.color,
            errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
            type: 'png',
        });
        return buffer;
    }
    catch (error) {
        throw new Error(`Failed to generate QR code buffer: ${error}`);
    }
}
async function generateQRSvg(data, options = {}) {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    try {
        const svg = await qrcode_1.default.toString(data, {
            type: 'svg',
            width: mergedOptions.width,
            margin: mergedOptions.margin,
            color: mergedOptions.color,
            errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
        });
        return svg;
    }
    catch (error) {
        throw new Error(`Failed to generate QR SVG: ${error}`);
    }
}
async function batchGenerateQRCodes(items, options = {}) {
    const results = await Promise.all(items.map(async (item) => {
        const qrUrl = `${item.baseUrl || 'https://verify.rez.money'}/verify?s=${item.serial}&sig=${item.signature}`;
        const qrBase64 = await generateQRCode(qrUrl, options);
        return { serial: item.serial, qrBase64 };
    }));
    return results;
}
async function generateQRSheet(items, options = {}) {
    const qrCodes = await batchGenerateQRCodes(items.map((item) => ({
        serial: item.serial,
        signature: item.signature,
    })), options);
    return {
        totalItems: items.length,
        qrCodes,
    };
}
//# sourceMappingURL=qr.js.map