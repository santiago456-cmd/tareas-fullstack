import { randomUUID } from 'node:crypto';

export function requestLogger(req, res, next) {
  const start = Date.now();
  const path = req.originalUrl.split('?')[0];
  req.requestId = randomUUID();
  res.set('X-Request-Id', req.requestId);
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      JSON.stringify({
        event: 'request',
        requestId: req.requestId,
        status: res.statusCode,
        method: req.method,
        path,
        durationMs: duration,
      })
    );
  });
  next();
}
