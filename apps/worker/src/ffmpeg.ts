import { execFile } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)

export class FfmpegError extends Error {}

const VIDEO_ARGS = [
  '-c:v',
  'libx264',
  '-preset',
  'medium',
  '-crf',
  '20',
  '-pix_fmt',
  'yuv420p',
  '-r',
  '25',
  '-c:a',
  'aac',
  '-b:a',
  '192k',
  '-ar',
  '44100',
  '-ac',
  '2',
]

async function ffmpeg(args: string[]): Promise<void> {
  try {
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
      maxBuffer: 16 * 1024 * 1024,
    })
  } catch (error) {
    const stderr = error instanceof Error && 'stderr' in error ? String(error.stderr) : ''
    throw new FfmpegError(`ffmpeg упал: ${stderr.slice(-400) || String(error)}`)
  }
}

export async function probeDuration(file: string): Promise<number> {
  const { stdout } = await run('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    file,
  ])
  const seconds = Number.parseFloat(stdout.trim())
  if (!Number.isFinite(seconds)) throw new FfmpegError(`не удалось прочитать длительность ${file}`)
  return seconds
}

const NORMALIZE =
  'scale=1920:1080:force_original_aspect_ratio=decrease,' +
  'pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25'

export async function buildSegment(
  clipPath: string,
  voPath: string | null,
  outPath: string,
): Promise<void> {
  if (!voPath) {
    await ffmpeg([
      '-i',
      clipPath,
      '-f',
      'lavfi',
      '-i',
      'anullsrc=channel_layout=stereo:sample_rate=44100',
      '-filter_complex',
      `[0:v]${NORMALIZE}[v]`,
      '-map',
      '[v]',
      '-map',
      '1:a',
      '-shortest',
      ...VIDEO_ARGS,
      outPath,
    ])
    return
  }

  const [clipSeconds, voSeconds] = await Promise.all([probeDuration(clipPath), probeDuration(voPath)])
  const pad = Math.max(0, voSeconds - clipSeconds)
  const chain =
    pad > 0.05
      ? `[0:v]${NORMALIZE},tpad=stop_mode=clone:stop_duration=${pad.toFixed(2)}[v]`
      : `[0:v]${NORMALIZE}[v]`

  await ffmpeg([
    '-i',
    clipPath,
    '-i',
    voPath,
    '-filter_complex',
    chain,
    '-map',
    '[v]',
    '-map',
    '1:a',
    ...VIDEO_ARGS,
    outPath,
  ])
}

export async function concatSegments(
  segmentPaths: string[],
  workDir: string,
  outPath: string,
): Promise<void> {
  if (segmentPaths.length === 0) throw new FfmpegError('нечего склеивать: нет сегментов')
  const listPath = path.join(workDir, 'concat.txt')
  await writeFile(listPath, segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'))
  await ffmpeg(['-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outPath])
}
