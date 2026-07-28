import { ELEVEN_MODEL, ELEVEN_VOICE_LUNYA } from '@kidsstory/shared'
import { env } from './env.js'

export class ElevenLabsError extends Error {}

export async function generateVoiceover(text: string): Promise<Uint8Array> {
  if (!env.ELEVENLABS_API_KEY) throw new ElevenLabsError('ELEVENLABS_API_KEY не задан')
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_LUNYA}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: ELEVEN_MODEL,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  )
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new ElevenLabsError(`ElevenLabs ${res.status}: ${detail.slice(0, 300)}`)
  }
  return new Uint8Array(await res.arrayBuffer())
}
