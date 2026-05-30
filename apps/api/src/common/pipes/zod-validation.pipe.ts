import { PipeTransform, BadRequestException } from "@nestjs/common";
import type { ZodSchema } from "zod";

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
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
