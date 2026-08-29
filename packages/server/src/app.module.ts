import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { WalletsModule } from './wallets/wallets.module';
import { OperationsModule } from './operations/operations.module';

@Module({
  imports: [AuthModule, CurrenciesModule, WalletsModule, OperationsModule],
})
export class AppModule {}
