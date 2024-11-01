'use client'

import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { PlusCircledIcon } from "@radix-ui/react-icons"

interface AttractionFilterProps {
  title: string
  options: {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
}

export function AttractionFilter({ title, options }: AttractionFilterProps) {
  const [selectedValues, setSelectedValues] = React.useState<Set<string>>(new Set())

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedValues.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 5 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      const newSelectedValues = new Set(selectedValues)
                      if (isSelected) {
                        newSelectedValues.delete(option.value)
                      } else {
                        newSelectedValues.add(option.value)
                      }
                      setSelectedValues(newSelectedValues)
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckIcon className={cn("h-4 w-4")} />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValues.size > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => setSelectedValues(new Set())}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            ) : (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => setSelectedValues(new Set(options.map(option => option.value)))}
                    className="justify-center text-center"
                  >
                    Select all
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function AttractionFilterComponent() {
  const attractionOptions = [
    { label: "Cafes", value: "cafes", icon: ({ className }: { className?: string }) => <span className={className}>☕</span> },
    { label: "Restaurants", value: "restaurants", icon: ({ className }: { className?: string }) => <span className={className}>🍽️</span> },
    { label: "Hotels", value: "hotels", icon: ({ className }: { className?: string }) => <span className={className}>🏨</span> },
    { label: "Attractions", value: "attractions", icon: ({ className }: { className?: string }) => <span className={className}>🎭</span> },
  ]

  return (
    <div className="flex items-center space-x-4">
      <AttractionFilter title="Type" options={attractionOptions} />
    </div>
  )
}

export function CityFilter() {
  const attractionOptions = [
    { label: "Kyoto", value: "kyoto" },
    { label: "Tokyo", value: "restaurants" },
    { label: "Hiroshima", value: "hotels" },
    { label: "Fukuoka", value: "attractions" },
  ]

  return (
    <div className="flex items-center space-x-4">
      <AttractionFilter title="City" options={attractionOptions} />
    </div>
  )
}

export function RatingFilter() {
  const attractionOptions = [
    { label: "Must Do", value: "must_do" },
    { label: "Great", value: "great" },
    { label: "Good", value: "good" },
    { label: "Skip", value: "skip" },
  ]

  return (
    <div className="flex items-center space-x-4">
      <AttractionFilter title="Rating" options={attractionOptions} />
    </div>
  )
}
