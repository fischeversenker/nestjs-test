import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

const PUBLIC_PATH = join(__dirname, '..', 'public');
const VIEWS_PATH = join(__dirname, '..', 'views');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(PUBLIC_PATH);
  app.setBaseViewsDir(VIEWS_PATH);
  app.setViewEngine('hbs');

  await app.listen(3000);
}
bootstrap();
