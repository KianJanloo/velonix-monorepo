import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SiteSettingEntity } from "./site-setting.entity";

const SINGLETON_ID = 1;

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SiteSettingEntity)
    private readonly repo: Repository<SiteSettingEntity>,
  ) {}

  /** Fetch the settings row, creating it with defaults on first access. */
  async get(): Promise<SiteSettingEntity> {
    let settings = await this.repo.findOne({ where: { id: SINGLETON_ID } });
    if (!settings) {
      settings = await this.repo.save(this.repo.create({ id: SINGLETON_ID }));
    }
    return settings;
  }

  async getPublic() {
    const s = await this.get();
    return {
      signupsEnabled: s.signupsEnabled,
      marketplaceEnabled: s.marketplaceEnabled,
      maintenanceMode: s.maintenanceMode,
      maintenanceMessage: s.maintenanceMessage,
      announcement: s.announcement,
      siteName: s.siteName,
      siteDescription: s.siteDescription,
      logoUrl: s.logoUrl,
      faviconUrl: s.faviconUrl,
      supportEmail: s.supportEmail,
      contactEmail: s.contactEmail,
      phone: s.phone,
      address: s.address,
      discordUrl: s.discordUrl,
      twitterUrl: s.twitterUrl,
      facebookUrl: s.facebookUrl,
      instagramUrl: s.instagramUrl,
      youtubeUrl: s.youtubeUrl,
      githubUrl: s.githubUrl,
      linkedinUrl: s.linkedinUrl,
      metaDescription: s.metaDescription,
      metaKeywords: s.metaKeywords,
      primaryColor: s.primaryColor,
      accentColor: s.accentColor,
      footerText: s.footerText,
      aboutContent: s.aboutContent,
    };
  }

  async update(patch: Partial<SiteSettingEntity>) {
    const settings = await this.get();
    delete (patch as { id?: unknown }).id;
    Object.assign(settings, patch);
    return this.repo.save(settings);
  }

  async signupsEnabled(): Promise<boolean> {
    return (await this.get()).signupsEnabled;
  }
}
