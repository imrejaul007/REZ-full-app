import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../config/logger';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  logger.info('Connected to DB');

  const stores = await mongoose.connection.db!.collection('stores').find({ 'location.city': 'Dubai' }).toArray();
  logger.info('Dubai stores count:', stores.length);

  if (stores.length > 0) {
    logger.info('First store ID:', stores[0]._id.toString());
    logger.info('First store name:', stores[0].name);

    const storeIds = stores.map((s) => s._id);
    const products = await mongoose.connection
      .db!.collection('products')
      .find({ store: { $in: storeIds } })
      .toArray();
    logger.info('Products in Dubai stores:', products.length);

    if (products.length > 0) {
      logger.info('Sample product:', products[0].name, 'Currency:', products[0].pricing?.currency);
    }
  }

  // Check AED products
  const aedProducts = await mongoose.connection
    .db!.collection('products')
    .find({ 'pricing.currency': 'AED' })
    .toArray();
  logger.info('AED products count:', aedProducts.length);
  if (aedProducts.length > 0) {
    logger.info('AED product names:', aedProducts.map((p) => p.name).join(', '));
  }

  await mongoose.disconnect();
  logger.info('Done');
}
check().catch(console.error);
