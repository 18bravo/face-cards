import { cookies } from 'next/headers'

async function getUsername() {
  // Username from env since we use simple auth
  return process.env.ADMIN_USERNAME || 'Admin'
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const isLoggedIn = cookieStore.has('admin_session')
  const username = await getUsername()

  // Login page doesn't need the header
  return (
    <div className="min-h-screen bg-gray-100">
      {isLoggedIn && (
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">Face Cards Admin</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Logged in as <strong>{username}</strong>
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
  return (
    <form action="/api/admin/auth" method="POST">
      <input type="hidden" name="_method" value="DELETE" />
      <button
        type="submit"
        formAction={async () => {
          'use server'
          const { cookies } = await import('next/headers')
          const cookieStore = await cookies()
          cookieStore.delete('admin_session')
        }}
        className="text-sm text-red-600 hover:text-red-800"
      >
        Logout
      </button>
    </form>
  )
}
