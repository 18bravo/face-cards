import { cookies } from 'next/headers'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const isLoggedIn = cookieStore.has('admin_session')

  // Login page doesn't need the header
  return (
    <div className="min-h-screen bg-gray-100">
      {isLoggedIn && (
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">Face Cards Admin</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Logged in as <strong>Admin</strong>
              </span>
              <LogoutButton />
            </div>
          </div>
        </header>
      )}
      <main>{children}</main>
    </div>
  )
}

function LogoutButton() {
  async function handleLogout() {
    'use server'
    const { cookies } = await import('next/headers')
    const { revokeSession, COOKIE_NAME } = await import('@/lib/admin-auth')

    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    // Revoke the token first, then delete the cookie
    if (token) {
      await revokeSession(token)
    }
    cookieStore.delete(COOKIE_NAME)
  }

  return (
    <form action={handleLogout}>
      <button
        type="submit"
        className="text-sm text-red-600 hover:text-red-800"
      >
        Logout
      </button>
    </form>
  )
}
