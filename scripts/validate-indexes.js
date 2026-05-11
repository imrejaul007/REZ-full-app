const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function validateIndexes() {
  const models = ['Order', 'Product', 'Merchant', 'Store'];
  const requiredIndexes = {
    Order: ['user', 'items.product', 'merchantId'],
    Product: ['store', 'inventory.isAvailable'],
    Merchant: ['categories'],
    Store: ['location.city', 'category']
  };

  // Validate each model
  for (const modelName of models) {
    const Model = mongoose.model(modelName);
    const indexes = Object.keys(Model.schema.indexes());
    const required = requiredIndexes[modelName];

    for (const idx of required) {
      if (!indexes.includes(idx)) {
        console.error(`Missing index: ${modelName}.${idx}`);
        process.exit(1);
      }
    }
  }

  console.log('All indexes validated');
}

validateIndexes();
