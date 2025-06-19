import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Forward request body directly to backend to preserve multipart encoding
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const url = new URL(`${backendBase}/api/v1/analyze/`);
    url.searchParams.append('model_path', 'models/torchscript_model_0_66_37_wo_gl.pth');

    const response = await fetch(
      url.toString(),
      {
        method: 'POST',
        headers: {
          'Content-Type': request.headers.get('content-type') || '',
        },
        body: request.body,
        // @ts-ignore -- duplex is required by undici but not in lib types
        duplex: 'half',
      } as any
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Backend error:', error);
      return NextResponse.json(
        { error: 'Analysis failed', details: error },
        { status: response.status }
      );
    }

    // Check if the response is a video stream or a single image result
    const contentType = response.headers.get('content-type');
    
    // Handle streaming response (video) if backend returns event-stream
    if (contentType?.includes('text/event-stream')) {
      const reader = response.body?.getReader();
      
      if (!reader) {
        throw new Error('Failed to read response stream');
      }

      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              // Process the chunk and send as JSON lines
              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n').filter(Boolean);
              
              for (const line of lines) {
                try {
                  // Ensure valid JSON before sending
                  JSON.parse(line);
                  const encoder = new TextEncoder();
                  controller.enqueue(encoder.encode(`data: ${line}\n\n`));
                } catch (e) {
                  console.warn('Skipping invalid JSON chunk:', line);
                }
              }
            }
          } catch (error) {
            console.error('Stream error:', error);
            controller.error(error);
          } finally {
            reader.releaseLock();
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // For non-streaming responses (single image)
    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      },
      { status: 500 }
    );
  }
}
