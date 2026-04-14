import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabaseClient } from '@/lib/supabase/admin'

type MediaCreateBody = {
  media_url?: string
  type?: 'image' | 'video' | string
}

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: MediaCreateBody

  try {
    body = (await request.json()) as MediaCreateBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = getAdminSupabaseClient()

  const { data: profile, error: profileError } = await (adminClient
    .from('artist_profiles') as unknown as {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: { id: string; user_id: string } | null; error: { message?: string } | null }>
      }
    }
  })
    .select('id, user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[artist-media] profile lookup failed:', profileError)
    return NextResponse.json({ ok: false, error: 'Unable to upload media' }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Artist profile not found' }, { status: 404 })
  }

  const mediaUrl = body.media_url?.trim() || ''
  const mediaType = body.type === 'video' ? 'video' : body.type === 'image' ? 'image' : null

  if (!mediaUrl || !mediaType) {
    return NextResponse.json({ ok: false, error: 'Missing media details' }, { status: 400 })
  }

  const insertResult = await (adminClient.from('artist_media') as unknown as {
    insert(values: Record<string, unknown>): {
      select(columns: string): {
        maybeSingle(): Promise<{
          data: { id: string; media_url: string; type: 'image' | 'video' } | null
          error: { message?: string } | null
        }>
      }
    }
  })
    .insert({ artist_id: profile.id, media_url: mediaUrl, type: mediaType })
    .select('id, media_url, type')
    .maybeSingle()

  if (insertResult.error || !insertResult.data) {
    console.error('[artist-media] insert failed:', insertResult.error)
    return NextResponse.json({ ok: false, error: 'Unable to save media' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    media: insertResult.data,
  })
}
