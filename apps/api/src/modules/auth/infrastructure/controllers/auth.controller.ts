import { Body, Controller, HttpCode, Post, Res } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";

import { loadConfig } from "../../../../shared/config/env";
import { ApiErrorResponses } from "../../../../shared/http/api-error-responses.decorator";
import { LoginDto } from "../../application/dto/login.dto";
import { LoginResponseDto } from "../../application/dto/login-response.dto";
import { AdminLoginUseCase } from "../../application/use-cases/admin-login.use-case";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "../../domain/constants/session.constants";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  private readonly config = loadConfig();

  constructor(private readonly adminLoginUseCase: AdminLoginUseCase) {}

  @Throttle({ default: { limit: 5, ttl: 3600_000 } })
  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Admin login" })
  @ApiOkResponse({ type: LoginResponseDto, description: "Session started" })
  @ApiErrorResponses({
    badRequest: [
      {
        summary: "Missing password",
        message: ["password should not be empty", "password must be a string"],
      },
    ],
    unauthorized: [
      {
        summary: "Wrong password on login",
        message: "Incorrect password",
      },
    ],
    tooManyRequests: [
      {
        summary: "Login rate limit exceeded",
        message: "Rate limit exceeded",
      },
    ],
  })
  login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): LoginResponseDto {
    const token = this.adminLoginUseCase.execute(body.password);

    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: this.config.nodeEnv === "production",
      sameSite: "lax",
      maxAge: SESSION_TTL_SECONDS * 1000,
    });

    return new LoginResponseDto();
  }

  @Post("logout")
  @HttpCode(200)
  @ApiOperation({ summary: "Admin logout" })
  @ApiOkResponse({ type: LoginResponseDto, description: "Session closed" })
  @ApiErrorResponses({
    tooManyRequests: [
      {
        summary: "Rate limit exceeded",
        message: "Rate limit exceeded",
      },
    ],
  })
  logout(@Res({ passthrough: true }) res: Response): LoginResponseDto {
    res.clearCookie(SESSION_COOKIE_NAME);
    return new LoginResponseDto();
  }
}
