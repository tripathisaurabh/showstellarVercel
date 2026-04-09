'use client'

import dynamic from 'next/dynamic'

// Placeholder rendered while the modal bundle is being fetched.
// Matches the BookingModal trigger button dimensions exactly to avoid layout shift.
function BookingTriggerSkeleton() {
  return (
    <button
      disabled
      aria-busy="true"
      className="w-full font-bold"
      style={{
        background: '#ffffff',
        color: '#1a1a1a',
        border: 'none',
        borderRadius: '12px',
        padding: '14px 24px',
        fontSize: '0.9375rem',
        letterSpacing: '0.01em',
        boxShadow: '0 2px 12px rgba(0,23,57,0.15)',
        opacity: 0.85,
      }}
    >
      Request Booking
    </button>
  )
}

const BookingModal = dynamic(() => import('@/components/BookingModal'), {
  ssr: false,
  loading: BookingTriggerSkeleton,
})

export default BookingModal
