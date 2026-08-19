import { IsIn, IsOptional, IsString, IsUrl, MaxLength, MinLength } from "class-validator";

export class GoogleOAuthStartDto {
  @IsOptional()
  @IsIn(["web", "desktop"])
  clientType?: "web" | "desktop";

  @IsOptional()
  @IsUrl({
    require_tld: false,
    require_protocol: true
  })
  @MaxLength(512)
  returnUri?: string;
}

export class GoogleOAuthCallbackDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  @MinLength(1)
  state!: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsString()
  authuser?: string;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsString()
  iss?: string;

  @IsOptional()
  @IsString()
  hd?: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  error_description?: string;
}
