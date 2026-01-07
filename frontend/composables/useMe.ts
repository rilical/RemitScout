type BackendUser = {
  user_id: string
  email: string
  name: string | null
}

type MeResponse = {
  success: boolean
  user: BackendUser
}

export const useMe = () => {
  const { request } = useApi()
  const { applyBackendProfile } = useAuth()

  const getMe = async () => {
    const data = await request<MeResponse>('/me')
    if (data?.user) {
      applyBackendProfile(data.user)
    }
    return data
  }

  const updateProfile = async (payload: { name?: string | null }) => {
    const data = await request<MeResponse>('/me', {
      method: 'PATCH',
      body: payload,
    })
    if (data?.user) {
      applyBackendProfile(data.user)
    }
    return data
  }

  return {
    getMe,
    updateProfile,
  }
}
