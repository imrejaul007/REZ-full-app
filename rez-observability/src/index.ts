/**
 * REZ Observability Service
 * Centralized logging and tracing
 */

import express from 'express';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '4031', 10);
const MONGODB = process.env.MONGODB_URI || '';  // REQUIRED: Set MONGODB_URI env var

// Log Entry Schema
const logEntrySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  correlation_id: { type: String, index: true },
  service: { type: String, required: true, index: true },
  event_type: {
    type: String,
    enum: ['started', 'received', 'processed', 'error', 'warning', 'decision', 'feedback', 'learned'],
    required: true
  },
  level: { type: String, enum: ['debug', 'info', 'warn', 'error'], default: 'info' },
  message: String,
  details: mongoose.Schema.Types.Mixed,
  duration_ms: Number,
});

// Trace Schema (full journey)
const traceSchema = new mongoose.Schema({
  correlation_id: { type: String, required: true, unique: true, index: true },
  events: [{
    service: String,
    event_type: String,
    timestamp: Date,
    details: mongoose.Schema.Types.Mixed,
  }],
  created_at: { type: Date, default: Date.now },
  completed_at: Date,
  duration_ms: Number,
});

const LogEntry = mongoose.models.LogEntry || mongoose.model('LogEntry', logEntrySchema, 'observability_logs');
const Trace = mongoose.models.Trace || mongoose.model('Trace', traceSchema, 'observability_traces');

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'observability' });
});

// Log event
app.post('/log', async (req, res) => {
  try {
    const { correlation_id, service, event_type, level, message, details, duration_ms } = req.body;

    const log = new LogEntry({
      correlation_id,
      service,
      event_type,
      level: level || 'info',
      message,
      details,
      duration_ms,
    });

    await log.save();

    // Update trace if exists
    if (correlation_id) {
      await Trace.updateOne(
        { correlation_id },
        {
          $push: {
            events: {
              service,
              event_type,
              timestamp: new Date(),
              details,
            }
          }
        },
        { upsert: true }
      );
    }

    res.json({ logged: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start trace
app.post('/trace/start', async (req, res) => {
  try {
    const { correlation_id } = req.body;

    await Trace.findOneAndUpdate(
      { correlation_id },
      {
        correlation_id,
        events: [],
        created_at: new Date(),
      },
      { upsert: true }
    );

    res.json({ trace_started: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get trace
app.get('/trace/:correlation_id', async (req, res) => {
  try {
    const trace = await Trace.findOne({ correlation_id: req.params.correlation_id });
    if (!trace) {
      return res.status(404).json({ error: 'Trace not found' });
    }
    res.json({ trace });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get logs by correlation ID
app.get('/logs/:correlation_id', async (req, res) => {
  try {
    const logs = await LogEntry.find({ correlation_id: req.params.correlation_id })
      .sort({ timestamp: 1 });
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get logs by service
app.get('/logs/service/:service', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const logs = await LogEntry.find({ service: req.params.service })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string));
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats
app.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);

    const stats = await LogEntry.aggregate([
      { $match: { timestamp: { $gte: oneHourAgo } } },
      {
        $group: {
          _id: { service: '$service', event_type: '$event_type' },
          count: { $sum: 1 },
        }
      }
    ]);

    const errorCount = await LogEntry.countDocuments({
      timestamp: { $gte: oneHourAgo },
      level: 'error'
    });

    res.json({
      stats,
      errors_last_hour: errorCount,
      period: 'last_hour',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Feature flags dashboard
app.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 86400000);

    // Get recent errors
    const errors = await LogEntry.find({
      timestamp: { $gte: oneDayAgo },
      level: 'error'
    }).sort({ timestamp: -1 }).limit(20);

    // Get trace stats
    const completedTraces = await Trace.countDocuments({
      completed_at: { $gte: oneDayAgo }
    });

    const totalTraces = await Trace.countDocuments({
      created_at: { $gte: oneDayAgo }
    });

    res.json({
      errors_today: errors.length,
      recent_errors: errors.map(e => ({
        service: e.service,
        message: e.message,
        timestamp: e.timestamp,
        correlation_id: e.correlation_id,
      })),
      traces: {
        completed: completedTraces,
        total: totalTraces,
        completion_rate: totalTraces > 0 ? (completedTraces / totalTraces * 100).toFixed(2) + '%' : '0%',
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

mongoose.connect(MONGODB).then(() => {
  app.listen(PORT, () => {
    console.log(`Observability Service running on port ${PORT}`);
  });
}).catch(console.error);
