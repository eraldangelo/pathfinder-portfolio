import { z } from 'zod';

export const forcePasswordResetBodySchema = z.object({
  password: z.string().trim().min(8).max(128),
});
