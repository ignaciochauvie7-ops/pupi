import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      company_id: string
    } & DefaultSession['user']
  }

  interface User {
    role: string
    company_id: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    company_id: string
  }
}
