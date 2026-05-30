import 'next-auth'

// Extend the built-in session types to include the user's database id.
// This is populated in the session callback in auth.ts.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}
