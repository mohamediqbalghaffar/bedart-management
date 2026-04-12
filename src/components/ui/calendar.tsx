"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { ckb } from 'date-fns/locale/ckb'
import { format } from 'date-fns'

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      dir="rtl"
      locale={ckb}
      weekStartsOn={6}
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-4 bg-white rounded-[1.5rem] shadow-xl border border-slate-200/60 select-none",
        className
      )}
      classNames={{
        // Layout
        months: "flex flex-col",
        month: "space-y-3 w-full",
        month_caption: "flex items-center justify-between px-1 pb-2 border-b border-slate-100",
        caption_label: "text-base font-bold text-slate-800 tracking-tight",

        // Navigation
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-full transition-colors"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-full transition-colors"
        ),

        // Grid — the critical fix for the vertical list bug
        month_grid: "w-full border-collapse",
        weekdays: "flex w-full",
        weekday:
          "flex-1 text-center text-[0.7rem] font-semibold text-slate-400 uppercase tracking-wider py-2",
        week: "flex w-full mt-1",
        day: "flex-1 flex items-center justify-center p-0 relative",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-medium rounded-full text-slate-700",
          "hover:bg-slate-100 hover:text-slate-900",
          "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
          "transition-colors duration-150"
        ),

        // Day state modifiers
        selected:
          "day_button:bg-blue-600 day_button:text-white day_button:hover:bg-blue-700 day_button:hover:text-white day_button:font-bold",
        today: "day_button:bg-blue-50 day_button:text-blue-600 day_button:font-bold",
        outside: "opacity-30 pointer-events-none",
        disabled: "opacity-30 cursor-not-allowed pointer-events-none",
        hidden: "invisible",
        range_start: "day_button:bg-blue-600 day_button:text-white day_button:rounded-full",
        range_end: "day_button:bg-blue-600 day_button:text-white day_button:rounded-full",
        range_middle: "day_button:bg-blue-50 day_button:text-blue-700 day_button:rounded-none",

        ...classNames,
      }}
      formatters={{
        formatWeekdayName: (date) => {
          // Kurdish short weekday names, Sunday-first
          const days = ["یەک", "دوو", "سێ", "چوار", "پێنج", "هەین", "شەم"]
          return days[date.getDay()]
        },
        formatCaption: (month) => format(month, "MMMM yyyy", { locale: ckb }),
      }}
      components={{
        // Correct v9 navigation chevrons for RTL (right = previous, left = next)
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />
          }
          return <ChevronRight className="h-4 w-4" />
        },
      }}
      modifiers={{
        weekend: (date) => date.getDay() === 5 || date.getDay() === 6,
      }}
      modifiersClassNames={{
        weekend: "text-rose-500",
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
