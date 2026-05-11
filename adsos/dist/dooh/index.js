"use strict";
/**
 * DOOH - Digital Out of Home Advertising Network
 * Screen management, ad delivery, and playlist generation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOOHNetwork = exports.createScreenManager = exports.createRevenueCalculator = exports.createDeliveryEngine = exports.createPlaylistGenerator = void 0;
exports.createDOOHNetwork = createDOOHNetwork;
// Re-export types
__exportStar(require("./types"), exports);
// Re-export services
var playlist_service_1 = require("./services/playlist.service");
Object.defineProperty(exports, "createPlaylistGenerator", { enumerable: true, get: function () { return playlist_service_1.createPlaylistGenerator; } });
var delivery_service_1 = require("./services/delivery.service");
Object.defineProperty(exports, "createDeliveryEngine", { enumerable: true, get: function () { return delivery_service_1.createDeliveryEngine; } });
Object.defineProperty(exports, "createRevenueCalculator", { enumerable: true, get: function () { return delivery_service_1.createRevenueCalculator; } });
var screen_service_1 = require("./services/screen.service");
Object.defineProperty(exports, "createScreenManager", { enumerable: true, get: function () { return screen_service_1.createScreenManager; } });
/**
 * DOOH Network - Screen delivery layer for AdOS
 */
class DOOHNetwork {
    constructor() {
        const { createDeliveryEngine } = require('./services/delivery.service');
        const { createPlaylistGenerator } = require('./services/playlist.service');
        const { createScreenManager } = require('./services/screen.service');
        this.deliveryEngine = createDeliveryEngine();
        this.playlistGenerator = createPlaylistGenerator();
        this.screenManager = createScreenManager();
    }
    getAdsForScreen(screenId, campaigns) {
        const screen = this.screenManager.get(screenId);
        if (!screen)
            throw new Error('Screen not found');
        const request = {
            screen_id: screenId,
            available_slots: 10,
            context: this.buildContext()
        };
        return this.deliveryEngine.getAdsForScreen(request, screen, campaigns);
    }
    generatePlaylist(screenId, campaigns) {
        const screen = this.screenManager.get(screenId);
        if (!screen)
            throw new Error('Screen not found');
        return this.playlistGenerator.generatePlaylist({
            screen_id: screenId,
            date: new Date(),
            duration: 3600,
            time_slots: [{ start: '09:00', end: '22:00', slot_type: 'standard' }]
        }, screen, campaigns);
    }
    getStats() {
        return this.screenManager.getStats();
    }
    buildContext() {
        const isWeekend = [0, 6].includes(new Date().getDay());
        return {
            time: new Date().toISOString(),
            day_type: isWeekend ? 'weekend' : 'weekday',
            audience: {
                primary: [],
                peak_hours: [],
                avg_dwell_time: 300
            }
        };
    }
}
exports.DOOHNetwork = DOOHNetwork;
function createDOOHNetwork() {
    return new DOOHNetwork();
}
//# sourceMappingURL=index.js.map