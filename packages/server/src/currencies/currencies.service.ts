import { Injectable } from '@nestjs/common';
import { db } from '../db';
import { currencies } from '../db/schema';

@Injectable()
export class CurrenciesService {
  async findAll() {
    return db.select().from(currencies);
  }

  async create(code: string, name: string) {
    const [currency] = await db
      .insert(currencies)
      .values({ code, name })
      .returning();
    return currency;
  }
}
