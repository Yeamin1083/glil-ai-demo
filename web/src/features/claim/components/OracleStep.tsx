import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { OracleRecord } from '../types'

export function OracleStep({ record, onNext }: { record: OracleRecord; onNext: () => void }) {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <CheckCircle2 className="size-5 text-emerald-600" /> Posted {String(record.intimation_number)}
        </CardTitle>
        <CardDescription>
          This is what would be written to Oracle. Settled amounts now count against the member's limits, and
          submitting the same claim again is caught as a duplicate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="max-h-[420px] overflow-auto rounded-lg border bg-muted p-4 text-xs">
          {JSON.stringify(record, null, 2)}
        </pre>
      </CardContent>
      <CardFooter className="justify-end">
        <Button size="lg" onClick={onNext}>Intimate another claim</Button>
      </CardFooter>
    </Card>
  )
}
