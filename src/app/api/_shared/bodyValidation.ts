import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readRequestTextWithinLimit } from './requestSize';

type ParseJsonOptions = {
  maxBytes: number;
  invalidMessage: string;
  tooLargeMessage?: string;
  allowEmptyObject?: boolean;
};

type ParseJsonResult<T> = {
  data: T | null;
  response: NextResponse | null;
};

export const parseJsonBodyWithSchema = async <T>(
  request: Request,
  schema: z.ZodType<T>,
  options: ParseJsonOptions,
): Promise<ParseJsonResult<T>> => {
  const sized = await readRequestTextWithinLimit(request, {
    maxBytes: options.maxBytes,
    tooLargeMessage: options.tooLargeMessage,
  });
  if (sized.response) {
    return { data: null, response: sized.response };
  }

  const trimmed = sized.text.trim();
  const source: unknown = trimmed
    ? (() => {
        try {
          return JSON.parse(trimmed);
        } catch {
          return null;
        }
      })()
    : options.allowEmptyObject
      ? {}
      : null;

  if (source === null) {
    return {
      data: null,
      response: NextResponse.json({ error: options.invalidMessage }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    return {
      data: null,
      response: NextResponse.json({ error: options.invalidMessage }, { status: 400 }),
    };
  }
  return { data: parsed.data, response: null };
};

