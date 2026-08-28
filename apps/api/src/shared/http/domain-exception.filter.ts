import { STATUS_CODES } from "node:http";

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";

import { DomainException } from "../exceptions/domain-exception";

const UNKNOWN_STATUS = HttpStatus.INTERNAL_SERVER_ERROR;
const SERVER_ERROR_THRESHOLD = 500;

/** Register every new domain exception code here to map it to an HTTP status. */
const DOMAIN_STATUS_BY_CODE: Record<string, number> = {
  "AUTH.INVALID_CREDENTIALS": HttpStatus.UNAUTHORIZED,
  "SCHEDULING.SLOT_UNAVAILABLE": HttpStatus.CONFLICT,
  "SCHEDULING.PAST_DATE": HttpStatus.BAD_REQUEST,
  "PRODUCTS.NOT_FOUND": HttpStatus.NOT_FOUND,
  "PRODUCTS.IN_USE": HttpStatus.CONFLICT,
  "ORDERS.NOT_FOUND": HttpStatus.NOT_FOUND,
  "ORDERS.SLOT_UNAVAILABLE": HttpStatus.CONFLICT,
  "ORDERS.CART_INVALID": HttpStatus.BAD_REQUEST,
};

function errorPhrase(status: number): string {
  return STATUS_CODES[status] ?? "Error";
}

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= SERVER_ERROR_THRESHOLD) {
        this.logger.error(exception);
      }
      const body = exception.getResponse();
      if (typeof body === "string") {
        response.status(status).json({
          message: body,
          error: errorPhrase(status),
          statusCode: status,
        });
      } else {
        response.status(status).json(body);
      }
      return;
    }

    if (exception instanceof DomainException) {
      const status = DOMAIN_STATUS_BY_CODE[exception.code] ?? UNKNOWN_STATUS;
      if (status >= SERVER_ERROR_THRESHOLD) {
        this.logger.error(exception);
      }
      response.status(status).json({
        message: exception.message,
        error: errorPhrase(status),
        statusCode: status,
      });
      return;
    }

    this.logger.error(exception);
    response.status(UNKNOWN_STATUS).json({
      message: "Internal server error",
      error: errorPhrase(UNKNOWN_STATUS),
      statusCode: UNKNOWN_STATUS,
    });
  }
}
