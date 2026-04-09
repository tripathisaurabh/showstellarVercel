'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

type Step = { number: string; title: string; description: string; image: string }

// --- Arc geometry constants ---
const CARD_W    = 260   // px, card width
const RADIUS    = 370   // px, radius of the virtual circle
const STEP_DEG  = 44    // degrees between adjacent cards on the circle
const ROT_K     = 0.62  // how much each card face-rotates relative to its arc angle (< 1 = gentler)
const DRAG_UNIT = CARD_W + 16 // px of drag that counts as one card step

function arcTransform(dist: number) {
  const angleRad = (dist * STEP_DEG * Math.PI) / 180
  const x  = Math.sin(angleRad) * RADIUS                 // horizontal position on arc
  const z  = (Math.cos(angleRad) - 1) * RADIUS * 0.55   // depth: 0 at center, recedes on sides
  const ry = -dist * STEP_DEG * ROT_K                    // card face-rotation follows arc tangent
  return { x, z, ry }
}

export function StepsCarousel({ steps }: { steps: Step[] }) {
  const [active, setActive]       = useState(0)
  const [dragX, setDragX]         = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const clamp = (i: number) => Math.max(0, Math.min(steps.length - 1, i))

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setIsDragging(true)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    setDragX(e.touches[0].clientX - touchStartX.current)
  }
  const onTouchEnd = () => {
    const threshold = DRAG_UNIT * 0.2
    if      (dragX < -threshold) setActive(a => clamp(a + 1))
    else if (dragX >  threshold) setActive(a => clamp(a - 1))
    setDragX(0)
    setIsDragging(false)
    touchStartX.current = null
  }

  // Transition: instant during drag (card follows finger), spring-snap on release
  const transition = isDragging
    ? 'transform 0.04s linear, opacity 0.04s, filter 0.04s, box-shadow 0.04s'
    : 'transform 0.58s cubic-bezier(0.22,1,0.36,1), opacity 0.42s ease, filter 0.42s ease, box-shadow 0.42s ease'

  return (
    <div className="select-none">
      {/* Clip frame — hides cards that have moved fully off-screen */}
      <div style={{ overflow: 'hidden' }}>
        {/* 3-D stage — perspective lives here so all children share one vanishing point */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            position: 'relative',
            height: 380,
            perspective: '900px',
            perspectiveOrigin: '50% 45%',
          }}
        >
          {steps.map((step, i) => {
            const rawDist = i - active
            // Blend live drag into the arc position (fraction of one card step)
            const dist    = rawDist + dragX / DRAG_UNIT
            const abs     = Math.abs(dist)
            const isActive = rawDist === 0

            const { x, z, ry } = arcTransform(dist)

            const opacity  = Math.max(0.08, 1 - abs * 0.42)
            // Blur ramps up past the immediate neighbor — center is sharp, neighbor is lightly soft, far is blurred
            const blurPx   = Math.max(0, (abs - 0.6) * 3.5)
            const shadow   = isActive
              ? '0 28px 64px rgba(0,23,57,0.24), 0 4px 20px rgba(0,23,57,0.1)'
              : '0 6px 18px rgba(0,23,57,0.07)'

            return (
              <article
                key={step.number}
                onClick={() => {
                  if (rawDist !== 0 && !isDragging) setActive(clamp(i))
                }}
                style={{
                  // Place all cards at the horizontal center; arc pushes them apart
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  width: CARD_W,

                  // The circular arc: sin/cos give genuine curved path + rotateY for face angle
                  transform: `translateX(calc(-50% + ${x}px)) translateZ(${z}px) rotateY(${ry}deg)`,

                  transition,
                  opacity,
                  filter: blurPx > 0 ? `blur(${blurPx}px)` : 'none',
                  boxShadow: shadow,

                  zIndex: Math.round(20 - Math.abs(rawDist) * 5),
                  cursor: isActive ? 'default' : 'pointer',
                  willChange: 'transform',

                  // Card shell
                  borderRadius: 22,
                  overflow: 'hidden',
                  background: 'var(--surface-2)',
                  border: '1px solid rgba(0,23,57,0.10)',
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    sizes="260px"
                    style={{ objectFit: 'cover' }}
                    draggable={false}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,23,57,0.68) 0%, rgba(0,23,57,0.06) 52%, transparent 100%)',
                  }} />
                  {/* Step pill */}
                  <div style={{
                    position: 'absolute', top: 13, left: 13,
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: 999,
                    padding: '5px 13px',
                    fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.14em', textTransform: 'uppercase' as const,
                    color: '#001739',
                    boxShadow: '0 4px 14px rgba(0,23,57,0.14)',
                  }}>
                    Step {i + 1}
                  </div>
                </div>

                {/* Text */}
                <div style={{ padding: '17px 20px 22px' }}>
                  <p style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
                    textTransform: 'uppercase' as const,
                    color: '#001739', marginBottom: 7,
                  }}>
                    {step.number}
                  </p>
                  <h3 style={{
                    fontSize: 16, fontWeight: 700, color: '#001739',
                    letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 8,
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--muted)', margin: 0 }}>
                    {step.description}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {/* Pill dots */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 7, marginTop: 10 }}>
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Step ${i + 1}`}
            style={{
              height: 7,
              width: i === active ? 24 : 7,
              borderRadius: 999,
              background: i === active ? '#001739' : 'rgba(0,23,57,0.20)',
              border: 'none', padding: 0, cursor: 'pointer',
              transition: 'width 0.38s cubic-bezier(0.22,1,0.36,1), background 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}
