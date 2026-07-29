import petrovich from 'petrovich'

export type ChildGender = 'male' | 'female'

const PLACEHOLDER_SOURCE = '\\{имя(?::(им|род|дат|вин|тв|пр))?\\}'

const CASES: Record<string, string> = {
  им: 'nominative',
  род: 'genitive',
  дат: 'dative',
  вин: 'accusative',
  тв: 'instrumental',
  пр: 'prepositional',
}

export const NAME_PLACEHOLDER_HINT = '{имя}, {имя:род}, {имя:дат}, {имя:вин}, {имя:тв}, {имя:пр}'

export function hasNamePlaceholder(text: string | null | undefined): boolean {
  if (!text) return false
  return new RegExp(PLACEHOLDER_SOURCE).test(text)
}

export function declineName(name: string, ruCase: string, gender: ChildGender): string {
  const target = CASES[ruCase]
  if (!target || target === 'nominative') return name
  try {
    const declined = petrovich({ first: name, gender }, target)
    return declined.first || name
  } catch {
    return name
  }
}

export function renderVoiceoverText(
  text: string,
  name: string,
  gender: ChildGender = 'male',
): string {
  const clean = name.trim()
  if (!clean) return text
  return text.replace(new RegExp(PLACEHOLDER_SOURCE, 'g'), (_match, ruCase?: string) =>
    declineName(clean, ruCase ?? 'им', gender),
  )
}
