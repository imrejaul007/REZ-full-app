"use strict";
/**
 * DOOH Screen Management API
 * Handles screen registration, heartbeats, and playlist generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dooh_1 = require("../dooh");
const router = (0, express_1.Router)();
const doohNetwork = (0, dooh_1.createDOOHNetwork)();
/**
 * POST /api/screens/register
 * Register a new screen in the network
 */
router.post('/screens/register', async (req, res) => {
    try {
        const { id, name, type, location } = req.body;
        if (!id || !name || !type) {
            return res.status(400).json({ error: 'Missing required fields: id, name, type' });
        }
        const screen = {
            id,
            name,
            type,
            location_type: location?.type || 'other',
            location: location || { city: 'Unknown', area: 'Unknown', lat: 0, lng: 0 },
            owner_id: req.body.owner_id || 'system',
            owner_type: 'partner',
            status: 'active',
        };
        // Register with DOOH network
        doohNetwork.screens.register(screen);
        res.json({
            success: true,
            screen_id: id,
            message: 'Screen registered successfully',
        });
    }
    catch (error) {
        console.error('Screen registration error:', error);
        res.status(500).json({ error: 'Failed to register screen' });
    }
});
/**
 * GET /api/screens
 * List all screens in the network
 */
router.get('/screens', async (req, res) => {
    try {
        const { type, city, status } = req.query;
        const filters = {};
        if (type)
            filters.type = type;
        if (city)
            filters.city = city;
        if (status)
            filters.status = status;
        const screens = doohNetwork.screens.query(filters);
        res.json({
            success: true,
            screens,
            total: screens.length,
        });
    }
    catch (error) {
        console.error('List screens error:', error);
        res.status(500).json({ error: 'Failed to list screens' });
    }
});
/**
 * POST /api/screens/:id/heartbeat
 * Process screen heartbeat
 */
router.post('/screens/:id/heartbeat', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, playlist_version, timestamp } = req.body;
        const heartbeat = {
            screen_id: id,
            status: status || 'active',
            playlist_version: playlist_version || 0,
            timestamp: new Date(timestamp || Date.now()),
        };
        const contentUpdate = doohNetwork.screens.processHeartbeat(heartbeat);
        res.json({
            success: true,
            needs_update: !!contentUpdate,
            content: contentUpdate,
        });
    }
    catch (error) {
        console.error('Heartbeat error:', error);
        res.status(500).json({ error: 'Failed to process heartbeat' });
    }
});
/**
 * GET /api/screens/:id/playlist
 * Get playlist for a screen
 */
router.get('/screens/:id/playlist', async (req, res) => {
    try {
        const { id } = req.params;
        const { campaign_ids } = req.query;
        const screen = doohNetwork.screens.get(id);
        if (!screen) {
            return res.status(404).json({ error: 'Screen not found' });
        }
        // Get active campaigns for this screen type
        // In production, this would query from database
        const campaigns = []; // Would come from AdOS allocation engine
        const playlist = doohNetwork.generatePlaylist(id, campaigns);
        res.json({
            success: true,
            playlist,
        });
    }
    catch (error) {
        console.error('Playlist error:', error);
        res.status(500).json({ error: 'Failed to generate playlist' });
    }
});
/**
 * GET /api/screens/stats
 * Get network statistics
 */
router.get('/screens/stats', async (req, res) => {
    try {
        const stats = doohNetwork.getStats();
        res.json({
            success: true,
            stats,
        });
    }
    catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});
exports.default = router;
//# sourceMappingURL=screens.js.map