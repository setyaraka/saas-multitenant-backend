import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {

  const rawOrigins = process.env.CORS_ORIGIN || '';
  const corsOrigins = rawOrigins.split(',').map(origin => origin.trim());
  
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  })

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
