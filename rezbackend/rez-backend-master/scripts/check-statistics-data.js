// Check what statistics are being calculated
const mongoose = require('mongoose');
require('dotenv').config();

async function checkStatistics() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Review = mongoose.model('Review', new mongoose.Schema({}, { strict: false }));
    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    const UserAchievement = mongoose.model('UserAchievement', new mongoose.Schema({}, { strict: false }));

    // Get all users
    const users = await User.find({}).lean();

    console.log(`\n👥 Found ${users.length} users\n`);

    for (const user of users) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`👤 User: ${user._id}`);
      console.log(`   Name: ${user.profile?.firstName || 'Unknown'} ${user.profile?.lastName || ''}`);
      console.log(`   Phone: ${user.profile?.phoneNumber || 'N/A'}`);

      // Check wallet
      console.log(`\n💰 Wallet:`);
      console.log(`   Balance: ₹${user.wallet?.balance || 0}`);
      console.log(`   Total Earned: ₹${user.wallet?.totalEarned || 0}`);
      console.log(`   Total Spent: ₹${user.wallet?.totalSpent || 0}`);

      // Check reviews
      const reviews = await Review.find({ user: user._id, isActive: true }).lean();
      console.log(`\n⭐ Reviews:`);
      console.log(`   Total Reviews: ${reviews.length}`);
      if (reviews.length > 0) {
        reviews.forEach((review, i) => {
          console.log(`   ${i + 1}. Rating: ${review.rating}/5 - ${review.comment?.substring(0, 50) || 'No comment'}`);
        });
      }

      // Check orders
      const orders = await Order.find({
        user: user._id,
        status: { $ne: 'pending_payment' }
      }).lean();
      console.log(`\n📦 Orders (excluding pending_payment):`);
      console.log(`   Total Orders: ${orders.length}`);

      const totalSpentFromOrders = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      console.log(`   Total Spent (from orders): ₹${totalSpentFromOrders}`);

      // Check achievements
      const achievements = await UserAchievement.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unlocked: {
              $sum: { $cond: [{ $eq: ['$unlocked', true] }, 1, 0] }
            }
          }
        }
      ]);

      console.log(`\n🏆 Achievements (Badges):`);
      if (achievements.length > 0) {
        console.log(`   Unlocked: ${achievements[0].unlocked}`);
        console.log(`   Total: ${achievements[0].total}`);
      } else {
        console.log(`   None found`);
      }

      console.log(`\n📊 What Statistics API Would Return:`);
      console.log(`   Orders: ${orders.length}`);
      console.log(`   Spent: ₹${user.wallet?.totalSpent || 0} (from wallet.totalSpent)`);
      console.log(`   Badges: ${achievements[0]?.unlocked || 0}/${achievements[0]?.total || 0}`);
      console.log(`   Reviews: ${reviews.length}`);
    }

    await mongoose.disconnect();
    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Done\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkStatistics();
