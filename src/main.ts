import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy', true);

  //app.setGlobalPrefix('api')
  
  // Esto es importante al momento de usar class-Validator en los dtos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);

  const config = new DocumentBuilder()
    .setTitle('Users API')
    .setDescription('The Users API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Habilitar CORS
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL'), // Origen permitido (tu frontend)
    methods: configService.get<string>('FRONTEND_METHODS'),
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });
  

  await app.listen(4000);
}

bootstrap();
