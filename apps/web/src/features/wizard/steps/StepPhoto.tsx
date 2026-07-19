import { useRef, useState } from 'react'
import { Camera, Sun, User, X } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'
import { useWizard } from '@/features/wizard/model'

const TIPS = [
  { icon: Sun, text: 'Светлое фото без резких теней' },
  { icon: User, text: 'Лицо анфас, без кепок и очков' },
  { icon: Camera, text: 'Один ребёнок в кадре' },
]

export function StepPhoto() {
  const photoUrl = useWizard((s) => s.photoUrl)
  const setPhoto = useWizard((s) => s.setPhoto)
  const startCasting = useWizard((s) => s.startCasting)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    setPhoto(URL.createObjectURL(file))
  }

  const canContinue = photoUrl !== null

  return (
    <div className="space-y-6 animate-rise">
      <header className="space-y-2">
        <h1 className="font-display text-2xl text-ink-900">Начнём с фото</h1>
        <p className="text-sm text-ink-800">
          Нейросеть нарисует три мультяшных портрета вашего ребёнка — бесплатно. Сюжет выберете потом
        </p>
      </header>

      <ul className="grid grid-cols-3 gap-2">
        {TIPS.map((tip) => (
          <li
            key={tip.text}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white border border-ink-900/15 p-3 text-center"
          >
            <tip.icon className="h-4 w-4 text-mustard-deep" />
            <span className="text-[11px] leading-snug text-ink-800">{tip.text}</span>
          </li>
        ))}
      </ul>

      {photoUrl ? (
        <div className="relative overflow-hidden rounded-3xl border border-ink-900/15">
          <img src={photoUrl} alt="Загруженное фото ребёнка" className="max-h-80 w-full object-cover" />
          <button
            type="button"
            onClick={() => setPhoto(null)}
            aria-label="Удалить фото"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full paper-strong cursor-pointer transition-colors hover:bg-paper-shade"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFile(e.dataTransfer.files[0])
          }}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-10 cursor-pointer transition-colors duration-200',
            dragOver
              ? 'border-ink-900 bg-mustard/25'
              : 'border-ink-900/25 bg-white hover:border-ink-900/40',
          )}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mustard/25">
            <Camera className="h-6 w-6 text-mustard-deep" />
          </span>
          <span className="text-sm font-medium text-ink-900">Выбрать фото</span>
          <span className="text-xs text-ink-500">JPG или PNG, до 10 МБ</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Загрузить фото ребёнка"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <Button size="lg" className="w-full" disabled={!canContinue} onClick={startCasting}>
        Создать героя — бесплатно
      </Button>
    </div>
  )
}
