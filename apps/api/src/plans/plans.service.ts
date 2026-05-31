import { Injectable, NotFoundException, type OnApplicationBootstrap, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PlanConfigEntity } from "./plan.entity";
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from "@velonix/types";

const SEED: Record<SubscriptionTier, { name: string; description: string; priceMonthly: number; priceYearly: number; hasRuleEngine: boolean; features: string[]; sortOrder: number }> = {
  free: {
    name: "Free", description: "Everything you need to start designing.",
    priceMonthly: 0, priceYearly: 0, hasRuleEngine: false, sortOrder: 0,
    features: ["3 game projects", "2D design studio", "Marketplace publishing", "Community support"],
  },
  creator: {
    name: "Creator", description: "For hobbyists ready to grow an audience.",
    priceMonthly: 1200, priceYearly: 12000, hasRuleEngine: false, sortOrder: 1,
    features: ["10 game projects", "3D preview", "Full component library", "Priority review queue", "Email support"],
  },
  pro: {
    name: "Pro", description: "For serious creators and small teams.",
    priceMonthly: 2900, priceYearly: 29000, hasRuleEngine: true, sortOrder: 2,
    features: ["Unlimited projects", "3D preview", "Analytics dashboard", "Visual rule engine", "Team collaboration (2 seats)", "Priority support"],
  },
  studio: {
    name: "Studio", description: "For studios shipping at scale.",
    priceMonthly: 7900, priceYearly: 79000, hasRuleEngine: true, sortOrder: 3,
    features: ["Everything in Pro", "Team collaboration (10 seats)", "White-label export", "API access", "Dedicated account manager", "SLA support"],
  },
};

@Injectable()
export class PlansService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PlansService.name);

  constructor(
    @InjectRepository(PlanConfigEntity)
    private readonly repo: Repository<PlanConfigEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const count = await this.repo.count();
      if (count > 0) return;
      const tiers = Object.keys(SEED) as SubscriptionTier[];
      for (const tier of tiers) {
        const limits = SUBSCRIPTION_LIMITS[tier];
        const s = SEED[tier];
        await this.repo.save(this.repo.create({
          tier, name: s.name, description: s.description,
          priceMonthly: s.priceMonthly, priceYearly: s.priceYearly,
          commissionRate: limits.commissionRate,
          maxProjects: limits.maxProjects,
          has3DPreview: limits.has3DPreview,
          hasAnalytics: limits.hasAnalytics,
          hasRuleEngine: s.hasRuleEngine,
          hasPrioritySupport: limits.hasPrioritySupport,
          features: s.features,
          sortOrder: s.sortOrder,
        }));
      }
      this.logger.log("Seeded default plan configurations.");
    } catch (err) {
      this.logger.warn(`Plan seed skipped: ${(err as Error).message}`);
    }
  }

  async findAll() {
    return this.repo.find({ order: { sortOrder: "ASC" } });
  }

  async update(tier: string, patch: Partial<PlanConfigEntity>) {
    const plan = await this.repo.findOne({ where: { tier: tier as SubscriptionTier } });
    if (!plan) throw new NotFoundException("Plan not found.");
    // Protect the primary key
    delete (patch as { tier?: unknown }).tier;
    Object.assign(plan, patch);
    return this.repo.save(plan);
  }
}
