import { describe, expect, it } from 'vitest'
import { declineName, hasNamePlaceholder, renderVoiceoverText } from '../personalization.js'

describe('hasNamePlaceholder', () => {
  it('находит простой плейсхолдер', () => {
    expect(hasNamePlaceholder('Привет, {имя}!')).toBe(true)
  })

  it('находит плейсхолдер с падежом', () => {
    expect(hasNamePlaceholder('История про {имя:вин}')).toBe(true)
  })

  it('не срабатывает на обычном тексте', () => {
    expect(hasNamePlaceholder('Просто текст про имя')).toBe(false)
  })

  it('переживает null и пустую строку', () => {
    expect(hasNamePlaceholder(null)).toBe(false)
    expect(hasNamePlaceholder('')).toBe(false)
  })
})

describe('declineName', () => {
  it('склоняет мужское имя в дательном', () => {
    expect(declineName('Тёма', 'дат', 'male')).toBe('Тёме')
  })

  it('склоняет женское имя в родительном', () => {
    expect(declineName('Алиса', 'род', 'female')).toBe('Алисы')
  })

  it('оставляет именительный как есть', () => {
    expect(declineName('Алиса', 'им', 'female')).toBe('Алиса')
  })

  it('возвращает имя, если падеж неизвестен', () => {
    expect(declineName('Алиса', 'звательный', 'female')).toBe('Алиса')
  })
})

describe('renderVoiceoverText', () => {
  it('подставляет имя во всех падежах', () => {
    const text = '{имя} проснулся. У {имя:род} был день. Дадим {имя:дат} щётку.'
    expect(renderVoiceoverText(text, 'Тёма', 'male')).toBe(
      'Тёма проснулся. У Тёмы был день. Дадим Тёме щётку.',
    )
  })

  it('учитывает пол: имя на согласную склоняется только у мальчика', () => {
    expect(renderVoiceoverText('У {имя:род}', 'Ярослав', 'male')).toBe('У Ярослава')
    expect(renderVoiceoverText('У {имя:род}', 'Нинель', 'female')).toBe('У Нинель')
  })

  it('возвращает исходный текст при пустом имени', () => {
    expect(renderVoiceoverText('Привет, {имя}', '   ')).toBe('Привет, {имя}')
  })

  it('не трогает текст без плейсхолдеров', () => {
    expect(renderVoiceoverText('Спокойной ночи', 'Тёма')).toBe('Спокойной ночи')
  })

  it('обрезает пробелы вокруг имени', () => {
    expect(renderVoiceoverText('{имя}!', '  Тёма  ')).toBe('Тёма!')
  })
})

describe('орфография после шипящих', () => {
  it('мужское имя на -ша не превращается в «Сашы»', () => {
    expect(declineName('Саша', 'род', 'male')).toBe('Саши')
    expect(declineName('Миша', 'род', 'male')).toBe('Миши')
    expect(declineName('Гоша', 'род', 'male')).toBe('Гоши')
  })

  it('творительный после шипящих даёт «-ей», а не «-ой»', () => {
    expect(declineName('Саша', 'тв', 'male')).toBe('Сашей')
    expect(declineName('Лёша', 'тв', 'male')).toBe('Лёшей')
  })

  it('не ломает имена без шипящих', () => {
    expect(declineName('Никита', 'род', 'male')).toBe('Никиты')
    expect(declineName('Никита', 'тв', 'male')).toBe('Никитой')
    expect(declineName('Лиза', 'род', 'female')).toBe('Лизы')
  })

  it('женские имена остаются корректными', () => {
    expect(declineName('Даша', 'род', 'female')).toBe('Даши')
    expect(declineName('Даша', 'тв', 'female')).toBe('Дашей')
  })
})
