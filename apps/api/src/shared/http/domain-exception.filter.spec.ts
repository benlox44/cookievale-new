import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import type { Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InvalidCredentialsException } from "../../modules/auth/domain/exceptions/invalid-credentials.exception";
import { DomainException } from "../exceptions/domain-exception";
import { DomainExceptionFilter } from "./domain-exception.filter";

function mockHostWithResponse(response: Response): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
}

function mockResponse(): {
  response: Response;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
} {
  const status = vi.fn();
  const json = vi.fn();
  const response = {
    status,
    json,
  } as unknown as Response;
  status.mockReturnValue(response);
  json.mockReturnValue(response);
  return { response, status, json };
}

describe("DomainExceptionFilter", () => {
  const filter = new DomainExceptionFilter();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps a domain exception to its HTTP status and message", () => {
    const { response, status, json } = mockResponse();
    filter.catch(
      new InvalidCredentialsException(),
      mockHostWithResponse(response),
    );
    expect(status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(json).toHaveBeenCalledWith({
      message: "Incorrect password",
      error: "Unauthorized",
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  });

  it("maps any domain exception whose code is registered", () => {
    class CustomDomainException extends DomainException {
      constructor() {
        super("Custom failure", "AUTH.INVALID_CREDENTIALS");
      }
    }

    const { response, status, json } = mockResponse();
    filter.catch(new CustomDomainException(), mockHostWithResponse(response));
    expect(status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(json).toHaveBeenCalledWith({
      message: "Custom failure",
      error: "Unauthorized",
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  });

  it("returns 500 and logs a domain exception with an unregistered code", () => {
    const errorSpy = vi
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined);

    class CustomDomainException extends DomainException {
      constructor() {
        super("Custom failure", "SOMETHING.NEW");
      }
    }

    const { response, status, json } = mockResponse();
    filter.catch(new CustomDomainException(), mockHostWithResponse(response));
    expect(errorSpy).toHaveBeenCalledWith(expect.any(CustomDomainException));
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      message: "Custom failure",
      error: "Internal Server Error",
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  });

  it("passes through HttpException responses unchanged", () => {
    const { response, status, json } = mockResponse();
    filter.catch(
      new BadRequestException("bad"),
      mockHostWithResponse(response),
    );
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      message: "bad",
      error: "Bad Request",
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it("returns 500 and logs for unknown exceptions", () => {
    const errorSpy = vi
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined);
    const { response, status, json } = mockResponse();
    filter.catch(new Error("boom"), mockHostWithResponse(response));
    expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      message: "Internal server error",
      error: "Internal Server Error",
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  });

  it("does not log client-side HttpExceptions", () => {
    const errorSpy = vi
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined);
    const { response } = mockResponse();
    filter.catch(
      new BadRequestException("bad"),
      mockHostWithResponse(response),
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("logs HttpExceptions with a server-side status", () => {
    const errorSpy = vi
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined);
    const { response, status, json } = mockResponse();
    filter.catch(
      new HttpException("Internal failure", HttpStatus.INTERNAL_SERVER_ERROR),
      mockHostWithResponse(response),
    );
    expect(errorSpy).toHaveBeenCalledWith(expect.any(HttpException));
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      message: "Internal failure",
      error: "Internal Server Error",
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  });

  it("wraps a string message HttpException into a JSON body", () => {
    const { response, status, json } = mockResponse();
    filter.catch(
      new ThrottlerException("Rate limit exceeded"),
      mockHostWithResponse(response),
    );
    expect(status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    expect(json).toHaveBeenCalledWith({
      message: "Rate limit exceeded",
      error: "Too Many Requests",
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
    });
  });
});
