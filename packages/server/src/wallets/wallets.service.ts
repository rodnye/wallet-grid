import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../db';
import {
  communalWallets,
  memberships,
  subWallets,
  walletCurrencies,
  balances,
  currencies,
} from '../db/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class WalletsService {
  async create(name: string, description: string, userId: string) {
    const [wallet] = await db
      .insert(communalWallets)
      .values({ name, description })
      .returning();
    await db
      .insert(memberships)
      .values({ walletId: wallet.id, userId, role: 'admin' });
    await db.insert(subWallets).values({ walletId: wallet.id, userId });

    return wallet;
  }

  async findAll(userId: string) {
    return db
      .select({
        id: communalWallets.id,
        name: communalWallets.name,
        description: communalWallets.description,
        role: memberships.role,
      })
      .from(communalWallets)
      .innerJoin(memberships, eq(communalWallets.id, memberships.walletId))
      .where(eq(memberships.userId, userId));
  }

  async addMember(
    walletId: string,
    newUserId: string,
    requesterId: string,
    role: 'member' | 'guest' = 'member',
  ) {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.walletId, walletId),
          eq(memberships.userId, requesterId),
        ),
      );

    if (!membership || membership.role !== 'admin')
      throw new ForbiddenException('Only admins can add members');

    await db.insert(memberships).values({ walletId, userId: newUserId, role });
    const [newSubWallet] = await db
      .insert(subWallets)
      .values({ walletId, userId: newUserId })
      .returning();

    const activeCurrencies = await db
      .select()
      .from(walletCurrencies)
      .where(eq(walletCurrencies.walletId, walletId));
    for (const wc of activeCurrencies) {
      await db.insert(balances).values({
        subWalletId: newSubWallet.id,
        currencyId: wc.currencyId,
        amount: '0',
      });
    }

    return { message: 'Member added successfully' };
  }

  async configureCurrency(
    walletId: string,
    currencyId: string,
    requesterId: string,
  ) {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.walletId, walletId),
          eq(memberships.userId, requesterId),
        ),
      );

    if (!membership || membership.role !== 'admin')
      throw new ForbiddenException('Only admins can configure currencies');

    await db
      .insert(walletCurrencies)
      .values({ walletId, currencyId })
      .onConflictDoNothing();

    const subWalletsList = await db
      .select()
      .from(subWallets)
      .where(eq(subWallets.walletId, walletId));
    for (const sw of subWalletsList) {
      await db
        .insert(balances)
        .values({ subWalletId: sw.id, currencyId, amount: '0' })
        .onConflictDoNothing();
    }

    return { message: 'Currency configured successfully' };
  }

  async getBalances(walletId: string, userId: string) {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(eq(memberships.walletId, walletId), eq(memberships.userId, userId)),
      );

    if (!membership)
      throw new ForbiddenException('Not a member of this wallet');

    const [subWallet] = await db
      .select()
      .from(subWallets)
      .where(
        and(eq(subWallets.walletId, walletId), eq(subWallets.userId, userId)),
      );

    if (!subWallet) throw new NotFoundException('Subwallet not found');

    const userBalances = await db
      .select({
        currencyCode: currencies.code,
        currencyName: currencies.name,
        amount: balances.amount,
      })
      .from(balances)
      .innerJoin(currencies, eq(balances.currencyId, currencies.id))
      .where(eq(balances.subWalletId, subWallet.id));

    return userBalances;
  }
}
