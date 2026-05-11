/**
 * DOOH - Digital Out of Home Advertising Network
 * Screen management, ad delivery, and playlist generation
 */
/**
 * Screen types in the network
 */
export type ScreenType = 'cab_tablet' | 'bus_shelter' | 'bus_interior' | 'train_display' | 'metro_screen' | 'flight_seatback' | 'flight_overhead' | 'flight_entrance' | 'flight_lavatory' | 'airport_display' | 'airport_kiosk' | 'airport_gate' | 'airport_lounge' | 'airport_billboard' | 'restaurant_tv' | 'hotel_lobby' | 'hotel_room' | 'mall_kiosk' | 'mall_directory' | 'gym_screen' | 'salon_display' | 'office_lobby' | 'office_elevator' | 'bus_shelter' | 'billboard_digital' | 'generic_display';
/**
 * Screen status
 */
export type ScreenStatus = 'active' | 'inactive' | 'offline' | 'maintenance';
/**
 * Screen location types
 */
export type LocationType = 'cab' | 'bus' | 'train' | 'metro' | 'flight' | 'airport_terminal' | 'airport_gate' | 'airport_lounge' | 'restaurant' | 'hotel' | 'hospital' | 'mall' | 'gym' | 'salon' | 'retail' | 'office' | 'coworking' | 'street' | 'highway' | 'other';
/**
 * Flight-specific context
 */
export interface FlightContext {
    flight_number: string;
    airline: string;
    origin: string;
    destination: string;
    departure_time: string;
    arrival_time: string;
    cabin_class: 'economy' | 'business' | 'first';
    seat_range: string;
}
/**
 * Airport-specific context
 */
export interface AirportContext {
    terminal: string;
    gate?: string;
    lounge_name?: string;
    passenger_flow: 'arrivals' | 'departures' | 'transit';
    peak_hours: string[];
}
/**
 * Geographic context
 */
export interface ScreenLocation {
    city: string;
    area: string;
    zone?: string;
    lat: number;
    lng: number;
    address?: string;
}
/**
 * Screen metadata
 */
export interface Screen {
    id: string;
    name: string;
    type: ScreenType;
    location_type: LocationType;
    location: ScreenLocation;
    hardware?: {
        model?: string;
        os?: string;
        resolution?: string;
        screen_size?: number;
    };
    network_id?: string;
    ip_address?: string;
    mac_address?: string;
    owner_id: string;
    owner_type: 'owned' | 'partner' | 'external';
    status: ScreenStatus;
    last_seen?: Date;
    last_sync?: Date;
    operating_hours?: {
        open: string;
        close: string;
        timezone: string;
    };
    audience_profile?: AudienceProfile;
    cpm: number;
    slot_pricing?: SlotPricing[];
    created_at: Date;
    updated_at: Date;
}
/**
 * Audience profile for a screen location
 */
export interface AudienceProfile {
    primary: AudienceSegment[];
    secondary?: AudienceSegment[];
    peak_hours: TimeSlot[];
    avg_dwell_time: number;
    daily_footfall?: number;
}
export interface AudienceSegment {
    type: 'office_workers' | 'students' | 'families' | 'tourists' | 'fitness' | 'foodies' | 'shoppers' | 'general';
    percentage: number;
}
export interface TimeSlot {
    start: string;
    end: string;
    day_type: 'weekday' | 'weekend' | 'all';
}
/**
 * Slot pricing for time-based advertising
 */
export interface SlotPricing {
    slot_type: 'prime' | 'standard' | 'off_peak';
    duration_seconds: number;
    price: number;
    multiplier: number;
}
/**
 * DOOH Campaign
 */
export interface DOOHCampaign {
    id: string;
    name: string;
    brand_id: string;
    creatives: Creative[];
    targeting: DOOHTargeting;
    budget: number;
    spent: number;
    start_date: Date;
    end_date: Date;
    schedule_type: 'continuous' | 'scheduled' | 'time_slots';
    screen_filter: ScreenFilter;
    status: 'draft' | 'active' | 'paused' | 'completed' | 'budget_exhausted';
    metrics: CampaignMetrics;
    created_at: Date;
    updated_at: Date;
}
/**
 * Creative asset
 */
export interface Creative {
    id: string;
    type: 'image' | 'video' | 'html5';
    url: string;
    duration: number;
    thumbnail?: string;
    name: string;
}
/**
 * DOOH targeting configuration
 */
export interface DOOHTargeting {
    cities?: string[];
    areas?: string[];
    screen_types?: ScreenType[];
    location_types?: LocationType[];
    audience_segments?: AudienceSegment['type'][];
    day_parts?: {
        morning?: boolean;
        afternoon?: boolean;
        evening?: boolean;
    };
    weekdays_only?: boolean;
    context_signals?: ContextSignal[];
}
/**
 * Context signals from ReZ Mind
 */
export interface ContextSignal {
    signal_type: 'weather' | 'time' | 'location_density' | 'event' | 'category_intent';
    condition: string;
    action: 'boost' | 'reduce' | 'show' | 'hide';
    campaign_id?: string;
}
/**
 * Screen filter for campaign
 */
export interface ScreenFilter {
    min_footfall?: number;
    audience_overlap?: number;
    cpm_max?: number;
    cpm_min?: number;
}
/**
 * Campaign metrics
 */
export interface CampaignMetrics {
    impressions: number;
    unique_impressions: number;
    scans: number;
    visits: number;
    purchases: number;
    revenue: number;
    scan_rate: number;
    visit_rate: number;
    purchase_rate: number;
    total_spent: number;
    cpm_actual: number;
    cpc_actual: number;
    cpu_actual: number;
    cpp_actual: number;
    last_updated: Date;
}
/**
 * Playlist for a screen
 */
export interface Playlist {
    id: string;
    screen_id: string;
    date: Date;
    slots: PlaylistSlot[];
    total_duration: number;
    generated_at: Date;
    version: number;
}
export interface PlaylistSlot {
    position: number;
    campaign_id: string;
    creative_id: string;
    start_time: string;
    duration: number;
    scheduled_impressions: number;
    actual_impressions?: number;
}
/**
 * Playlist generation request
 */
export interface PlaylistRequest {
    screen_id: string;
    date: Date;
    duration: number;
    time_slots: TimeSlotConfig[];
    context_signals?: ContextSignal[];
}
export interface TimeSlotConfig {
    start: string;
    end: string;
    slot_type: 'prime' | 'standard' | 'off_peak';
}
/**
 * Ad delivery request
 */
export interface DeliveryRequest {
    screen_id: string;
    available_slots: number;
    context: DeliveryContext;
}
export interface DeliveryContext {
    time: string;
    day_type: 'weekday' | 'weekend';
    weather?: 'sunny' | 'cloudy' | 'rainy';
    nearby_events?: string[];
    audience: AudienceProfile;
}
export interface DeliveryResponse {
    screen_id: string;
    slots: DeliverySlot[];
    generated_at: Date;
}
export interface DeliverySlot {
    position: number;
    campaign_id: string;
    creative: Creative;
    duration: number;
    priority: number;
    reason: string;
}
/**
 * Impression event
 */
export interface ImpressionEvent {
    screen_id: string;
    campaign_id: string;
    creative_id: string;
    timestamp: Date;
    duration_played: number;
    user_id?: string;
}
/**
 * Screen heartbeat
 */
export interface ScreenHeartbeat {
    screen_id: string;
    timestamp: Date;
    status: ScreenStatus;
    playlist_version: number;
    current_campaign_id?: string;
    impressions_last_hour: number;
    errors?: string[];
}
/**
 * Screen OS configuration
 */
export interface ScreenOSConfig {
    server_url: string;
    api_key: string;
    sync_interval: number;
    playlist_refresh: number;
    heartbeat_interval: number;
    offline_buffer_hours: number;
}
/**
 * Screen content update
 */
export interface ContentUpdate {
    screen_id: string;
    playlist: Playlist;
    creatives: Creative[];
    config: ScreenOSConfig;
    version: number;
    timestamp: Date;
}
/**
 * Context signal from ReZ Mind
 */
export interface ReZMindContext {
    location_cluster: string;
    time_pattern: string;
    category_intent: string[];
    spending_level: 'low' | 'medium' | 'high';
    density: 'sparse' | 'moderate' | 'dense';
    events: string[];
}
/**
 * Contextual ad decision
 */
export interface ContextualDecision {
    campaign_id: string;
    relevance_score: number;
    reasons: string[];
    context_match: string;
}
/**
 * Revenue model for DOOH
 */
export interface RevenueModel {
    type: 'cpm' | 'slot' | 'performance' | 'hybrid';
    cpm_rate?: number;
    slot_pricing?: SlotPricing[];
    performance_rate?: number;
    performance_metric?: 'scan' | 'visit' | 'purchase';
    base_cpm?: number;
    performance_bonus?: number;
}
/**
 * Revenue share model
 */
export interface RevenueShare {
    screen_owner: number;
    platform: number;
    content_provider?: number;
}
/**
 * Screen owner payout
 */
export interface PayoutRecord {
    screen_id: string;
    period_start: Date;
    period_end: Date;
    impressions: number;
    revenue: number;
    owner_share: number;
    platform_share: number;
    status: 'pending' | 'processed' | 'paid';
}
//# sourceMappingURL=types.d.ts.map