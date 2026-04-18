import { z } from 'zod';

export const studyNaviSsoBodySchema = z
  .object({
    continueTo: z.string().max(1024).optional(),
  })
  .passthrough();
