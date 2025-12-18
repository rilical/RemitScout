import { createId } from '~/utils/id'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

export const useAuth = () => {
  const { state: user, hydrated } = usePersistedState<User | null>('auth:user', () => null)

  const isLoggedIn = computed(() => user.value !== null)

  function setUser(newUser: User | null) {
    user.value = newUser
  }

  function signIn(email: string, _password?: string) {
    setUser({
      id: createId('user'),
      email,
      name: email.split('@')[0] || 'User',
    })
  }

  function signOut() {
    setUser(null)
  }

  return {
    user,
    hydrated,
    isLoggedIn,
    // Back-compat for existing components
    isAuthenticated: isLoggedIn,
    signIn,
    signOut,
    setUser,
  }
}
