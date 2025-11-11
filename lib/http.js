export async function parseJsonBody(req) {
  const hasBuffer = typeof Buffer !== 'undefined';

  if (
    req.body &&
    typeof req.body === 'object' &&
    (!hasBuffer || !Buffer.isBuffer(req.body)) &&
    typeof req.body.text !== 'function' &&
    typeof req.body.arrayBuffer !== 'function'
  ) {
    return req.body;
  }

  const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

  async function readBody() {
    if (typeof req.body === 'string') {
      return req.body;
    }

    if (hasBuffer && req.body && Buffer.isBuffer(req.body)) {
      return req.body.toString('utf8');
    }

    if (req.body && typeof req.body.text === 'function') {
      return await req.body.text();
    }

    if (typeof req.text === 'function') {
      return await req.text();
    }

    if (req.body && typeof req.body.arrayBuffer === 'function') {
      const buffer = await req.body.arrayBuffer();
      if (hasBuffer) {
        return Buffer.from(buffer).toString('utf8');
      }
      return textDecoder ? textDecoder.decode(buffer) : '';
    }

    const chunks = [];

    if (typeof req[Symbol.asyncIterator] === 'function') {
      for await (const chunk of req) {
        chunks.push(chunk);
      }
    }

    if (chunks.length === 0) {
      return '';
    }

    const firstChunk = chunks[0];

    if (typeof firstChunk === 'string') {
      return chunks.join('');
    }

    if (hasBuffer && Buffer.isBuffer(firstChunk)) {
      return Buffer.concat(chunks).toString('utf8');
    }

    if (textDecoder) {
      let totalLength = 0;
      let onlyBinaryChunks = true;

      for (const chunk of chunks) {
        const isArrayBuffer = typeof ArrayBuffer !== 'undefined' && chunk instanceof ArrayBuffer;
        const isBinaryChunk =
          chunk instanceof Uint8Array ||
          isArrayBuffer ||
          (typeof chunk?.byteLength === 'number' && typeof chunk?.byteOffset === 'number');

        if (!isBinaryChunk) {
          onlyBinaryChunks = false;
          break;
        }

        const length =
          typeof chunk.length === 'number' && chunk.length >= 0
            ? chunk.length
            : typeof chunk.byteLength === 'number'
              ? chunk.byteLength
              : 0;
        totalLength += length;
      }

      if (onlyBinaryChunks) {
        const merged = new Uint8Array(totalLength);
        let offset = 0;

        for (const chunk of chunks) {
          let view;

          if (chunk instanceof Uint8Array) {
            view = chunk;
          } else if (typeof ArrayBuffer !== 'undefined' && chunk instanceof ArrayBuffer) {
            view = new Uint8Array(chunk);
          } else {
            view = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          }

          merged.set(view, offset);
          offset += view.length;
        }

        return textDecoder.decode(merged);
      }
    }

    return chunks.map(chunk => String(chunk)).join('');
  }

  const rawBody = await readBody();

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
