import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(50),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const storyDetailsSchema = z.object({
  childName: z.string().min(1).max(30),
  childAge: z.number().int().min(1).max(14),
  gender: z.enum(['boy', 'girl']),
  plotId: z.string().min(1),
  format: z.enum(['video', 'book']),
})

export const chooseAvatarSchema = z.object({
  avatarIndex: z.number().int().min(0).max(2),
})

export const topupSchema = z.object({
  packId: z.string().min(1),
  method: z.enum(['sbp', 'card']).default('sbp'),
})

export const adminLoginSchema = z.object({
  login: z.string().min(1).max(64),
  password: z.string().min(1),
})

export const updatePromptsSchema = z.object({
  scenePrompts: z.array(z.string().min(1).max(2000)).min(1).max(20),
})

export const adjustBalanceSchema = z.object({
  delta: z.number().int().refine((v) => v !== 0, 'Изменение не может быть нулевым'),
  reason: z.string().max(200).optional(),
})

export const createReelSchema = z.object({
  kind: z.enum(['t2v', 'i2v']),
  title: z.string().max(120).optional(),
  scenePrompt: z.string().min(3).max(2000),
  motionPrompt: z.string().max(2000).optional(),
})

export type StoryStatus =
  | 'casting'
  | 'awaiting_choice'
  | 'awaiting_details'
  | 'rendering'
  | 'ready'
  | 'failed'

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'canceled'

export interface StoryDto {
  id: string
  status: StoryStatus
  plotId: string | null
  childName: string | null
  childAge: number | null
  gender: 'boy' | 'girl' | null
  format: 'video' | 'book' | null
  tokensCost: number | null
  avatars: string[]
  chosenAvatar: number | null
  resultUrl: string | null
  createdAt: string
}
