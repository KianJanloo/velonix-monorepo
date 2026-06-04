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
exports.ASSET_KINDS = exports.SUBSCRIPTION_LIMITS = void 0;
exports.SUBSCRIPTION_LIMITS = {
    free: {
        maxProjects: 3,
        maxPagesPerProject: 2,
        maxComponentsPerProject: 50,
        maxStorageGb: 1,
        commissionRate: 25,
        hasAnalytics: false,
        has3DPreview: false,
        hasDemoVideo: false,
        hasCustomDomain: false,
        hasTeamCollaboration: false,
        maxCollaborators: 0,
        hasPrioritySupport: false,
    },
    creator: {
        maxProjects: 10,
        maxPagesPerProject: 5,
        maxComponentsPerProject: 200,
        maxStorageGb: 5,
        commissionRate: 20,
        hasAnalytics: false,
        has3DPreview: true,
        hasDemoVideo: false,
        hasCustomDomain: false,
        hasTeamCollaboration: false,
        maxCollaborators: 0,
        hasPrioritySupport: false,
    },
    pro: {
        maxProjects: null,
        maxPagesPerProject: 25,
        maxComponentsPerProject: null,
        maxStorageGb: 25,
        commissionRate: 17,
        hasAnalytics: true,
        has3DPreview: true,
        hasDemoVideo: true,
        hasCustomDomain: false,
        hasTeamCollaboration: true,
        maxCollaborators: 3,
        hasPrioritySupport: false,
    },
    studio: {
        maxProjects: null,
        maxPagesPerProject: null,
        maxComponentsPerProject: null,
        maxStorageGb: 100,
        commissionRate: 15,
        hasAnalytics: true,
        has3DPreview: true,
        hasDemoVideo: true,
        hasCustomDomain: true,
        hasTeamCollaboration: true,
        maxCollaborators: 10,
        hasPrioritySupport: true,
    },
};
exports.ASSET_KINDS = ["token", "board", "card", "tile", "piece", "pack", "other"];
//# sourceMappingURL=index.js.map