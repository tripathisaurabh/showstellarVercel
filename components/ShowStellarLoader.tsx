import ShowStellarMascotState from '@/components/ShowStellarMascotState'

type LoaderVariant = 'page' | 'section' | 'inline'

export default function ShowStellarLoader({
  title = 'Loading artists...',
  message = 'Finding the right stars for your event...',
  variant = 'page',
}: {
  title?: string
  message?: string
  variant?: LoaderVariant
}) {
  const layout = variant === 'section' ? 'card' : variant

  return (
    <ShowStellarMascotState
      state="loading"
      title={title}
      message={message}
      layout={layout}
    />
  )
}
