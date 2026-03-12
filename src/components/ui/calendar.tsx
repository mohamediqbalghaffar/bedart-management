
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useNavigation, type CaptionProps } from "react-day-picker"
import { ckb } from 'date-fns/locale/ckb';
import { format } from 'date-fns';

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

/**
 * Custom Caption component to handle Kurdish localization and RTL navigation.
 * Displays "Month Year" in Sorani Kurdish and provides intuitive navigation.
 */
function CustomCaption({ displayMonth }: CaptionProps) {
  const { goToMonth, nextMonth, previousMonth } = useNavigation();
  
  // Format the month and year in Kurdish (Sorani)
  // We use date-fns format with the ckb locale for consistent naming
  const monthYear = format(displayMonth, 'MMMM yyyy', { locale: ckb });

  return (
    <div className="flex items-center justify-between px-2 py-4 border-b border-gray-100" dir="rtl">
      {/* Previous Month Button (RTL: Previous is the Right button) */}
      <button
        type="button"
        disabled={!previousMonth}
        onClick={() => previousMonth && goToMonth(previousMonth)}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-8 w-8 text-gray-500 hover:text-primary transition-colors"
        )}
        aria-label="مانگی پێشوو"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      
      {/* Month & Year Display */}
      <div className="text-base font-bold text-gray-900 tracking-tight">
        {monthYear}
      </div>

      {/* Next Month Button (RTL: Next is the Left button) */}
      <button
        type="button"
        disabled={!nextMonth}
        onClick={() => nextMonth && goToMonth(nextMonth)}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-8 w-8 text-gray-500 hover:text-primary transition-colors"
        )}
        aria-label="مانگی داهاتوو"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  );
}

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
      weekStartsOn={0} // Starts on Sunday as requested for logical ordering
      showOutsideDays={showOutsideDays}
      className={cn("p-0 bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 overflow-hidden", className)}
      classNames={{
        months: "flex flex-col",
        month: "space-y-4 p-4",
        table: "w-full border-collapse",
        head_row: "flex w-full mb-2 border-b border-gray-50 pb-2", // Flexbox for reliable 7-column header
        head_cell: "text-muted-foreground font-semibold text-[0.7rem] flex-1 text-center py-1",
        row: "flex w-full mt-1", // Flexbox for reliable 7-column day rows
        cell: "relative p-0 text-center text-sm flex-1 focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal transition-all hover:bg-primary/10 hover:text-primary rounded-lg mx-auto flex items-center justify-center"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-bold shadow-md",
        day_today: "bg-blue-50 text-primary border border-primary/20 font-extrabold shadow-sm",
        day_outside: "text-gray-200 opacity-20 pointer-events-none",
        day_disabled: "text-gray-200 opacity-20",
        day_hidden: "invisible",
        ...classNames,
      }}
      formatters={{
        formatWeekdayName: (date) => {
          // Exact Sorani Kurdish short headers: [Sunday, Monday, ..., Saturday]
          // Index 0: Sunday, 1: Monday, etc.
          const days = ["یەک", "دوو", "سێ", "چوار", "پێنج", "هەینی", "شەم"];
          return days[date.getDay()];
        }
      }}
      modifiers={{
        weekend: (date) => date.getDay() === 5 || date.getDay() === 6, // Friday & Saturday in Kurdish context
      }}
      modifiersClassNames={{
        weekend: "text-red-500/80 font-medium",
      }}
      components={{
        Caption: CustomCaption,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
