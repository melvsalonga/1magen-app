import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
  try {
    const { prompt, width, height, model, seed } = await req.json();

    if (!prompt) {
      return new NextResponse('Prompt is required', { status: 400 });
    }

    const encodedPrompt = encodeURIComponent(prompt.trim());
    const params = new URLSearchParams({
      width: width.toString(),
      height: height.toString(),
      model: model,
      nologo: 'true',
      seed: seed,
      private: 'true',
    });

    if (model === 'gptimage') {
      params.append('referrer', 'pollinations.ai');
    }

    const finalURL = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;

    const imageResponse = await fetch(finalURL);

    if (!imageResponse.ok) {
      console.error(`Pollinations API error: ${imageResponse.status} ${imageResponse.statusText}`);
      return new NextResponse('Error from image generation service', { status: imageResponse.status });
    }

    // Return the image response directly to the client
    return new NextResponse(imageResponse.body, {
      status: 200,
      headers: {
        'Content-Type': imageResponse.headers.get('Content-Type') || 'image/png',
      },
    });

  } catch (error) {
    console.error('Error in image generation proxy:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}