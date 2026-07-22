import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { VIDEO_MODEL } from '@kidsstory/shared'
import { env } from './env.js'

const AVATAR_STYLE =
  'Create a Disney Pixar style 3D animated cartoon portrait of the person in this photo, keep the same hairstyle, clothing and joyful expression, oversized expressive eyes, soft rounded features, cute storybook hero standing on a moonlit hill with golden stars, deep indigo night palette with warm golden light, no text'

interface FalImageResponse {
  images?: Array<{ url?: string }>
}

export class FalError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

async function callFal(model: string, input: Record<string, unknown>): Promise<string> {
  const res = await fetch(`https://fal.run/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${env.FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new FalError(`fal ${model} responded ${res.status}: ${text.slice(0, 300)}`, res.status)
  }
  const body = (await res.json()) as FalImageResponse
  const url = body.images?.[0]?.url
  if (!url) throw new FalError(`fal ${model} returned no image`, 502)
  return url
}

async function photoToDataUri(relPath: string): Promise<string> {
  const abs = path.resolve(env.UPLOADS_DIR, relPath)
  const buf = await readFile(abs)
  const ext = path.extname(abs).slice(1)
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  return `data:${mime};base64,${buf.toString('base64')}`
}

export async function generateAvatars(photoPath: string, count = 3): Promise<string[]> {
  const imageUri = await photoToDataUri(photoPath)
  const results: string[] = []
  for (let i = 0; i < count; i += 1) {
    const url = await callFal('fal-ai/nano-banana-2', {
      prompt: AVATAR_STYLE,
      image_url: imageUri,
      image_size: 'portrait_4_3',
      num_images: 1,
    })
    results.push(url)
  }
  return results
}

export async function generateScene(avatarUrl: string, scenePrompt: string): Promise<string> {
  return callFal('fal-ai/nano-banana-2', {
    prompt: scenePrompt.replace('The hero child', 'This exact child character'),
    image_url: avatarUrl,
    image_size: 'landscape_16_9',
    num_images: 1,
  })
}

interface FalVideoResponse {
  video?: { url?: string }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function callFalQueue(model: string, input: Record<string, unknown>): Promise<unknown> {
  const submit = await fetch(`https://queue.fal.run/${model}`, {
    method: 'POST',
    headers: { Authorization: `Key ${env.FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!submit.ok) {
    const text = await submit.text().catch(() => '')
    throw new FalError(`fal ${model} submit ${submit.status}: ${text.slice(0, 300)}`, submit.status)
  }
  const { status_url: statusUrl, response_url: responseUrl } = (await submit.json()) as {
    status_url: string
    response_url: string
  }

  for (;;) {
    await sleep(5000)
    const status = await fetch(statusUrl, { headers: { Authorization: `Key ${env.FAL_KEY}` } })
    const state = (await status.json()) as { status?: string; error?: unknown }
    if (state.status === 'COMPLETED') break
    if (state.status === 'FAILED' || state.error) {
      throw new FalError(`fal ${model} failed: ${JSON.stringify(state).slice(0, 300)}`, 502)
    }
  }

  const result = await fetch(responseUrl, { headers: { Authorization: `Key ${env.FAL_KEY}` } })
  return result.json()
}

export async function animateScene(sceneImageUrl: string, motionPrompt: string): Promise<string> {
  const body = (await callFalQueue(VIDEO_MODEL.model, {
    prompt: motionPrompt,
    image_url: sceneImageUrl,
    resolution: VIDEO_MODEL.resolution,
    duration: VIDEO_MODEL.duration,
    generate_audio: VIDEO_MODEL.generateAudio,
  })) as FalVideoResponse
  const url = body.video?.url
  if (!url) throw new FalError(`fal ${VIDEO_MODEL.model} returned no video`, 502)
  return url
}
