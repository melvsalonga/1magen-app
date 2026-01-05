/**
 * Pollinations AI API Utility Functions
 * Handles all API interactions with proper authentication
 */

import { API_CONFIG, ModelName } from '@/config/api';

export interface GenerateImageParams {
    prompt: string;
    model: ModelName;
    width: number;
    height: number;
    seed?: string;
    referenceImage?: string; // Base64 encoded image for gptimage model
}

/**
 * Generate an image using Pollinations AI API
 * @param params - Image generation parameters
 * @returns Promise<string> - Data URL of the generated image
 */
export async function generateImageWithAPI(params: GenerateImageParams): Promise<string> {
    const { prompt, model, width, height, seed, referenceImage } = params;

    try {
        const apiKey = API_CONFIG.getApiKey();
        const modelConfig = API_CONFIG.models[model];

        // Check if model supports image input
        if (referenceImage && !modelConfig.supportsImageInput) {
            throw new Error(`Model ${model} does not support image input`);
        }

        // For models without image input, use GET request
        if (!referenceImage) {
            // Encode the prompt for URL
            const encodedPrompt = encodeURIComponent(prompt.trim());

            // Build query parameters
            const queryParams = new URLSearchParams({
                model: model,
                width: width.toString(),
                height: height.toString(),
                nologo: 'true',
                private: 'true',
            });

            // Add seed if provided
            if (seed && seed.trim()) {
                queryParams.append('seed', seed.trim());
            }

            // Correct URL format: https://gen.pollinations.ai/image/{prompt}?params
            const finalURL = `${API_CONFIG.baseUrl}/image/${encodedPrompt}?${queryParams.toString()}`;

            console.log(`Generating image with model: ${model}, URL:`, finalURL);

            // Try with authentication first
            let response = await fetch(finalURL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
            });

            // If we get 404, try without authentication (API might not require it)
            if (response.status === 404) {
                console.log('Retrying without authentication...');
                response = await fetch(finalURL, {
                    method: 'GET',
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }

            // Convert response to blob and then to data URL
            const blob = await response.blob();
            const dataUrl = await blobToDataURL(blob);

            return dataUrl;
        } else {
            // For gptimage with reference image, use POST request
            const finalURL = `${API_CONFIG.baseUrl}/image`;

            console.log(`Generating image with model: ${model} (with reference image)`);

            const response = await fetch(finalURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    model: model,
                    width: width,
                    height: height,
                    seed: seed?.trim(),
                    image: referenceImage, // Base64 encoded image
                    nologo: true,
                    private: true,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }

            // Convert response to blob and then to data URL
            const blob = await response.blob();
            const dataUrl = await blobToDataURL(blob);

            return dataUrl;
        }
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
}

/**
 * Convert a Blob to a Data URL
 * @param blob - The blob to convert
 * @returns Promise<string> - Data URL
 */
function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Convert an image file to base64 string
 * @param file - The image file
 * @returns Promise<string> - Base64 encoded string
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
