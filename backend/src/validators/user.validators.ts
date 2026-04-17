import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  companyName: z.string().min(2).max(120),
  currency: z.string().min(3).max(5).default('USD'),
  avatar: z.string().url().optional().or(z.literal('').transform(() => undefined)),
});