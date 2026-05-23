import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

interface ErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<FastifyRequest>();
    const res = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      code = exception.name.replace(/Exception$/, '').replace(/([A-Z])/g, '_$1').replace(/^_/, '').toUpperCase();
      if (typeof response === 'string') {
        message = response;
      } else if (response && typeof response === 'object') {
        const payload = response as { message?: unknown; error?: unknown };
        if (typeof payload.message === 'string') {
          message = payload.message;
        } else if (Array.isArray(payload.message)) {
          message = 'Validation failed';
          details = payload.message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const requestId = (req.headers['x-request-id'] as string | undefined) ?? req.id;
    const body: ErrorBody = {
      statusCode: status,
      code,
      message,
      ...(details ? { details } : {}),
      ...(requestId ? { requestId } : {}),
      timestamp: new Date().toISOString(),
      path: req.url,
    };

    if (status >= 500) {
      this.logger.error({ err: exception, requestId, path: req.url }, message);
    }

    void res.status(status).send(body);
  }
}
