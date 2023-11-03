import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TrackingInterceptor } from './interceptor/user-tracking.interceptor';
import { urlencoded, json } from 'body-parser';
import { ConvertCaseInterceptor } from './interceptor/convert-case.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //인터셉터 전역 선언
  app.useGlobalInterceptors(new TrackingInterceptor());
  app.useGlobalInterceptors(new ConvertCaseInterceptor());

  //PayloadTooLargeError 용량 키움
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  app.enableCors();
  const config = new DocumentBuilder()
    .setTitle('DTVERSE member 포털 API Swagger')
    .setDescription('DTVERSE member 포털 API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.SERVER_PORT);
}
bootstrap();
