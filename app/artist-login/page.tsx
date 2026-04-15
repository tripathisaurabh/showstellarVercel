import ArtistLoginForm from './ArtistLoginForm'

type ArtistLoginSearchParams = {
  reason?: string
}

export default async function ArtistLoginPage({
  searchParams,
}: {
  searchParams?: Promise<ArtistLoginSearchParams>
}) {
  const params = (await searchParams) ?? {}
  return <ArtistLoginForm reason={params.reason} />
}
