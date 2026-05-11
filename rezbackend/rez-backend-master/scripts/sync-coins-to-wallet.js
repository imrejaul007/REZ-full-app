/**
 * One-time script to sync existing CoinTransaction balances to Wallet
 * Run this to migrate coins earned before the wallet sync fix
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function syncCoinsToWallet() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI ;);
    console.log('✅ Connected to MongoDB');

    // Import models
    const CoinTransaction = require('../src/models/CoinTransaction').CoinTransaction;
    const Wallet = require('../src/models/Wallet').Wallet;
    const User = require('../src/models/User').User;

    // Get all users
    const users = await User.find({});
    console.log(`\n📊 Found ${users.length} users\n`);

    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Get CoinTransaction balance
        const coinBalance = await CoinTransaction.getUserBalance(user._id.toString());

        if (coinBalance === 0) {
          console.log(`⏭️  Skipping ${user.name || user.phone} (0 coins)`);
          skippedCount++;
          continue;
        }

        // Find or create wallet
        let wallet = await Wallet.findOne({ user: user._id });

        if (!wallet) {
          // Create new wallet
          wallet = await Wallet.create({
            user: user._id,
            balance: {
              total: coinBalance,
              available: coinBalance,
              pending: 0,
              paybill: 0
            },
            coins: [
              {
                type: 'wasil',
                amount: coinBalance,
                isActive: true,
                earnedDate: new Date()
              }
            ],
            statistics: {
              totalEarned: coinBalance,
              totalSpent: 0,
              totalCashback: 0,
              totalRefunds: 0,
              totalTopups: 0,
              totalWithdrawals: 0,
              totalPayBill: 0,
              totalPayBillDiscount: 0
            }
          });
          console.log(`✅ Created wallet for ${user.name || user.phone}: ${coinBalance} coins`);
        } else {
          // Update existing wallet
          const currentWasilCoins = wallet.coins.find(c => c.type === 'wasil')?.amount || 0;

          if (currentWasilCoins === coinBalance) {
            console.log(`✓  Already synced: ${user.name || user.phone} (${coinBalance} coins)`);
            skippedCount++;
            continue;
          }

          // Find or create wasil coin entry
          let wasilCoin = wallet.coins.find(c => c.type === 'wasil');

          if (!wasilCoin) {
            wallet.coins.push({
              type: 'wasil',
              amount: coinBalance,
              isActive: true,
              earnedDate: new Date()
            });
          } else {
            // Set to CoinTransaction balance (don't add, replace)
            const difference = coinBalance - currentWasilCoins;
            wasilCoin.amount = coinBalance;

            // Update wallet balance
            wallet.balance.available += difference;
            wallet.balance.total += difference;
            wallet.statistics.totalEarned += difference;
          }

          wallet.lastTransactionAt = new Date();
          await wallet.save();

          console.log(`✅ Synced ${user.name || user.phone}: ${currentWasilCoins} → ${coinBalance} coins (+${coinBalance - currentWasilCoins})`);
        }

        syncedCount++;
      } catch (error) {
        console.error(`❌ Error syncing ${user.name || user.phone}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Sync Complete:`);
    console.log(`   ✅ Synced: ${syncedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${users.length}\n`);

  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
syncCoinsToWallet();
