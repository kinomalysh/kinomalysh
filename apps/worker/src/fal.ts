import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { IMAGE_EDIT_MODEL, VIDEO_MODEL } from '@kidsstory/shared'
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

export class ContentPolicyError extends FalError {
  constructor(message: string) {
    super(message, 422)
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

interface FalEditResponse {
  images?: Array<{ url?: string }>
}

export async function buildReelFirstFrame(
  photoPaths: string[],
  fullPrompt: string,
  imageSize: 'portrait_16_9' | 'landscape_16_9' = 'portrait_16_9',
): Promise<string> {
  const imageUris = await Promise.all(photoPaths.map(photoToDataUri))
  const res = await fetch(`https://fal.run/${IMAGE_EDIT_MODEL}`, {
    method: 'POST',
    headers: { Authorization: `Key ${env.FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: fullPrompt,
      image_urls: imageUris,
      image_size: imageSize,
      num_images: 1,
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (text.includes('content_policy_violation')) {
      throw new ContentPolicyError('Контент-фильтр модели отклонил промпт')
    }
    throw new FalError(`fal ${IMAGE_EDIT_MODEL} responded ${res.status}: ${text.slice(0, 300)}`, res.status)
  }
  const body = (await res.json()) as FalEditResponse
  const url = body.images?.[0]?.url
  if (!url) throw new FalError(`fal ${IMAGE_EDIT_MODEL} returned no image`, 502)
  return url
}

export async function photoDataUri(relPath: string): Promise<string> {
  return photoToDataUri(relPath)
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
  const {
    status_url: statusUrl,
    response_url: responseUrl,
    request_id: requestId,
  } = (await submit.json()) as {
    status_url: string
    response_url: string
    request_id: string
  }
  console.log(`[fal] ${model} request ${requestId}`)

  let lastLogs = ''
  for (;;) {
    await sleep(5000)
    const status = await fetch(`${statusUrl}?logs=1`, {
      headers: { Authorization: `Key ${env.FAL_KEY}` },
    })
    const state = (await status.json()) as {
      status?: string
      error?: unknown
      logs?: Array<{ message?: string }>
    }
    if (Array.isArray(state.logs) && state.logs.length) {
      lastLogs = state.logs
        .map((l) => l.message ?? '')
        .filter(Boolean)
        .slice(-3)
        .join(' | ')
    }
    if (state.status === 'COMPLETED') break
    if (state.status === 'FAILED' || state.error) {
      throw new FalError(
        `fal ${model} failed (${requestId}): ${JSON.stringify(state).slice(0, 400)}`,
        502,
      )
    }
  }

  const result = await fetch(responseUrl, { headers: { Authorization: `Key ${env.FAL_KEY}` } })
  const raw = await result.text()
  if (!result.ok) {
    throw new FalError(
      `fal ${model} result ${result.status} (${requestId}): ${raw.slice(0, 400)}`,
      result.status,
    )
  }
  try {
    return JSON.parse(raw)
  } catch {
    throw new FalError(
      `fal ${model} вернул не JSON (${requestId}): ${raw.slice(0, 200)}${lastLogs ? ` | логи: ${lastLogs}` : ''}`,
      502,
    )
  }
}

function videoUrlOrThrow(model: string, body: unknown): string {
  const url = (body as FalVideoResponse).video?.url
  if (!url) {
    throw new FalError(
      `fal ${model} вернул ответ без видео: ${JSON.stringify(body).slice(0, 400)}`,
      502,
    )
  }
  return url
}

export async function animateScene(
  sceneImageUrl: string,
  motionPrompt: string,
  options: { negativePrompt?: string } = {},
): Promise<string> {
  const input: Record<string, unknown> = {
    prompt: motionPrompt,
    image_url: sceneImageUrl,
    resolution: VIDEO_MODEL.resolution,
    duration: String(VIDEO_MODEL.duration),
    generate_audio_switch: VIDEO_MODEL.generateAudio,
  }
  if (options.negativePrompt) input.negative_prompt = options.negativePrompt
  return videoUrlOrThrow(VIDEO_MODEL.model, await callFalQueue(VIDEO_MODEL.model, input))
}

const TEXT_VIDEO_MODEL = 'fal-ai/pixverse/v5.5/text-to-video'

export async function animateFromText(
  prompt: string,
  options: { aspectRatio?: '16:9' | '9:16'; negativePrompt?: string } = {},
): Promise<string> {
  const input: Record<string, unknown> = {
    prompt,
    resolution: VIDEO_MODEL.resolution,
    duration: String(VIDEO_MODEL.duration),
    aspect_ratio: options.aspectRatio ?? '16:9',
    generate_audio_switch: VIDEO_MODEL.generateAudio,
  }
  if (options.negativePrompt) input.negative_prompt = options.negativePrompt
  return videoUrlOrThrow(TEXT_VIDEO_MODEL, await callFalQueue(TEXT_VIDEO_MODEL, input))
}
