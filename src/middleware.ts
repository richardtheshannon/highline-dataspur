import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Allow access if user has a valid token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/api/projects/:path*',
    '/api/users/:path*',
    '/api/timeline/:path*'
  ]
}