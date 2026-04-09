import AdminLoginForm from './AdminLoginForm'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ reason?: string }>
}) {
  const params = await searchParams

  return (
    <AdminLoginForm reason={params?.reason} />
  )
}
