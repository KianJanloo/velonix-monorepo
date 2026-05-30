import { PipeTransform, BadRequestException } from "@nestjs/common";
import type { ZodSchema } from "zod";

/**
 * Coerce string values from query-params into the primitive types Zod expects.
 * HTTP query strings deliver everything as strings, so "1" must become 1 and
 * "true" must become true before Zod's number / boolean validators run.
 *
 * Only plain objects (query-param bags) are coerced; body payloads that are
 * already typed (e.g. JSON bodies) pass through unchanged.
 */
function coerceQueryParams(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const coerced: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string") {
      // Boolean
      if (v === "true") { coerced[k] = true; continue; }
      if (v === "false") { coerced[k] = false; continue; }
      // Integer
      if (/^-?\d+$/.test(v)) { coerced[k] = parseInt(v, 10); continue; }
      // Float
      if (/^-?\d+\.\d+$/.test(v)) { coerced[k] = parseFloat(v); continue; }
    }
    coerced[k] = v;
  }
  return coerced;
}

export class ZodValidationPipe implements PipeTransform {
  constructor(
    private readonly schema: ZodSchema,
    /** Pass `true` when the value comes from @Query() so strings are coerced */
    private readonly isQuery = false,
  ) {}

  transform(value: unknown) {
    const parsed = this.isQuery ? coerceQueryParams(value) : value;
    const result = this.schema.safeParse(parsed);
    if (!result.success) {
      throw new BadRequestException({
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: result.error.flatten(),
        },
      });
    }
    return result.data;
  }
}
