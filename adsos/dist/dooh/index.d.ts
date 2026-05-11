/**
 * DOOH - Digital Out of Home Advertising Network
 * Screen management, ad delivery, and playlist generation
 */
export * from './types';
export { createPlaylistGenerator } from './services/playlist.service';
export { createDeliveryEngine, createRevenueCalculator } from './services/delivery.service';
export { createScreenManager } from './services/screen.service';
/**
 * DOOH Network - Screen delivery layer for AdOS
 */
export declare class DOOHNetwork {
    private deliveryEngine;
    private playlistGenerator;
    private screenManager;
    constructor();
    getAdsForScreen(screenId: string, campaigns: any[]): any;
    generatePlaylist(screenId: string, campaigns: any[]): any;
    getStats(): any;
    private buildContext;
}
export declare function createDOOHNetwork(): DOOHNetwork;
//# sourceMappingURL=index.d.ts.map