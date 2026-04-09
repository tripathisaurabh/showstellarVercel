import Image from 'next/image'
import Link from 'next/link'

type BrandLogoProps = {
  href?: string
  className?: string
  imageClassName?: string
  variant?: 'wide' | 'compact' | 'dark' | 'mark'
  priority?: boolean
}

const LOGO_VARIANTS = {
  wide: {
    src: '/logo.png',
    width: 1024,
    height: 307,
    className: 'h-10 w-auto object-contain',
  },
  compact: {
    src: '/headerlogo.png',
    width: 426,
    height: 135,
    className: 'h-9 w-auto object-contain',
  },
  dark: {
    src: '/darkmodelogo.png',
    width: 451,
    height: 146,
    className: 'h-9 w-auto object-contain',
  },
  mark: {
    src: '/appicon.png',
    width: 297,
    height: 308,
    className: 'h-10 w-10 object-contain',
  },
} as const

export default function BrandLogo({
  href = '/',
  className = '',
  imageClassName = '',
  variant = 'wide',
  priority = false,
}: BrandLogoProps) {
  const logo = LOGO_VARIANTS[variant]

  return (
    <Link href={href} className={`flex items-center gap-3 transition-opacity hover:opacity-80 ${className}`.trim()}>
      <Image
        src={logo.src}
        alt="ShowStellar"
        width={logo.width}
        height={logo.height}
        priority={priority}
        className={`${logo.className} ${imageClassName}`.trim()}
      />
    </Link>
  )
}
