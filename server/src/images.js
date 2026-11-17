import { Router } from 'express';
import { HttpError } from './errors.js';
import { id } from './validation.js';

export function imageRoutes(db) {
  const router = Router();
  router.post('/card-images', async (req, res) => {
    const bytes = req.body;
    const type = req.get('Content-Type');
    const valid =
      Buffer.isBuffer(bytes) &&
      bytes.length > 12 &&
      ((type === 'image/png' &&
        bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
        (type === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ||
        (type === 'image/webp' &&
          bytes.toString('ascii', 0, 4) === 'RIFF' &&
          bytes.toString('ascii', 8, 12) === 'WEBP'));
    if (!valid)
      throw new HttpError(400, 'Choose a PNG, JPEG, or WebP image under 2 MB.', 'invalid_image');
    if ((await db.collection('CardImages').countDocuments({ userId: req.auth.user._id })) >= 100)
      throw new HttpError(409, 'This account has reached its 100-image limit.', 'image_limit');
    const result = await db
      .collection('CardImages')
      .insertOne({ userId: req.auth.user._id, bytes, type, createdAt: new Date() });
    res.status(201).json({ id: String(result.insertedId) });
  });
  router.get('/card-images/:id', async (req, res) => {
    const image = await db
      .collection('CardImages')
      .findOne({ _id: id(req.params.id), userId: req.auth.user._id });
    if (!image) throw new HttpError(404, 'This image could not be found.', 'not_found');
    res.type(image.type).send(Buffer.from(image.bytes.buffer));
  });
  return router;
}
