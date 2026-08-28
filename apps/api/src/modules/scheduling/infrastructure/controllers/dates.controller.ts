import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { AvailableDatesResponseDto } from "../../application/dto/available-dates-response.dto";
import { GetAvailableDatesUseCase } from "../../application/use-cases/get-available-dates.use-case";

@ApiTags("scheduling")
@Controller()
export class DatesController {
  constructor(private readonly getAvailableDates: GetAvailableDatesUseCase) {}

  @Get("available-dates")
  @ApiOperation({ summary: "List dates that still have free slots" })
  @ApiOkResponse({
    type: AvailableDatesResponseDto,
    description: "Available dates with their free-slot counts, plus today",
  })
  list(): Promise<AvailableDatesResponseDto> {
    return this.getAvailableDates.execute();
  }
}
