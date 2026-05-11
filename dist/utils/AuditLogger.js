"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogger = exports.AUDIT_ACTIONS = void 0;
var AUDIT_ACTIONS;
(function (AUDIT_ACTIONS) {
    AUDIT_ACTIONS["COINS_CREDITED"] = "COINS_CREDITED";
    AUDIT_ACTIONS["COINS_DEBITED"] = "COINS_DEBITED";
    AUDIT_ACTIONS["WALLET_CREATED"] = "WALLET_CREATED";
    AUDIT_ACTIONS["WALLET_UPDATED"] = "WALLET_UPDATED";
    AUDIT_ACTIONS["WALLET_FROZEN"] = "WALLET_FROZEN";
    AUDIT_ACTIONS["WALLET_UNFROZEN"] = "WALLET_UNFROZEN";
    AUDIT_ACTIONS["WITHDRAWAL_REQUESTED"] = "WITHDRAWAL_REQUESTED";
    AUDIT_ACTIONS["WITHDRAWAL_COMPLETED"] = "WITHDRAWAL_COMPLETED";
    AUDIT_ACTIONS["WITHDRAWAL_FAILED"] = "WITHDRAWAL_FAILED";
    AUDIT_ACTIONS["PAYOUT_INITIATED"] = "PAYOUT_INITIATED";
    AUDIT_ACTIONS["PAYOUT_COMPLETED"] = "PAYOUT_COMPLETED";
    AUDIT_ACTIONS["PAYMENT_INITIATED"] = "PAYMENT_INITIATED";
    AUDIT_ACTIONS["PAYMENT_COMPLETED"] = "PAYMENT_COMPLETED";
    AUDIT_ACTIONS["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    AUDIT_ACTIONS["PAYMENT_REFUNDED"] = "PAYMENT_REFUNDED";
    AUDIT_ACTIONS["ORDER_CREATED"] = "ORDER_CREATED";
    AUDIT_ACTIONS["ORDER_COMPLETED"] = "ORDER_COMPLETED";
    AUDIT_ACTIONS["ORDER_CANCELLED"] = "ORDER_CANCELLED";
    AUDIT_ACTIONS["ORDER_REFUNDED"] = "ORDER_REFUNDED";
    AUDIT_ACTIONS["REFUND_INITIATED"] = "REFUND_INITIATED";
    AUDIT_ACTIONS["REFUND_COMPLETED"] = "REFUND_COMPLETED";
    AUDIT_ACTIONS["REFUND_FAILED"] = "REFUND_FAILED";
    AUDIT_ACTIONS["USER_REGISTERED"] = "USER_REGISTERED";
    AUDIT_ACTIONS["USER_UPDATED"] = "USER_UPDATED";
    AUDIT_ACTIONS["USER_DELETED"] = "USER_DELETED";
    AUDIT_ACTIONS["MERCHANT_REGISTERED"] = "MERCHANT_REGISTERED";
    AUDIT_ACTIONS["MERCHANT_APPROVED"] = "MERCHANT_APPROVED";
    AUDIT_ACTIONS["MERCHANT_REJECTED"] = "MERCHANT_REJECTED";
    AUDIT_ACTIONS["KYC_SUBMITTED"] = "KYC_SUBMITTED";
    AUDIT_ACTIONS["KYC_APPROVED"] = "KYC_APPROVED";
    AUDIT_ACTIONS["KYC_REJECTED"] = "KYC_REJECTED";
    AUDIT_ACTIONS["LOGIN"] = "LOGIN";
    AUDIT_ACTIONS["LOGOUT"] = "LOGOUT";
    AUDIT_ACTIONS["PASSWORD_CHANGED"] = "PASSWORD_CHANGED";
    AUDIT_ACTIONS["PASSWORD_RESET"] = "PASSWORD_RESET";
    AUDIT_ACTIONS["SETTINGS_UPDATED"] = "SETTINGS_UPDATED";
    AUDIT_ACTIONS["PROFILE_UPDATED"] = "PROFILE_UPDATED";
})(AUDIT_ACTIONS || (exports.AUDIT_ACTIONS = AUDIT_ACTIONS = {}));
class AuditLogger {
    constructor(collection, serviceName = 'unknown') {
        this._collection = collection;
        this.serviceName = serviceName;
    }
    async log(entry) {
        const fullEntry = {
            ...entry,
            timestamp: entry.timestamp || new Date(),
        };
        const result = await this._collection.insertOne(fullEntry);
        return result.insertedId;
    }
    async logSuccess(action, metadata) {
        return this.log({ action, metadata, status: 'success' });
    }
    async logFailure(action, errorMessage, metadata) {
        return this.log({ action, metadata, status: 'failure', errorMessage });
    }
    async getLogsByUser(userId, limit = 100) {
        return this._collection.find({ userId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
    }
    async getLogsByAction(action, limit = 100) {
        return this._collection.find({ action })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
    }
}
exports.AuditLogger = AuditLogger;
//# sourceMappingURL=AuditLogger.js.map