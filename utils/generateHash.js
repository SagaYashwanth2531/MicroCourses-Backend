const crypto = require('crypto');

exports.generateCertificateHash = (userId, courseId) => {
  const data = `${userId}-${courseId}-${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};