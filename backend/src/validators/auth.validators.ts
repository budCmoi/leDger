import { z } from 'zod';

const optionalProfileText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .optional();

export const createFirebaseSessionSchema = z.object({
  idToken: z.string().min(1),
  profile: z
    .object({
      name: optionalProfileText(2, 80),
      companyName: optionalProfileText(2, 120),
    })
    .optional(),
});