// @ts-nocheck
import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';
import { logger } from '../utils/logger';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

interface RabbitMQConfig {
  url: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export class RabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private config: RabbitMQConfig;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000;
  private isConnected: boolean = false;
  private consumers: Map<string, (msg: ConsumeMessage) => Promise<void>> = new Map();

  constructor(config?: Partial<RabbitMQConfig>) {
    this.config = {
      url: RABBITMQ_URL,
      reconnectAttempts: 5,
      reconnectInterval: 5000,
      ...config,
    };
    this.maxReconnectAttempts = this.config.reconnectAttempts || 5;
    this.reconnectInterval = this.config.reconnectInterval || 5000;
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.config.url);
      this.channel = await this.connection.createChannel();

      this.connection.on('error', (error) => {
        logger.error('RabbitMQ connection error', { error: error.message });
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
        this.handleReconnect();
      });

      this.isConnected = true;
      logger.info('RabbitMQ connected successfully');

    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.handleReconnect();
    }
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max RabbitMQ reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    logger.info(`Attempting RabbitMQ reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(async () => {
      await this.connect();
    }, this.reconnectInterval);
  }

  async publish(queue: string, message: unknown): Promise<boolean> {
    if (!this.channel || !this.isConnected) {
      logger.warn('RabbitMQ not connected, message not published');
      return false;
    }

    try {
      await this.channel.assertQueue(queue, { durable: true });
      this.channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
      return true;
    } catch (error) {
      logger.error('Failed to publish message', {
        queue,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async subscribe(
    queue: string,
    handler: (msg: ConsumeMessage) => Promise<void>
  ): Promise<void> {
    if (!this.channel || !this.isConnected) {
      logger.warn('RabbitMQ not connected, cannot subscribe');
      return;
    }

    try {
      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.prefetch(10);

      this.consumers.set(queue, handler);

      await this.channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            await handler(msg);
            this.channel?.ack(msg);
          } catch (error) {
            logger.error('Error processing message', {
              queue,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            // Reject and requeue
            this.channel?.nack(msg, false, true);
          }
        }
      });

      logger.info(`Subscribed to queue: ${queue}`);
    } catch (error) {
      logger.error('Failed to subscribe to queue', {
        queue,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async publishEvent(event: {
    type: string;
    userId: string;
    payload: unknown;
    timestamp: Date;
  }): Promise<boolean> {
    return this.publish('user_events', event);
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      logger.info('RabbitMQ connection closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
let rabbitMQInstance: RabbitMQService | null = null;

export const getRabbitMQ = (): RabbitMQService => {
  if (!rabbitMQInstance) {
    rabbitMQInstance = new RabbitMQService();
  }
  return rabbitMQInstance;
};

export default RabbitMQService;
