import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.useGlobalFilters(new AllExceptionsFilter());
  // WEB_ORIGIN acepta una lista separada por comas para soportar puertos alternos en dev.
  const allowedOrigins = (
    process.env.WEB_ORIGIN ?? "http://localhost:3000,http://localhost:3010"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/api/v1`);
}

bootstrap();
