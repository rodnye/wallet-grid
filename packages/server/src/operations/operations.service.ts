import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../db';
import {
  operations,
  operationAssignments,
  memberships,
  subWallets,
  balances,
  walletCurrencies,
} from '../db/schema';
import { eq, and, sum, sql } from 'drizzle-orm';

@Injectable()
export class OperationsService {
  async create(
    walletId: string,
    type: string,
    currencyId: string,
    capAmount: number,
    description: string,
    userId: string,
  ) {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(eq(memberships.walletId, walletId), eq(memberships.userId, userId)),
      );
    if (!membership)
      throw new ForbiddenException('Not a member of this wallet');

    const [activeCurrency] = await db
      .select()
      .from(walletCurrencies)
      .where(
        and(
          eq(walletCurrencies.walletId, walletId),
          eq(walletCurrencies.currencyId, currencyId),
        ),
      );
    if (!activeCurrency)
      throw new BadRequestException('Currency is not active in this wallet');

    const [operation] = await db
      .insert(operations)
      .values({
        walletId,
        type: type as any,
        currencyId,
        capAmount: capAmount.toString(),
        description,
        createdBy: userId,
      })
      .returning();

    return operation;
  }

  async assignFunds(
    operationId: string,
    subWalletId: string,
    amount: number,
    userId: string,
  ) {
    const [subWallet] = await db
      .select()
      .from(subWallets)
      .where(
        and(eq(subWallets.id, subWalletId), eq(subWallets.userId, userId)),
      );
    if (!subWallet)
      throw new ForbiddenException('You do not own this subwallet');

    const [operation] = await db
      .select()
      .from(operations)
      .where(eq(operations.id, operationId));
    if (!operation) throw new NotFoundException('Operation not found');
    if (operation.status !== 'pending')
      throw new BadRequestException('Operation is already executed');

    const [balance] = await db
      .select()
      .from(balances)
      .where(
        and(
          eq(balances.subWalletId, subWalletId),
          eq(balances.currencyId, operation.currencyId),
        ),
      );

    if (!balance)
      throw new BadRequestException('No balance record for this currency');

    const currentBalance = parseFloat(balance.amount);
    if (amount > currentBalance)
      throw new BadRequestException('Insufficient funds in this currency');

    await db
      .insert(operationAssignments)
      .values({
        operationId,
        subWalletId,
        assignedAmount: amount.toString(),
      })
      .onConflictDoUpdate({
        target: [
          operationAssignments.operationId,
          operationAssignments.subWalletId,
        ],
        set: { assignedAmount: amount.toString() },
      });

    const [totalResult] = await db
      .select({ total: sum(operationAssignments.assignedAmount) })
      .from(operationAssignments)
      .where(eq(operationAssignments.operationId, operationId));

    const totalAssigned = parseFloat(totalResult?.total || '0');
    const capAmount = parseFloat(operation.capAmount);

    if (totalAssigned >= capAmount) {
      await this.executeOperation(operationId);
    }

    return { message: 'Funds assigned successfully', totalAssigned, capAmount };
  }

  private async executeOperation(operationId: string) {
    const [operation] = await db
      .select()
      .from(operations)
      .where(eq(operations.id, operationId));
    if (!operation || operation.status === 'executed') return;

    const assignments = await db
      .select()
      .from(operationAssignments)
      .where(eq(operationAssignments.operationId, operationId));

    for (const assignment of assignments) {
      const amount = parseFloat(assignment.assignedAmount);
      if (amount > 0) {
        await db
          .update(balances)
          .set({ amount: sql`${balances.amount} - ${amount}` })
          .where(
            and(
              eq(balances.subWalletId, assignment.subWalletId),
              eq(balances.currencyId, operation.currencyId),
            ),
          );
      }
    }

    await db
      .update(operations)
      .set({ status: 'executed', executedAt: new Date() })
      .where(eq(operations.id, operationId));
  }

  async getHistory(walletId: string, userId: string) {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(eq(memberships.walletId, walletId), eq(memberships.userId, userId)),
      );

    if (!membership)
      throw new ForbiddenException('Not a member of this wallet');

    const selectFields = {
      id: operations.id,
      type: operations.type,
      capAmount: operations.capAmount,
      status: operations.status,
      description: operations.description,
      createdAt: operations.createdAt,
      executedAt: operations.executedAt,
    };

    if (membership.role === 'guest') {
      return db
        .select(selectFields)
        .from(operations)
        .innerJoin(
          operationAssignments,
          eq(operations.id, operationAssignments.operationId),
        )
        .innerJoin(
          subWallets,
          eq(operationAssignments.subWalletId, subWallets.id),
        )
        .where(
          and(eq(operations.walletId, walletId), eq(subWallets.userId, userId)),
        )
        .orderBy(operations.createdAt);
    }

    return db
      .select(selectFields)
      .from(operations)
      .where(eq(operations.walletId, walletId))
      .orderBy(operations.createdAt);
  }
}
