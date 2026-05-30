import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/routes'
import { CreateInvitationForm } from '@/components/invitation/CreateInvitationForm'

export default async function NewInvitationPage() {
  const session = await auth()
  if (!session?.user?.id) redirect(ROUTES.LOGIN)

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Invitation</h1>
        <p className="text-gray-500 mb-10">Create a personalized date invitation to share.</p>
        <CreateInvitationForm />
      </div>
    </main>
  )
}
