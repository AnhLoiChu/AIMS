import { CrudConfigService } from '@dataui/crud';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

CrudConfigService.load({
  query: {
    limit: 25,
    cache: 2000,
  },
  params: {
    id: {
      primary: false,
      disabled: true,
    },
  },
  routes: {
    only: [
      'getManyBase',
      'createOneBase',
      'getOneBase',
      'updateOneBase',
      'deleteOneBase',
    ],
  },
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:8080',
    credentials: true, // if you're using cookies or authorization headers
  });
  const config = new DocumentBuilder()
    .setTitle('AIMS API')
    .setDescription('The AIMS API description')
    .setVersion('1.0')
    .addTag('AIMS')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server is running on: http://localhost:${port}`);
  console.log(`📚 Swagger API docs: http://localhost:${port}/api`);
}

void bootstrap();
