import { prisma } from '../lib/prisma.js';
import { feeExceedsLimit } from '../lib/errors.js';
import { mapFeeCalculation, mapFeeRule } from '../mappers/index.js';
import type { FeeCalculation, FeeRule } from '@neara/types';
import { isExpired } from '@neara/utils';

/**
 * NEARA Agent Fee Regulation Engine.
 *
 * The administrator configures fee rules per rent band. The system computes the
 * maximum allowed agent fee for a given rent + property type + location. If an
 * agent attempts to exceed it, the transaction is blocked.
 */
export class FeeService {
  async getActiveRules(): Promise<FeeRule[]> {
    const rules = await prisma.feeRule.findMany({
      where: { isActive: true, validFrom: { lte: new Date() } },
      orderBy: { minRent: 'asc' },
    });
    return rules.map(mapFeeRule);
  }

  /** Find the applicable rule for a given rent amount. */
  async findRule(
    rent: number,
    propertyTypeId?: string,
    locationId?: string,
  ): Promise<FeeRule | null> {
    const now = new Date();
    const rules = await prisma.feeRule.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        minRent: { lte: rent },
      },
      orderBy: { minRent: 'desc' },
    });

    for (const rule of rules) {
      // band must contain the rent
      if (rule.maxRent !== null && rent > rule.maxRent) continue;
      if (rule.validUntil && isExpired(rule.validUntil.toISOString())) continue;

      const ptIds = rule.propertyTypeIds
        ? (JSON.parse(rule.propertyTypeIds as string) as string[])
        : null;
      const locIds = rule.locationIds ? (JSON.parse(rule.locationIds as string) as string[]) : null;
      if (ptIds && propertyTypeId && !ptIds.includes(propertyTypeId)) continue;
      if (locIds && locationId && !locIds.includes(locationId)) continue;

      return mapFeeRule(rule);
    }
    // fallback: broadest rule ignoring type/location
    const broad = rules.find(
      (r) => !r.propertyTypeIds && !r.locationIds && (r.maxRent === null || rent <= r.maxRent),
    );
    return broad ? mapFeeRule(broad) : null;
  }

  /** Compute the maximum allowed agent fee for a rent. */
  computeMaxFee(rent: number, rule: FeeRule): number {
    const byPercentage = Math.round((rent * rule.maxPercentage) / 100);
    let max = byPercentage;
    if (rule.maxFixedFee !== null) max = Math.min(max, rule.maxFixedFee);
    if (rule.minFee !== null) max = Math.max(max, rule.minFee);
    return Math.max(0, max);
  }

  /** Calculate and optionally enforce the fee limit for a proposed agentFee. */
  async calculate(
    rent: number,
    proposedAgentFee: number,
    propertyTypeId?: string,
    locationId?: string,
    enforce = true,
  ): Promise<FeeCalculation> {
    const rule = await this.findRule(rent, propertyTypeId, locationId);
    if (!rule) {
      // No rule configured — default to 0 agent fee (no agent fee allowed without regulation)
      const calc = mapFeeCalculation(
        rent,
        0,
        {
          id: 'default',
          name: 'Default (no agent fee)',
          minRent: 0,
          maxRent: null,
          maxPercentage: 0,
          maxFixedFee: 0,
          minFee: null,
          validFrom: new Date(0).toISOString(),
          validUntil: null,
          isActive: true,
        },
        proposedAgentFee > 0,
      );
      if (enforce && proposedAgentFee > 0) {
        throw feeExceedsLimit(
          "This agent fee exceeds NEARA's permitted limit.",
          { proposedAgentFee, maxAllowed: 0 },
        );
      }
      return calc;
    }

    const maxAllowed = this.computeMaxFee(rent, rule);
    const exceeds = proposedAgentFee > maxAllowed;

    if (enforce && exceeds) {
      throw feeExceedsLimit("This agent fee exceeds NEARA's permitted limit.", {
        proposedAgentFee,
        maxAllowed,
        ruleName: rule.name,
      });
    }

    return mapFeeCalculation(rent, maxAllowed, rule, exceeds);
  }

  async createRule(
    data: {
      name: string;
      minRent: number;
      maxRent: number | null;
      maxPercentage: number;
      maxFixedFee: number | null;
      minFee: number | null;
      propertyTypeIds?: string[];
      locationIds?: string[];
      validFrom: string;
      validUntil?: string | null;
      isActive?: boolean;
    },
    createdById: string,
  ) {
    const rule = await prisma.feeRule.create({
      data: {
        name: data.name,
        minRent: data.minRent,
        maxRent: data.maxRent,
        maxPercentage: data.maxPercentage,
        maxFixedFee: data.maxFixedFee,
        minFee: data.minFee,
        propertyTypeIds: data.propertyTypeIds ? JSON.stringify(data.propertyTypeIds) : undefined,
        locationIds: data.locationIds ? JSON.stringify(data.locationIds) : undefined,
        validFrom: new Date(data.validFrom),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        isActive: data.isActive ?? true,
        createdById,
      },
    });
    return mapFeeRule(rule);
  }

  async updateRule(id: string, data: Partial<Parameters<FeeService['createRule']>[0]>) {
    const rule = await prisma.feeRule.update({
      where: { id },
      data: {
        ...data,
        propertyTypeIds: data.propertyTypeIds ? JSON.stringify(data.propertyTypeIds) : undefined,
        locationIds: data.locationIds ? JSON.stringify(data.locationIds) : undefined,
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      },
    });
    return mapFeeRule(rule);
  }

  async deleteRule(id: string) {
    await prisma.feeRule.delete({ where: { id } });
  }
}

export const feeService = new FeeService();
