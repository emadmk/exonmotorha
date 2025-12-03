import mongoose from 'mongoose';
import { config } from './config';
import { User, UserSettings, Technician } from './models';

const seedData = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB');

    // Create Admin
    const adminExists = await User.findOne({ phone: '09132952622' });
    if (!adminExists) {
      const admin = await User.create({
        phone: '09132952622',
        email: 'emad.devel@gmail.com',
        name: 'مدیر سیستم',
        role: 'admin',
      });
      await UserSettings.create({ userId: admin._id });
      console.log('✅ Admin created:', admin.phone);
    } else {
      console.log('ℹ️ Admin already exists');
    }

    // Create Technician
    const techExists = await User.findOne({ phone: '09199061003' });
    if (!techExists) {
      const tech = await User.create({
        phone: '09199061003',
        name: 'تکنسین اول',
        role: 'technician',
      });
      await UserSettings.create({ userId: tech._id });
      await Technician.create({
        userId: tech._id,
        specialties: ['سرویس دوره‌ای', 'تعمیر موتور', 'برقی'],
        rating: 4.8,
        totalJobs: 150,
        completedJobs: 145,
        isAvailable: true,
        serviceAreas: ['تهران', 'کرج'],
        bio: 'تکنسین با تجربه با بیش از ۱۰ سال سابقه کار',
      });
      console.log('✅ Technician created:', tech.phone);
    } else {
      console.log('ℹ️ Technician already exists');
    }

    // Create Customer
    const customerExists = await User.findOne({ phone: '09133422859' });
    if (!customerExists) {
      const customer = await User.create({
        phone: '09133422859',
        name: 'مشتری اول',
        role: 'customer',
      });
      await UserSettings.create({ userId: customer._id });
      console.log('✅ Customer created:', customer.phone);
    } else {
      console.log('ℹ️ Customer already exists');
    }

    console.log('\n🎉 Seed completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
