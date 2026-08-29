import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { db } from './db';
import { currencies } from './db/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: ['.env', '../../../.env'] });

async function seedDefaultCurrencies() {
  const defaults = [
    { code: 'CUP', name: 'Peso Cubano' },
    { code: 'TRANSF', name: 'Transferencia Interna' },
  ];
  for (const c of defaults) {
    await db.insert(currencies).values(c).onConflictDoNothing();
  }
}

async function bootstrap() {
  await seedDefaultCurrencies();
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
