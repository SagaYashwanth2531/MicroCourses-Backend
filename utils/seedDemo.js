const User = require('../model/User');
const Course = require('../model/Course');

exports.seedDemoData = async () => {
  try {
    const coursesCount = await Course.countDocuments({});
    if (coursesCount > 0) {
      return;
    }

    // Ensure admin exists to use as creator
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mail.com';
    const admin = await User.findOne({ email: adminEmail });
    if (!admin) return;

    const course = await Course.create({
      title: 'Intro to MicroCourses',
      description: 'A quick sample course to demonstrate the LMS workflow.',
      creator: admin._id,
      status: 'published',
      lessons: []
    });

    course.lessons.push({
      title: 'Welcome',
      content: 'Welcome to the MicroCourses LMS demo! This lesson explains the basics.',
      videoUrl: '',
      orderIndex: 0,
      duration: 5,
      transcript: 'Auto-generated transcript: Welcome to the MicroCourses LMS demo!'
    });

    course.lessons.push({
      title: 'Your First Steps',
      content: 'Enroll, complete lessons, and generate your certificate when done.',
      videoUrl: '',
      orderIndex: 1,
      duration: 7,
      transcript: 'Auto-generated transcript: Enroll, complete lessons, and generate your certificate.'
    });

    await course.save();
    console.log('Seeded demo course');
  } catch (err) {
    console.error('Demo seed error:', err);
  }
};


