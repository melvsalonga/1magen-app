/**
 * API Configuration for Pollinations AI
 * This file manages API keys and endpoints securely
 */

export const API_CONFIG = {
    // Primary API endpoint
    baseUrl: 'https://gen.pollinations.ai',

    // Get API key from environment variables
    // Falls back to backup key if primary is not available
    getApiKey: (): string => {
        const primaryKey = process.env.NEXT_PUBLIC_POLLINATIONS_API_KEY;
        const backupKey = process.env.NEXT_PUBLIC_POLLINATIONS_BACKUP_API_KEY;

        if (primaryKey) {
            return primaryKey;
        }

        if (backupKey) {
            console.warn('Using backup API key');
            return backupKey;
        }

        throw new Error('No API key found. Please set NEXT_PUBLIC_POLLINATIONS_API_KEY in .env.local');
    },

    // Allowed models as per user requirements
    models: {
        flux: {
            name: 'flux',
            displayName: 'Flux',
            description: 'Fast high-quality image generation',
            supportsImageInput: false,
        },
        turbo: {
            name: 'turbo',
            displayName: 'Turbo (Fastest)',
            description: 'Single-step real-time generation',
            supportsImageInput: false,
        },
        zimage: {
            name: 'zimage',
            displayName: 'Z-Image',
            description: 'Fast 6B Flux with 2x upscaling',
            supportsImageInput: false,
        },
        gptimage: {
            name: 'gptimage',
            displayName: 'GPT-Image (Best)',
            description: 'OpenAI\'s image generation model with image input support',
            supportsImageInput: true,
        },
    } as const,
};

export type ModelName = keyof typeof API_CONFIG.models;
