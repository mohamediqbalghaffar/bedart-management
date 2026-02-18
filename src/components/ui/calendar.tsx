"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, Matcher, useNavigation, type CaptionProps } from "react-day-picker"
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { ckb } from 'date-fns/locale/ckb';

import { cn } from "@/lib/utils"
import { buttonVariants } from "./button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./select";

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function CustomCaption({ displayMonth, locale }: CaptionProps) {
  const { goToMonth, nextMonth, previousMonth } = useNavigation();
  const isCkb = locale?.code === 'ckb';
  const formatLocale = isCkb ? ckb : enUS;

  const handlePreviousClick = () => {
    if (previousMonth) {
      goToMonth(previousMonth);
    }
  };

  const handleNextClick = () => {
    if (nextMonth) {
      goToMonth(nextMonth);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="flex justify-between items-center px-1 py-2">
       <button
        type="button"
        disabled={!previousMonth}
        onClick={handlePreviousClick}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon'}), "h-7 w-7")}
      >
        {isCkb ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

        <div className="flex items-center gap-2">
            <Select
                value={displayMonth.getFullYear().toString()}
                onValueChange={(value) => {
                    const newDate = new Date(displayMonth);
                    newDate.setFullYear(parseInt(value, 10));
                    goToMonth(newDate);
                }}
            >
                <SelectTrigger className="w-24 h-8 text-sm focus:ring-0 border-0 shadow-none">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {years.map(year => <SelectItem key={year} value={year.toString()}>{isCkb ? new Intl.NumberFormat('ar-EG-u-nu-arab').format(year) : year}</SelectItem>)}
                </SelectContent>
            </Select>

             <Select
                value={displayMonth.getMonth().toString()}
                onValueChange={(value) => {
                    const newDate = new Date(displayMonth);
                    newDate.setMonth(parseInt(value, 10));
                    goToMonth(newDate);
                }}
            >
                <SelectTrigger className="w-28 h-8 text-sm focus:ring-0 border-0 shadow-none">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {months.map(month => <SelectItem key={month} value={month.toString()}>{format(new Date(displayMonth.getFullYear(), month), "LLLL", { locale: formatLocale })}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>


       <button
        type="button"
        disabled={!nextMonth}
        onClick={handleNextClick}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon'}), "h-7 w-7")}
      >
        {isCkb ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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
  const isCkb = props.locale?.code === 'ckb';
  const weekendMatcher: Matcher = isCkb ? { dayOfWeek: [5] } : { dayOfWeek: [0, 6] }; // CKB: Fri, Gregorian: Sun, Sat

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white text-gray-900 rounded-lg shadow-lg", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        table: "w-full border-collapse space-y-1",
        head_row: "hidden",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-gray-100"
        ),
        day_selected:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:bg-destructive/90",
        day_today: "bg-blue-100 text-accent-foreground rounded-md",
        day_outside: "text-gray-400 opacity-50",
        day_disabled: "text-gray-400 opacity-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      modifiers={{
        weekend: weekendMatcher,
      }}
      modifiersClassNames={{
        weekend: "text-destructive",
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
