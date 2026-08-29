import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OperationsService } from './operations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wallets/:walletId/operations')
@UseGuards(JwtAuthGuard)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Post()
  create(
    @Param('walletId') walletId: string,
    @Body()
    body: {
      type: string;
      currencyId: string;
      capAmount: number;
      description: string;
    },
    @Req() req: any,
  ) {
    return this.operationsService.create(
      walletId,
      body.type,
      body.currencyId,
      body.capAmount,
      body.description,
      req.user.userId,
    );
  }

  @Post(':operationId/assign')
  assignFunds(
    @Param('operationId') operationId: string,
    @Body() body: { subWalletId: string; amount: number },
    @Req() req: any,
  ) {
    return this.operationsService.assignFunds(
      operationId,
      body.subWalletId,
      body.amount,
      req.user.userId,
    );
  }

  @Get('history')
  getHistory(@Param('walletId') walletId: string, @Req() req: any) {
    return this.operationsService.getHistory(walletId, req.user.userId);
  }
}
