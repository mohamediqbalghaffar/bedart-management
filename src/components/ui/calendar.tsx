"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { format as formatDate } from 'date-fns-jalali'
import { ckb } from "@/lib/ckb-locale"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

const kurdishDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const formatDayKurdish = (day: Date) => {
  const dayOfMonth = formatDate(day, 'd');
  return dayOfMonth.split('').map(digit => kurdishDigits[parseInt(digit, 10)]).join('');
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const isRtl = props.locale === ckb;
  
  const formatCaption = (month: Date, options?: { locale?: any }) => {
    return formatDate(month, 'LLLL yyyy', { locale: options?.locale });
  };
  const formatWeekdayName = (day: Date, options?: { locale?: any }) => {
    return formatDate(day, 'EEEEEE', { locale: options?.locale });
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      dir={isRtl ? "rtl" : "ltr"}
      formatters={isRtl ? { formatCaption, formatDay: formatDayKurdish, formatWeekdayName } : {}}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-gray-900",
        nav: "flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md border border-gray-300 text-gray-800 hover:bg-gray-100"
        ),
        nav_button_previous: cn("absolute", isRtl ? "right-1" : "left-1"),
        nav_button_next: cn("absolute", isRtl ? "left-1" : "right-1"),
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          "[&:has([aria-selected].day-outside)]:bg-primary/10 [&:has([aria-selected])]:bg-primary/20",
          isRtl
            ? "[&:has([aria-selected].day-range-end)]:rounded-l-md first:[&:has([aria-selected])]:rounded-r-md last:[&:has([aria-selected])]:rounded-l-md"
            : "[&:has([aria-selected].day-range-end)]:rounded-r-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
        ),
        day: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md text-gray-800 hover:bg-primary/10"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-gray-200 text-gray-900",
        day_outside:
          "day-outside text-gray-400 opacity-50 aria-selected:text-gray-500",
        day_disabled: "text-gray-400 opacity-50",
        day_range_middle:
          "aria-selected:bg-primary/20 aria-selected:text-black",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

    