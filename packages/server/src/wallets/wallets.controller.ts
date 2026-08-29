import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  create(@Body() body: { name: string; description: string }, @Req() req: any) {
    return this.walletsService.create(
      body.name,
      body.description,
      req.user.userId,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.walletsService.findAll(req.user.userId);
  }

  @Post(':walletId/members/:userId')
  addMember(
    @Param('walletId') walletId: string,
    @Param('userId') userId: string,
    @Body() body: { role?: 'member' | 'guest' },
    @Req() req: any,
  ) {
    return this.walletsService.addMember(
      walletId,
      userId,
      req.user.userId,
      body.role,
    );
  }

  @Post(':walletId/currencies/:currencyId')
  configureCurrency(
    @Param('walletId') walletId: string,
    @Param('currencyId') currencyId: string,
    @Req() req: any,
  ) {
    return this.walletsService.configureCurrency(
      walletId,
      currencyId,
      req.user.userId,
    );
  }

  @Get(':walletId/balances')
  getBalances(@Param('walletId') walletId: string, @Req() req: any) {
    return this.walletsService.getBalances(walletId, req.user.userId);
  }
}
