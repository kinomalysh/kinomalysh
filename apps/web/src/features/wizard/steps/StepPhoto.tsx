import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Sun, User, WarningCircle, X } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { cn } from '@/shared/lib/cn'
import { ROUTES } from '@/shared/config/routes'
import { useWizard } from '@/features/wizard/model'

const TIPS = [
  { icon: Sun, text: 'Светлое фото без резких теней' },
  { icon: User, text: 'Лицо анфас, без кепок и очков' },
  { icon: Camera, text: 'Один ребёнок в кадре' },
]

const MAX_BYTES = 10 * 1024 * 1024

interface StepPhotoProps {
  requireAuth: () => boolean
  onSubmitted: (orderId: string) => void
}

export function StepPhoto({ requireAuth, onSubmitted }: StepPhotoProps) {
  const photoPreview = useWizard((s) => s.photoPreview)
  const setPhoto = useWizard((s) => s.setPhoto)
  const consentGuardian = useWizard((s) => s.consentGuardian)
  const consentTransfer = useWizard((s) => s.consentTransfer)
  const setConsent = useWizard((s) => s.setConsent)
  const submitOrder = useWizard((s) => s.submitOrder)
  const submitting = useWizard((s) => s.submitting)
  const error = useWizard((s) => s.error)

  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setLocalError('Нужен файл-картинка: JPG, PNG или WebP')
      return
    }
    if (file.size > MAX_BYTES) {
      setLocalError('Фото больше 10 МБ - уменьшите или снимите заново')
      return
    }
    setLocalError(null)
    setPhoto(file)
  }

  const canSubmit = Boolean(photoPreview) && consentGuardian && consentTransfer

  const handleSubmit = async () => {
    if (!requireAuth()) return
    const order = await submitOrder()
    if (order) onSubmitted(order.id)
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl text-ink-900">Фотография героя</h1>
        <p className="text-sm text-ink-800">
          По ней нейросеть нарисует ребёнка внутри мультфильма. Фото используется только для вашего
          заказа и удаляется через неделю
        </p>
      </header>

      <ul className="grid grid-cols-3 gap-2">
        {TIPS.map((tip) => (
          <li
            key={tip.text}
            className="flex flex-col items-center gap-2 rounded-2xl border border-ink-900/15 bg-white p-3 text-center"
          >
            <tip.icon className="h-4 w-4 text-mustard-deep" />
            <span className="text-[11px] leading-snug text-ink-800">{tip.text}</span>
          </li>
        ))}
      </ul>

      {photoPreview ? (
        <div className="relative overflow-hidden rounded-3xl border border-ink-900/15">
          <img
            src={photoPreview}
            alt="Загруженное фото ребёнка"
            className="max-h-80 w-full object-cover"
          />
          <button
            type="button"
            onClick={() => setPhoto(null)}
            aria-label="Удалить фото"
            className="absolute right-3 top-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/90 transition-colors hover:bg-white"
          >
            <X className="h-4 w-4 text-night-950" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragOver(false)
            handleFile(event.dataTransfer.files[0])
          }}
          className={cn(
            'flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-10 transition-colors duration-200',
            dragOver
              ? 'border-ink-900 bg-mustard/25'
              : 'border-ink-900/25 bg-white hover:border-ink-900/40',
          )}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mustard/25">
            <Camera className="h-6 w-6 text-mustard-deep" />
          </span>
          <span className="text-sm font-medium text-ink-900">Выбрать фото</span>
          <span className="text-xs text-ink-500">JPG, PNG или WebP, до 10 МБ</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Загрузить фото ребёнка"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      <fieldset className="space-y-3">
        <legend className="sr-only">Согласия на обработку фотографии</legend>
        <ConsentBox
          checked={consentGuardian}
          onChange={(value) => setConsent('consentGuardian', value)}
        >
          Я законный представитель ребёнка и согласен на обработку его фотографии для создания
          мультфильма
        </ConsentBox>
        <ConsentBox
          checked={consentTransfer}
          onChange={(value) => setConsent('consentTransfer', value)}
        >
          Согласен на трансграничную передачу фотографии сервисам генерации на время обработки.
          Подробнее - в{' '}
          <Link to={ROUTES.privacy} className="underline underline-offset-2">
            политике конфиденциальности
          </Link>
        </ConsentBox>
      </fieldset>

      {(localError || error) && (
        <Card className="flex items-start gap-3 p-4">
          <WarningCircle className="mt-0.5 h-5 w-5 shrink-0 text-berry" />
          <p className="text-sm text-ink-800">{localError ?? error}</p>
        </Card>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={!canSubmit}
        loading={submitting}
        onClick={() => void handleSubmit()}
      >
        Нарисовать героя
      </Button>
    </div>
  )
}

interface ConsentBoxProps {
  checked: boolean
  onChange: (value: boolean) => void
  children: ReactNode
}

function ConsentBox({ checked, onChange, children }: ConsentBoxProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors duration-150',
        checked ? 'border-mustard bg-mustard/10' : 'border-ink-900/15 bg-white hover:border-ink-900/30',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--t-gold)]"
      />
      <span className="text-xs leading-relaxed text-ink-800">{children}</span>
    </label>
  )
}
