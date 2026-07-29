import { ELEVEN_VOICE_LUNYA } from '@kidsstory/shared'
import { callFalQueue, downloadBytes, FalError } from './fal.js'

const TTS_MODEL = 'fal-ai/elevenlabs/tts/eleven-v3'

interface FalAudioResponse {
  audio?: { url?: string }
}

export async function generateVoiceover(text: string): Promise<Uint8Array> {
  const body = (await callFalQueue(TTS_MODEL, {
    text,
    voice: ELEVEN_VOICE_LUNYA,
    stability: 0.5,
    language_code: 'ru',
  })) as FalAudioResponse

  const url = body.audio?.url
  if (!url) {
    throw new FalError(
      `fal ${TTS_MODEL} вернул ответ без аудио: ${JSON.stringify(body).slice(0, 300)}`,
      502,
    )
  }
  return downloadBytes(url)
}
