import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn(["web", "desktop"])
  clientType?: "web" | "desktop";

  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceLabel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ttlDays?: number;
}
