import type {
  IncomingMessage,
  OutgoingHttpHeaders,
  ServerResponse
} from 'http';

class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

const readBody = async (req: IncomingMessage, maxBytes: number) => {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;

    if (size > maxBytes) {
      throw new HttpError(413, 'The request is too large.');
    }

    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks);

  return body.toString('utf8');
};

const getBearerToken = (req: IncomingMessage) => {
  const match = req.headers.authorization?.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim();
};

const getLastPathSegment = (req: IncomingMessage) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const segments = pathname.split('/');

  return segments[segments.length - 1];
};

// ffmpeg's whip client (and the apps built on it) reads the end of a chunked
// body as a failure, so every response states its length
const send = (
  res: ServerResponse,
  status: number,
  body = '',
  headers: OutgoingHttpHeaders = {}
) => {
  res.writeHead(status, {
    ...headers,
    'content-length': Buffer.byteLength(body)
  });
  res.end(body);
};

const sendText = (res: ServerResponse, status: number, text: string) =>
  send(res, status, text, { 'content-type': 'text/plain' });

export {
  getBearerToken,
  getLastPathSegment,
  HttpError,
  readBody,
  send,
  sendText
};
