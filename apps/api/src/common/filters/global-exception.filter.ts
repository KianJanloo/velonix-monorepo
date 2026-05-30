import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger
} from "@nestjs/common";
import type { Request, Response } from "express";

/**
 * Global HTTP exception filter.
 * Normalises all errors into a consistent { success, error } shape
 * matching the ApiError type in @velonix/types.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_ERROR";
    let message = "An unexpected error occurred.";
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === "string") {
        message = body;
        code = "HTTP_ERROR";
      } else if (typeof body === "object" && body !== null) {
        const b = body as Record<string, unknown>;
        // Preserve our structured error format from ZodValidationPipe
        if (b["error"] && typeof b["error"] === "object") {
          const e = b["error"] as Record<string, unknown>;
          code = (e["code"] as string) ?? "HTTP_ERROR";
          message = (e["message"] as string) ?? exception.message;
          details = e["details"];
        } else {
          message = (b["message"] as string) ?? exception.message;
          code = "HTTP_ERROR";
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    }

    response.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
        path: request.url,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    });
  }
}
