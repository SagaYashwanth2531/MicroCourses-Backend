const User = require('../model/User');

exports.initializeAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      await User.create({
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        approvedCreator: false
      });
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
};