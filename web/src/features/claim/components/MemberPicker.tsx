import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Member } from '../types'

interface Props {
  members: Member[]
  value: string
  onChange: (code: string) => void
}

// search by name or member code, as the ACPS intimation form does
export function MemberPicker({ members, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const selected = members.find((m) => m.code === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="h-10 w-full justify-between font-normal">
          {selected ? (
            <span className="truncate">
              {selected.name} <span className="text-muted-foreground">{selected.code}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Search by member name or code</span>
          )}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Member name or code" />
          <CommandList>
            <CommandEmpty>No member found.</CommandEmpty>
            <CommandGroup>
              {members.map((m) => (
                <CommandItem
                  key={m.code}
                  value={`${m.name} ${m.code}`}
                  onSelect={() => {
                    onChange(m.code)
                    setOpen(false)
                  }}
                >
                  <div className="flex flex-col">
                    <span>{m.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {m.code}, {m.relation.toLowerCase()}, plan {m.plan.plan_name}
                    </span>
                  </div>
                  <Check className={cn('ml-auto', m.code === value ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
