import { z } from 'zod';

export const personnelDeleteBodySchema = z.object({
  uid: z
    .string()
    .trim()
    .min(1)
    .max(128),
});
