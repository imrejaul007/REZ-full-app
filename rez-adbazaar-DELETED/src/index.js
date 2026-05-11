/**
 * REZ AdBazaar Service
 * Intent-based ad targeting powered by ReZ Mind
 */

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = 4025;
const MONGODB = 'mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-adbazaar';

// Ad Schema
const adSchema = new mongoose.Schema({
  ad_id: String,
  merchant_id: String,
  title: String,
  body: String,
  cta: String,
  image_url: String,
  category: String,
  targeting: {
    intents: [String],
    segments: [String],
    location: String,
    time_of_day: [String],
  },
  budget: {
    daily_limit: Number,
    total_limit: Number,
    spent: { type: Number, default: 0 },
  },
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
  stats: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
  },
  created_at: { type: Date, default: Date.now },
});

const Ad = mongoose.models.Ad || mongoose.model('Ad', adSchema, 'ads');

// Campaign Schema
const campaignSchema = new mongoose.Schema({
  campaign_id: String,
  name: String,
  ads: [String],
  status: { type: String, enum: ['draft', 'active', 'paused'], default: 'draft' },
  targeting: {
    intents: [String],
    segments: [String],
  },
  stats: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
  },
  created_at: { type: Date, default: Date.now },
});

const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema, 'campaigns');

// Segment definitions
const SEGMENTS = {
  foodies: { description: 'Frequent food orders, variety seekers', count: 1800 },
  deal_seekers: { description: 'Price sensitive, discount responsive', count: 950 },
  vip: { description: 'High LTV customers', count: 180 },
  new_users: { description: 'Joined within 7 days', count: 1200 },
  at_risk: { description: 'Inactive for 14+ days', count: 340 },
  wellness: { description: 'Spa, salon, fitness enthusiasts', count: 620 },
  travelers: { description: 'Currently outside home location', count: 150 },
};

// Intent mappings
const INTENT_AD_MAP = {
  'looking_for_food': ['restaurant_offer', 'food_delivery_deal', 'biryani_promo'],
  'looking_for_dinner': ['restaurant_dinner_deal', 'biryani_promo', 'free_delivery'],
  'looking_for_service': ['salon_promo', 'spa_offer', 'wellness_deal'],
  'ordering': ['free_delivery', 'first_order_discount', 'no_minimum'],
  'booking': ['salon_discount', 'hotel_offer', 'appointment_promo'],
  'browsing': ['general_promo', 'featured_deal'],
};

// Serve dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Routes
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'adbazaar' }));

app.get('/', (req, res) => {
  res.json({
    service: 'REZ AdBazaar',
    version: '1.0.0',
    description: 'Intent-based ad targeting powered by ReZ Mind',
    endpoints: {
      ads: 'GET/POST /ads',
      campaigns: 'GET/POST /campaigns',
      targeting: 'POST /targeting/predict',
      segments: 'GET /segments',
      stats: 'GET /stats',
      dashboard: 'GET /dashboard',
    },
  });
});

// Get all segments
app.get('/segments', (req, res) => {
  res.json({ segments: SEGMENTS });
});

// Get segment by name
app.get('/segments/:name', (req, res) => {
  const segment = SEGMENTS[req.params.name];
  if (!segment) return res.status(404).json({ error: 'Segment not found' });
  res.json({ name: req.params.name, ...segment });
});

// Create ad
app.post('/ads', async (req, res) => {
  try {
    const ad = new Ad({
      ad_id: `ad_${Date.now()}`,
      ...req.body,
    });
    await ad.save();
    res.json({ ad_id: ad.ad_id, status: 'created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all ads
app.get('/ads', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const query = status ? { status } : {};
    const ads = await Ad.find(query).limit(parseInt(limit));
    res.json({ ads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ad by ID
app.get('/ads/:id', async (req, res) => {
  try {
    const ad = await Ad.findOne({ ad_id: req.params.id });
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    res.json({ ad });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Intent-based ad targeting
app.post('/targeting/predict', (req, res) => {
  const { user_intent, user_segments, location, time } = req.body;

  // Get ads that match the intent
  const matchingAdTypes = INTENT_AD_MAP[user_intent] || INTENT_AD_MAP['browsing'];

  // Filter by segments
  let targetSegments = user_segments || [];

  const targeting = {
    user_intent,
    matched_ad_types: matchingAdTypes,
    target_segments: targetSegments,
    location,
    time,
    estimated_reach: Math.floor(Math.random() * 500) + 100,
    match_score: 0.75 + Math.random() * 0.2,
  };

  res.json({ targeting });
});

// Create campaign
app.post('/campaigns', async (req, res) => {
  try {
    const campaign = new Campaign({
      campaign_id: `campaign_${Date.now()}`,
      ...req.body,
      status: 'draft',
    });
    await campaign.save();
    res.json({ campaign_id: campaign.campaign_id, status: 'created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaigns
app.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.find();
    res.json({ campaigns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats
app.get('/stats', async (req, res) => {
  try {
    const totalAds = await Ad.countDocuments();
    const activeAds = await Ad.countDocuments({ status: 'active' });

    const stats = await Ad.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          total_impressions: { $sum: '$stats.impressions' },
          total_clicks: { $sum: '$stats.clicks' },
          total_conversions: { $sum: '$stats.conversions' },
        },
      },
    ]);

    const aggregated = stats[0] || { total_impressions: 0, total_clicks: 0, total_conversions: 0 };
    const ctr = aggregated.total_impressions > 0
      ? (aggregated.total_clicks / aggregated.total_impressions * 100).toFixed(2)
      : '0.00';

    res.json({
      total_ads: totalAds,
      active_ads: activeAds,
      impressions: aggregated.total_impressions,
      clicks: aggregated.total_clicks,
      conversions: aggregated.total_conversions,
      ctr: `${ctr}%`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard data
app.get('/dashboard', async (req, res) => {
  try {
    const stats = await Ad.aggregate([
      {
        $group: {
          _id: null,
          impressions: { $sum: '$stats.impressions' },
          clicks: { $sum: '$stats.clicks' },
          conversions: { $sum: '$stats.conversions' },
        },
      },
    ]);

    const recentAds = await Ad.find().sort({ created_at: -1 }).limit(10);

    res.json({
      segments: SEGMENTS,
      intent_map: INTENT_AD_MAP,
      stats: stats[0] || { impressions: 0, clicks: 0, conversions: 0 },
      recent_ads: recentAds.map(ad => ({
        ad_id: ad.ad_id,
        title: ad.title,
        status: ad.status,
        stats: ad.stats,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track impression
app.post('/track/impression', async (req, res) => {
  const { ad_id, user_segment } = req.body;

  await Ad.updateOne(
    { ad_id },
    {
      $inc: { 'stats.impressions': 1 },
    }
  );

  res.json({ tracked: true });
});

// Track click
app.post('/track/click', async (req, res) => {
  const { ad_id, user_segment } = req.body;

  await Ad.updateOne(
    { ad_id },
    {
      $inc: { 'stats.clicks': 1 },
    }
  );

  res.json({ tracked: true });
});

// Track conversion
app.post('/track/conversion', async (req, res) => {
  const { ad_id } = req.body;

  await Ad.updateOne(
    { ad_id },
    {
      $inc: { 'stats.conversions': 1 },
    }
  );

  res.json({ tracked: true });
});

mongoose.connect(MONGODB).then(() => {
  app.listen(PORT, () => {
    console.log(`AdBazaar running on port ${PORT}`);
  });
}).catch(console.error);
