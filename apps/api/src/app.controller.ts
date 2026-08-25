import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";

@ApiTags("health")
@Controller()
export class AppController {
  @SkipThrottle()
  @Get("health")
  @ApiOperation({ summary: "Liveness check" })
  @ApiOkResponse({
    description: "API is up",
    schema: { type: "object", example: { status: "ok" } },
  })
  health(): { status: string } {
    return { status: "ok" };
  }
}
