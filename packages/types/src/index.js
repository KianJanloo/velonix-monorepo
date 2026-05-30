"use strict";
/**
 * @velonix/types
 *
 * Shared TypeScript type definitions used across the entire monorepo:
 * - apps/web  (Next.js frontend)
 * - apps/api  (NestJS backend)
 * - packages/game-engine
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSCRIPTION_LIMITS = void 0;
exports.SUBSCRIPTION_LIMITS = {
    free: {
        maxProjects: 3,
        maxComponentsPerProject: 50,
        maxStorageGb: 1,
        commissionRate: 25,
        hasAnalytics: false,
        has3DPreview: true,
        hasCustomDomain: false,
        hasTeamCollaboration: false,
        hasPrioritySupport: false,
    },
    creator: {
        maxProjects: 10,
        maxComponentsPerProject: 200,
        maxStorageGb: 5,
        commissionRate: 20,
        hasAnalytics: false,
        has3DPreview: true,
        hasCustomDomain: false,
        hasTeamCollaboration: false,
        hasPrioritySupport: false,
    },
    pro: {
        maxProjects: null,
        maxComponentsPerProject: null,
        maxStorageGb: 25,
        commissionRate: 17,
        hasAnalytics: true,
        has3DPreview: true,
        hasCustomDomain: false,
        hasTeamCollaboration: true,
        hasPrioritySupport: false,
    },
    studio: {
        maxProjects: null,
        maxComponentsPerProject: null,
        maxStorageGb: 100,
        commissionRate: 15,
        hasAnalytics: true,
        has3DPreview: true,
        hasCustomDomain: true,
        hasTeamCollaboration: true,
        hasPrioritySupport: true,
    },
};
//# sourceMappingURL=index.js.map