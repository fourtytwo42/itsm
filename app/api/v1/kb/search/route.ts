import { NextResponse } from 'next/server'
import { z } from 'zod'
import { searchArticles } from '@/lib/services/kb-service'

const schema = z.object({
  query: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = schema.parse(body)
    const results = await searchArticles(validated.query)
    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', details: error.flatten() } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Search failed' } },
      { status: 500 }
    )
  }
}

