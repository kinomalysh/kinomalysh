import { DownloadSimple } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { plural } from '@/shared/lib/format'
import type { OrderBook } from '@/entities/order/model'
import { BookReader } from './BookReader'

interface BookResultProps {
  title: string
  book: OrderBook
  daysLeft: number | null
}

export function BookResult({ title, book, daysLeft }: BookResultProps) {
  return (
    <div className="space-y-5">
      {book.pages.length > 0 && (
        <BookReader
          title={title}
          pages={book.pages.map((page) => ({ imageUrl: page.imageUrl, text: page.text }))}
        />
      )}


      {book.pdfUrl && (
        <Button size="lg" className="w-full" onClick={() => window.open(book.pdfUrl as string)}>
          <DownloadSimple className="h-5 w-5" />
          Скачать книгу в PDF
        </Button>
      )}

      {daysLeft !== null && (
        <p className="text-center text-xs text-ink-500">
          Книга хранится ещё {daysLeft} {plural(daysLeft, 'день', 'дня', 'дней')} - скачайте, чтобы
          сохранить навсегда
        </p>
      )}
    </div>
  )
}
