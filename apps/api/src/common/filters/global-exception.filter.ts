import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger
} from "@nestjs/common";

interface HttpResponse {
  status(code: number): this;
  json(body: unknown): this;
}
interface HttpRequest {
  url: string;
  method: string;
}

const STATUS_CODES: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "VALIDATION_ERROR",
  429: "RATE_LIMITED",
  500: "INTERNAL_ERROR",
  503: "SERVICE_UNAVAILABLE",
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<HttpResponse>();
    const request = ctx.getRequest<HttpRequest>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_ERROR";
    let message = "An unexpected error occurred. Please try again.";
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      code = STATUS_CODES[statusCode] ?? "HTTP_ERROR";
      const body = exception.getResponse();

      if (typeof body === "string") {
        message = body;
      } else if (typeof body === "object" && body !== null) {
        const b = body as Record<string, unknown>;

        // Our ZodValidationPipe format: { error: { code, message, details } }
        if (b["error"] && typeof b["error"] === "object") {
          const e = b["error"] as Record<string, unknown>;
          code = (e["code"] as string) ?? code;
          message = (e["message"] as string) ?? message;
          details = e["details"];
        }
        // NestJS default format: { message: "...", error: "Unauthorized", statusCode }
        else if (Array.isArray(b["message"])) {
          message = (b["message"] as string[]).join("; ");
          details = b["message"];
        } else {
          message = (b["message"] as string) ?? exception.message ?? message;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `[${request.method}] ${request.url} — ${exception.message}`,
        exception.stack
      );
      // Don't leak internal error details in production
      if (process.env["NODE_ENV"] === "production") {
        message = "An unexpected error occurred. Please try again.";
      } else {
        message = exception.message;
      }
    } else {
      this.logger.error(`Unknown exception at ${request.url}`, String(exception));
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
