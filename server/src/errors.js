export class HttpError extends Error {
  constructor(status, message, code = 'request_failed') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 11000)
    return res
      .status(409)
      .json({ error: 'That username, email, or course name is already in use.', code: 'conflict' });
  if (error.code === 121)
    return res
      .status(400)
      .json({
        error: 'The request does not match the database schema.',
        code: 'validation_failed',
      });
  if (error.type === 'entity.too.large')
    return res.status(413).json({ error: 'This request is too large.', code: 'request_too_large' });
  if (error instanceof SyntaxError && error.status === 400)
    return res.status(400).json({ error: 'Send a valid JSON request.', code: 'invalid_json' });
  if (error instanceof HttpError)
    return res.status(error.status).json({ error: error.message, code: error.code });
  console.error('StudySync request failed.', { code: error.code || 'internal_error' });
  return res
    .status(500)
    .json({
      error: 'The server could not complete this request. Please try again.',
      code: 'internal_error',
    });
}
