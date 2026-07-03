import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { AppConfigService } from "./config/app-config.service";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  const appConfigService = app.get(AppConfigService);
  await app.listen(appConfigService.apiPort);
}

void bootstrap();
