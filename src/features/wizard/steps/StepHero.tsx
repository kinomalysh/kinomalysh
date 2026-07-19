import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { Field } from '@/shared/ui/Field'
import { useWizard } from '@/features/wizard/model'

const AGES = [2, 3, 4, 5, 6, 7, 8, 9, 10]

export function StepHero() {
  const childName = useWizard((s) => s.childName)
  const childAge = useWizard((s) => s.childAge)
  const gender = useWizard((s) => s.gender)
  const setHero = useWizard((s) => s.setHero)
  const setHeroNext = useWizard((s) => s.startPhotoStep)
  const [touched, setTouched] = useState(false)

  const nameError = touched && childName.trim().length < 2 ? 'Введите имя ребёнка' : undefined
  const canContinue = childName.trim().length >= 2 && childAge !== null && gender !== null

  return (
    <div className="space-y-6 animate-rise">
      <header className="space-y-2">
        <h1 className="font-display text-2xl text-ink-900">Кто наш герой?</h1>
        <p className="text-sm text-ink-800">
          Имя прозвучит в озвучке, а возраст и пол влияют на текст и иллюстрации
        </p>
      </header>

      <Field
        label="Имя ребёнка"
        placeholder="Например, Алиса"
        value={childName}
        maxLength={20}
        error={nameError}
        onBlur={() => setTouched(true)}
        onChange={(e) => setHero({ childName: e.target.value })}
      />

      <fieldset className="space-y-2.5">
        <legend className="text-sm font-medium text-ink-800">Возраст</legend>
        <div className="flex flex-wrap gap-2">
          {AGES.map((age) => (
            <Chip
              key={age}
              active={childAge === age}
              onClick={() => setHero({ childAge: age })}
              className="min-w-11"
            >
              {age}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2.5">
        <legend className="text-sm font-medium text-ink-800">Пол</legend>
        <div className="flex gap-2">
          <Chip active={gender === 'girl'} onClick={() => setHero({ gender: 'girl' })} className="flex-1">
            Девочка
          </Chip>
          <Chip active={gender === 'boy'} onClick={() => setHero({ gender: 'boy' })} className="flex-1">
            Мальчик
          </Chip>
        </div>
      </fieldset>

      <Button size="lg" className="w-full" disabled={!canContinue} onClick={setHeroNext}>
        Дальше — выбрать сюжет
      </Button>
    </div>
  )
}
