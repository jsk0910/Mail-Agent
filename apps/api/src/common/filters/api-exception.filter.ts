import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";

interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  path: string;
}

interface HttpRequestLike {
  url: string;
}

interface HttpResponseLike {
  status(code: number): HttpResponseLike;
  json(body: ApiErrorBody): void;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<HttpResponseLike>();
    const request = context.getRequest<HttpRequestLike>();

    const errorBody = this.buildErrorBody(exception, request.url);
    response.status(errorBody.statusCode).json(errorBody);
  }

  private buildErrorBody(exception: unknown, path: string): ApiErrorBody {
    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        return {
          statusCode,
          code: this.mapErrorCode(statusCode),
          message: exceptionResponse,
          timestamp,
          path
        };
      }

      const responseObject = exceptionResponse as Record<string, unknown>;
      const message = this.extractMessage(responseObject, exception.message);

      return {
        statusCode,
        code: this.extractCode(responseObject, statusCode),
        message,
        details: this.extractDetails(responseObject),
        timestamp,
        path
      };
    }

    const message = exception instanceof Error ? exception.message : "Internal server error";

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: "INTERNAL_SERVER_ERROR",
      message,
      timestamp,
      path
    };
  }

  private extractCode(responseObject: Record<string, unknown>, statusCode: number): string {
    const code = responseObject.code;
    return typeof code === "string" && code.length > 0 ? code : this.mapErrorCode(statusCode);
  }

  private extractMessage(responseObject: Record<string, unknown>, fallback: string): string {
    const message = responseObject.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    return typeof message === "string" && message.length > 0 ? message : fallback;
  }

  private extractDetails(responseObject: Record<string, unknown>): unknown {
    const details = responseObject.details;
    if (details !== undefined) {
      return details;
    }

    const message = responseObject.message;
    if (Array.isArray(message)) {
      return message;
    }

    return undefined;
  }

  private mapErrorCode(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return "BAD_REQUEST";
      case HttpStatus.UNAUTHORIZED:
        return "UNAUTHORIZED";
      case HttpStatus.FORBIDDEN:
        return "FORBIDDEN";
      case HttpStatus.NOT_FOUND:
        return "NOT_FOUND";
      case HttpStatus.CONFLICT:
        return "CONFLICT";
      default:
        return "INTERNAL_SERVER_ERROR";
    }
  }
}
