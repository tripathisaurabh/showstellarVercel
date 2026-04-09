export type UserRole = 'artist' | 'client' | 'admin'

export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export type MediaType = 'image' | 'video'

export interface User {
  id: string
  role: UserRole
  full_name: string
  phone_number: string
  email: string
  created_at: string
}

export interface Category {
  id: string
  name: string
}

export interface ArtistProfile {
  id: string
  user_id: string
  slug?: string
  username?: string
  stage_name?: string
  category_id: string | null
  categories?: string[]
  custom_categories?: string[]
  locality?: string
  city: string
  state?: string
  bio: string
  performance_style?: string
  event_types?: string
  languages_spoken?: string
  pricing_start: number | null
  profile_image: string | null
  approval_status: ApprovalStatus
  is_featured: boolean
  created_at: string
  // joins
  users?: User
  primary_category?: Category
  artist_media?: ArtistMedia[]
}

export interface ArtistMedia {
  id: string
  artist_id: string
  media_url: string
  type: MediaType
}

export interface BookingInquiry {
  id: string
  artist_id: string
  client_name: string
  client_phone: string
  client_email: string
  event_type: string
  custom_event_type?: string | null
  event_size?: string | null
  event_duration?: string | null
  venue_type?: string | null
  event_date: string
  city: string
  artist_price?: number | null
  client_offer?: number | null
  additional_details?: string | null
  budget?: string
  message?: string
  status: string
  created_at: string
}
