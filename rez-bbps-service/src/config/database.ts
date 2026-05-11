/**
 * Database Configuration
 * MongoDB connection setup
 */

import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bbps';
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;

interface ConnectionOptions extends ConnectOptions {
  useNewUrlParser?: boolean;
  useUnifiedTopology?: boolean;
}

const getConnectionOptions = (): ConnectionOptions => {
  const options: ConnectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  return options;
};

/**
 * Connect to MongoDB
 */
export async function connectDatabase(): Promise<void> {
  try {
    let uri = MONGODB_URI;

    // Add authentication if credentials are provided
    if (MONGODB_USER && MONGODB_PASSWORD) {
      const url = new URL(MONGODB_URI);
      url.username = MONGODB_USER;
      url.password = MONGODB_PASSWORD;
      uri = url.toString();
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(uri, getConnectionOptions());

    console.log('MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
}

/**
 * Check database connection status
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Get connection state description
 */
export function getConnectionState(): string {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
}

export default {
  connect: connectDatabase,
  disconnect: disconnectDatabase,
  isConnected,
  getConnectionState
};
