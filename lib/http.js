let cachedTextDecoder = undefined;
let textDecoderInit = null;

async function getTextDecoder() {
  if (cachedTextDecoder !== undefined) {
    return cachedTextDecoder;
  }

  if (textDecoderInit) {
    await textDecoderInit;
    return cachedTextDecoder;
  }

  textDecoderInit = (async () => {
    if (typeof TextDecoder !== 'undefined') {
      cachedTextDecoder = new TextDecoder('utf-8');
      return;
    }

    try {
      const utilModule = await import('node:util');
      if (typeof utilModule.TextDecoder === 'function') {
        cachedTextDecoder = new utilModule.TextDecoder('utf-8');
        return;
      }
    } catch {
      // ignore
    }

    cachedTextDecoder = null;
  })();

  await textDecoderInit;
  return cachedTextDecoder;
}

export async function parseJsonBody(req) {
  const hasBuffer = typeof Buffer !== 'undefined';

  if (
    req.body &&
    typeof req.body === 'object' &&
    (!hasBuffer || !Buffer.isBuffer(req.body)) &&
    typeof req.body.text !== 'function' &&
    typeof req.body.arrayBuffer !== 'function' &&
    typeof req.body.getReader !== 'function'
  ) {
    return req.body;
  }

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
      const textDecoder = await getTextDecoder();
      return textDecoder ? textDecoder.decode(buffer) : '';
    }

    if (req.body && typeof req.body.getReader === 'function') {
      const reader = req.body.getReader();
      const chunks = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          if (value) {
            chunks.push(value);
          }
        }
      } finally {
        if (typeof reader.releaseLock === 'function') {
          reader.releaseLock();
        }
      }

      if (chunks.length === 0) {
        return '';
      }

      if (hasBuffer) {
        const buffers = chunks.map(chunk =>
          Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength)
        );
        return Buffer.concat(buffers).toString('utf8');
      }

      const textDecoder = await getTextDecoder();
      if (textDecoder) {
        let totalLength = 0;
        for (const chunk of chunks) {
          totalLength += chunk.byteLength ?? chunk.length ?? 0;
        }
        const merged = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          merged.set(
            chunk instanceof Uint8Array
              ? chunk
              : new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength),
            offset
          );
          offset += chunk.byteLength ?? chunk.length ?? 0;
        }
        return textDecoder.decode(merged);
      }

      return chunks.map(chunk => String(chunk)).join('');
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

    const textDecoder = await getTextDecoder();
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
