export async function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  let rawBody = '';

  if (typeof req.body === 'string') {
    rawBody = req.body;
  } else if (Buffer.isBuffer(req.body)) {
    rawBody = req.body.toString('utf8');
  } else {
    for await (const chunk of req) {
      rawBody += chunk;
    }
  }

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch (error) {
    const parseError = new Error('Invalid JSON body');
    parseError.statusCode = 400;
    throw parseError;
  }
}

export function getQueryParams(req) {
  if (req.query && typeof req.query === 'object') {
    return req.query;
  }

  try {
    const host = req.headers?.host || 'localhost';
    const url = new URL(req.url || '/', `http://${host}`);
    const params = {};

    for (const [key, value] of url.searchParams.entries()) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        const existingValue = params[key];
        if (Array.isArray(existingValue)) {
          existingValue.push(value);
        } else {
          params[key] = [existingValue, value];
        }
      } else {
        params[key] = value;
      }
    }

    return params;
  } catch {
    return {};
  }
}
