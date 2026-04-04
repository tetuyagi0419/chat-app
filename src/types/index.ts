export type Profile = {
  id: string
  username: string
  avatar_url?: string
  created_at: string
}

export type Room = {
  id: string
  name: string
  created_by: string
  created_at: string
}

export type Message = {
  id: string
  room_id: string
  user_id: string
  content: string
  created_at: string
  profile?: Pick<Profile, 'username' | 'avatar_url'>
}
