import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { Field } from '@/shared/ui/Field'
import { useWizard } from '@/features/wizard/model'

const NAME_PATTERN = /^[А-Яа-яЁёA-Za-z-]+$/

export function StepHero() {
  const product = useWizard((s) => s.product)
  const childName = useWizard((s) => s.childName)
  const gender = useWizard((s) => s.gender)
  const setHero = useWizard((s) => s.setHero)
  const goToPhoto = useWizard((s) => s.goToPhoto)
  const [touched, setTouched] = useState(false)

  const trimmed = childName.trim()
  const nameValid = trimmed.length >= 2 && NAME_PATTERN.test(trimmed)
  const nameError = touched && !nameValid ? 'Только буквы и дефис, минимум две буквы' : undefined
  const canContinue = nameValid && gender !== null

  return (
    <div className="space-y-6 animate-rise">
      <header className="space-y-2">
        <h1 className="font-display text-2xl text-ink-900">Кто наш герой?</h1>
        <p className="text-sm text-ink-800">
          Имя прозвучит в озвучке живым голосом и просклоняется по падежам, а пол меняет и текст, и
          картинку {product ? `мультфильма «${product.title}»` : ''}
        </p>
      </header>

      <Field
        label="Имя ребёнка"
        placeholder="Например, Алиса"
        value={childName}
        maxLength={30}
        error={nameError}
        onBlur={() => setTouched(true)}
        onChange={(event) => setHero({ childName: event.target.value })}
      />

      <fieldset className="space-y-2.5">
        <legend className="text-sm font-semibold text-ink-800">Пол</legend>
        <div className="flex gap-2">
          <Chip
            active={gender === 'male'}
            className="flex-1"
            onClick={() => setHero({ gender: 'male' })}
          >
            Мальчик
          </Chip>
          <Chip
            active={gender === 'female'}
            className="flex-1"
            onClick={() => setHero({ gender: 'female' })}
          >
            Девочка
          </Chip>
        </div>
      </fieldset>

      <Button
        size="lg"
        className="w-full"
        disabled={!canContinue}
        onClick={() => {
          setTouched(true)
          if (canContinue) goToPhoto()
        }}
      >
        Дальше - фото
      </Button>
    </div>
  )
}
