# Setting Up Your API Keys

To use the Pollinations AI API, you need to create a `.env.local` file in the root of your project with your API keys.

## Steps:

1. Create a file named `.env.local` in the root directory of your project (same level as `package.json`)

2. Add the following content to the file:

```env
# Pollinations AI API Keys
# Primary API Key
NEXT_PUBLIC_POLLINATIONS_API_KEY=sk_bAmsZHwP7olHcGqyZlQuzv7TZPo9a8EL

# Backup API Key
NEXT_PUBLIC_POLLINATIONS_BACKUP_API_KEY=sk_LJRuUQtn2uXwNjerxEG0ahvXPLerBwik
```

3. Save the file

4. Restart your development server if it's already running:
   ```bash
   npm run dev
   ```

## Security Notes:

- ✅ The `.env.local` file is already in `.gitignore`, so your API keys won't be committed to git
- ✅ Never share your API keys publicly
- ✅ The app will automatically use the backup key if the primary key fails
- ✅ API keys are only accessible in your local environment

## Available Models:

The app now supports the following models:

1. **Flux Schnell** - Fast high-quality image generation (text-to-image only)
2. **SDXL Turbo** - Single-step real-time generation (text-to-image only)
3. **Z-Image Turbo** - Fast 6B Flux with 2x upscaling (text-to-image only)
4. **GPT Image 1 Mini** - OpenAI's image generation model (supports both text-to-image and image-to-image)

## Using Reference Images:

When you select the **GPT Image 1 Mini** model, you'll see an option to upload a reference image. This allows you to:
- Edit existing images
- Use an image as a style reference
- Transform images based on your prompt

Simply click "Upload Image" and select your reference image. The AI will use it along with your text prompt to generate the result.
