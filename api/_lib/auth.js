// /api/_lib/http.js
export function ok(res, data = {}, status = 200) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).end(JSON.stringify(data));
}
export function err(res, message = 'Unexpected error', status = 500, extra = {}) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).end(JSON.stringify({ success: false, message, ...extra }));
}
export function withCors(req, res, methods = 'GET, POST, OPTIONS', headers = 'Content-Type, Authorization, x-admin-token') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);
  if (req.method === 'OPTIONS') return ok(res, { success: true }, 200);
  return null;
}
export function methodGuard(req, res, allowed = ['GET']) {
  if (!allowed.includes(req.method)) {
    return err(res, `Use ${allowed.join('/')}`, 405);
  }
  return null;
}
