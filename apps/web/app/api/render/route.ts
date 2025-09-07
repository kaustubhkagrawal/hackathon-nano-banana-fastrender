import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.style || !body.model || !body.assets || !body.prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: style, model, assets, prompt' },
        { status: 400 }
      )
    }

    // Validate assets array
    if (!Array.isArray(body.assets) || body.assets.length === 0) {
      return NextResponse.json(
        { error: 'Assets must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate each asset has required url field
    for (const asset of body.assets) {
      if (!asset.url) {
        return NextResponse.json(
          { error: 'Each asset must have a url field' },
          { status: 400 }
        )
      }
    }

    // Prepare the request payload
    const payload = {
      style: body.style,
      model: body.model,
      assets: body.assets.map((asset: any) => ({
        id: asset.id || '',
        url: asset.url
      })),
      prompt: body.prompt,
      version: body.version || 1
    }

    // Call the external rendering service
    const response = await fetch(
      'https://windmill.fastrender.app/api/r/hackathon/kaggle-nano-banana-2d-to-3d-render',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    // Handle non-200 responses from external service
    if (!response.ok) {
      const errorText = await response.text()
      console.error('External service error:', response.status, errorText)
      
      return NextResponse.json(
        { 
          error: 'Rendering service error',
          details: `Service returned ${response.status}`,
          message: errorText || 'Unknown error'
        },
        { status: response.status }
      )
    }

    // Parse and return successful response
    const result = await response.json()
    
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('API Route Error:', error)
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Handle fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Failed to connect to rendering service' },
        { status: 502 }
      )
    }

    // Generic error handler
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Optional: Add CORS headers if needed
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}