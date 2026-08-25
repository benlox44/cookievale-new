import { ApiProperty } from "@nestjs/swagger";

export class ErrorResponseDto {
  @ApiProperty({
    oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
  })
  message!: string | string[];

  @ApiProperty()
  error!: string;

  @ApiProperty()
  statusCode!: number;
}
