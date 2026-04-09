import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-access'

type UpdateBody = {
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  isFeatured?: boolean
  rating?: number | null
  experienceYears?: number | null
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ artistId: string }> }
) {
  const { artistId } = await context.params

  if (!artistId) {
    return NextResponse.json({ ok: false, error: 'Missing artistId' }, { status: 400 })
  }

  const { adminClient, isAdmin, user } = await getAdminSession()

  if (!adminClient || !isAdmin) {
    return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 })
  }

  let body: UpdateBody
  try {
    body = (await request.json()) as UpdateBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  if (body.approvalStatus) {
    if (!['pending', 'approved', 'rejected'].includes(body.approvalStatus)) {
      return NextResponse.json({ ok: false, error: 'Invalid approval status' }, { status: 400 })
    }

    updates.approval_status = body.approvalStatus
  }

  if (typeof body.isFeatured === 'boolean') {
    updates.is_featured = body.isFeatured
  }

  if (body.rating !== undefined) {
    if (body.rating !== null && (body.rating < 0 || body.rating > 5)) {
      return NextResponse.json({ ok: false, error: 'Rating must be between 0 and 5' }, { status: 400 })
    }
    updates.rating = body.rating
  }

  if (body.experienceYears !== undefined) {
    if (body.experienceYears !== null && body.experienceYears < 0) {
      return NextResponse.json({ ok: false, error: 'Experience years must be 0 or greater' }, { status: 400 })
    }
    updates.experience_years = body.experienceYears
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: 'No updates provided' }, { status: 400 })
  }

  const { error } = await (adminClient
    .from('artist_profiles') as unknown as {
      update(values: Record<string, unknown>): { eq(column: string, value: string): Promise<{ error: { message?: string } | null }> }
    })
    .update(updates)
    .eq('id', artistId)

  if (error) {
    console.error('[admin] artist update failed:', error)
    return NextResponse.json({ ok: false, error: 'Failed to update artist' }, { status: 500 })
  }

  console.info(
    JSON.stringify({
      event: 'admin_moderation',
      adminUserId: user.id,
      targetArtistId: artistId,
      action: body.approvalStatus
        ? `approval_status:${body.approvalStatus}`
        : body.isFeatured !== undefined
          ? `featured:${body.isFeatured}`
          : 'unknown',
      timestamp: new Date().toISOString(),
    })
  )

  return NextResponse.json({ ok: true })
}
