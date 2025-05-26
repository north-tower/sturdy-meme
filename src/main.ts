import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as compression from 'compression';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe());
  
  // Enable compression
  app.use(compression());
  
  // Enable security headers
  app.use(helmet());
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Mobile Lending Platform API')
    .setDescription('The Mobile Lending Platform API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  // Use Render's port or fallback to 6800 for local development
  const port = process.env.PORT || 6800;
  
  // Bind to 0.0.0.0 so Render can access it
  await app.listen(port, '0.0.0.0');
  
  console.log(`Application is running on port ${port}`);
}
bootstrap();
