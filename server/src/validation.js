import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { HttpError } from './errors.js';

const name = z.string().trim().min(1).max(60);
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Use a valid resource ID.');
const password = z
  .string()
  .min(8)
  .max(128)
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'Passwords can contain at most 72 UTF-8 bytes.',
  );
const login = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z\d_.-]{3,32}$/i);
export const schemas = {
  register: z
    .object({
      firstName: name,
      lastName: name,
      email: z.email().trim().toLowerCase().max(254),
      login,
      password,
    })
    .strict(),
  login: z
    .object({
      login: z.string().trim().toLowerCase().min(1).max(254),
      password: z.string().min(1).max(128),
    })
    .strict(),
  course: z
    .object({
      name: z.string().trim().min(1).max(100),
      code: z.string().trim().max(30).default(''),
      color: z
        .string()
        .regex(/^(purple|blue|peach|#[a-f\d]{6})$/i)
        .default('purple'),
    })
    .strict(),
  deck: z
    .object({
      title: z.string().trim().min(1).max(80),
      description: z.string().trim().max(240).default(''),
      courseId: objectId.nullable().default(null),
    })
    .strict(),
  card: z
    .object({ front: z.string().trim().min(1).max(1000), back: z.string().trim().min(1).max(3000) })
    .strict(),
  session: z
    .object({
      deckId: objectId,
      courseId: objectId.nullable().optional(),
      deckTitle: z.string().max(80).optional(),
      clientSessionId: z.uuid().optional(),
      startedAt: z.iso.datetime(),
      endedAt: z.iso.datetime(),
      cardsReviewed: z.number().int().min(1).max(10000),
      cardsCorrect: z.number().int().min(0).max(10000),
    })
    .strict()
    .refine(
      (value) => value.cardsCorrect <= value.cardsReviewed,
      'Correct cards cannot exceed reviewed cards.',
    )
    .refine(
      (value) => new Date(value.endedAt) >= new Date(value.startedAt),
      'The session end must follow its start.',
    )
    .refine(
      (value) => new Date(value.endedAt).getTime() <= Date.now() + 60000,
      'The session cannot end in the future.',
    ),
  activation: z.object({ isActive: z.boolean() }).strict(),
};

export function validate(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new HttpError(
      400,
      result.error.issues
        .map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`)
        .join(' '),
      'validation_failed',
    );
  return result.data;
}
export function id(value) {
  if (!/^[a-f\d]{24}$/i.test(value))
    throw new HttpError(400, 'Use a valid resource ID.', 'invalid_id');
  return new ObjectId(value);
}
export function limit(value, fallback = 500, maximum = 1000) {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > maximum)
    throw new HttpError(400, `Limit must be between 1 and ${maximum}.`, 'validation_failed');
  return number;
}
