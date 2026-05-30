import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

/**
 * Wraps every successful API response in a consistent envelope:
 * { success: true, data: <original response> }
 *
 * This mirrors the ApiResponse<T> type in @velonix/types.
 * Responses that are already shaped (webhooks, file downloads) can
 * opt out by adding a @SkipResponseWrap() decorator.
 */
@Injectable()
export class ResponseWrapInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        // Pass through null/undefined (e.g. 204 No Content)
        if (data === null || data === undefined) return data;

        // If the response is already wrapped, don't double-wrap
        if (
          typeof data === "object" &&
          "success" in data &&
          typeof (data as Record<string, unknown>)["success"] === "boolean"
        ) {
          return data;
        }

        return { success: true, data };
      })
    );
  }
}
