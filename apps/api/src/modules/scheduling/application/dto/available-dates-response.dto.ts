import { ApiProperty } from "@nestjs/swagger";

import { AvailableDateDto } from "./available-date.dto";

export class AvailableDatesResponseDto {
  today!: string;

  @ApiProperty({ type: [AvailableDateDto] })
  dates!: AvailableDateDto[];
}
