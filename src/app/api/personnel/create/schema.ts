import { z } from 'zod';

const trimmedRequiredString = (max: number) =>
  z.string().trim().min(1).max(max);

export const personnelCreateBodySchema = z.object({
  firstName: trimmedRequiredString(80),
  lastName: trimmedRequiredString(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  role: trimmedRequiredString(80),
  branch: trimmedRequiredString(80),
  preferredName: z.string().trim().max(80).optional().default(''),
});
