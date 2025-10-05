const idempotencyCache = new Map();

exports.idempotency = (req, res, next) => {
  if (req.method !== 'POST') {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey) {
    return res.status(400).json({
      error: {
        code: 'MISSING_IDEMPOTENCY_KEY',
        message: 'Idempotency-Key header is required for POST requests',
        field: 'Idempotency-Key'
      }
    });
  }

  if (idempotencyCache.has(idempotencyKey)) {
    const cachedResponse = idempotencyCache.get(idempotencyKey);
    return res.status(cachedResponse.status).json(cachedResponse.data);
  }

  const originalJson = res.json.bind(res);
  res.json = function(data) {
    idempotencyCache.set(idempotencyKey, {
      status: res.statusCode,
      data
    });

    setTimeout(() => {
      idempotencyCache.delete(idempotencyKey);
    }, 24 * 60 * 60 * 1000);

    return originalJson(data);
  };

  next();
};
