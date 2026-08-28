import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { ApiErrorResponses } from "../../../../shared/http/api-error-responses.decorator";
import { OperationOkDto } from "../../../../shared/http/operation-ok.dto";
import { AdminGuard } from "../../../auth/infrastructure/guards/admin.guard";
import { AddSlotDto } from "../../application/dto/add-slot.dto";
import { DateParamDto } from "../../application/dto/date-param.dto";
import { SlotDto } from "../../application/dto/slot.dto";
import { AddSlotUseCase } from "../../application/use-cases/add-slot.use-case";
import { RemoveFreeSlotUseCase } from "../../application/use-cases/remove-free-slot.use-case";

@ApiTags("scheduling")
@UseGuards(AdminGuard)
@Controller("admin/dates")
export class AdminDatesController {
  constructor(
    private readonly addSlot: AddSlotUseCase,
    private readonly removeFreeSlot: RemoveFreeSlotUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: "Add an availability slot for a date" })
  @ApiCreatedResponse({ type: SlotDto, description: "Slot created" })
  @ApiErrorResponses({
    badRequest: [
      { summary: "Past date", message: "Cannot add a slot for a past date" },
    ],
    unauthorized: [
      { summary: "Missing admin session", message: "Not authenticated" },
    ],
  })
  add(@Body() body: AddSlotDto): Promise<SlotDto> {
    return this.addSlot.execute(body.date);
  }

  @Delete(":date")
  @HttpCode(200)
  @ApiOperation({ summary: "Remove one free slot on a date" })
  @ApiOkResponse({ type: OperationOkDto, description: "Slot removed" })
  @ApiErrorResponses({
    unauthorized: [
      { summary: "Missing admin session", message: "Not authenticated" },
    ],
    conflict: [
      {
        summary: "No free slot to remove",
        message: "No free slot to remove for that date",
      },
    ],
  })
  async remove(@Param() params: DateParamDto): Promise<OperationOkDto> {
    await this.removeFreeSlot.execute(params.date);
    return new OperationOkDto();
  }
}
