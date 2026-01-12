
import { Locale } from 'date-fns';

const localize = {
  ordinalNumber: (n: number) => String(n),
  era: (n: number) => ['پ.ز', 'ز'][n],
  quarter: (n: number) => ['چارەکی یەک', 'چارەکی دوو', 'چارەکی سێ', 'چارەکی چوار'][n - 1],
  month: (n: number) => [
    'کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران',
    'تەمموز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'
  ][n],
  day: (n: number) => ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'][n],
  dayPeriod: (n: number) => ['بەیانی', 'نیوەڕۆ', 'پاشنیوەڕۆ', 'ئێوارە', 'شەو'][n],
};

const match = {
  ordinalNumber: /^\d+$/,
  era: /^(پ\.ز|ز)/,
  quarter: /^(1|2|3|4)/,
  month: /^(کانوونی دووەم|شوبات|ئازار|نیسان|ئایار|حوزەیران|تەمموز|ئاب|ئەیلوول|تشرینی یەکەم|تشرینی دووەم|کانوونی یەکەم)/,
  day: /^(یەکشەممە|دووشەممە|سێشەممە|چوارشەممە|پێنجشەممە|هەینی|شەممە)/,
  dayPeriod: /^(بەیانی|نیوەڕۆ|پاشنیوەڕۆ|ئێوارە|شەو)/,
};

const formatLong = {
  date: (options: { width?: 'full' | 'long' | 'medium' | 'short' }) => {
    switch (options.width) {
      case 'full': return "EEEE, d MMMM, yyyy";
      case 'long': return "d MMMM, yyyy";
      case 'medium': return "d MMM, yyyy";
      case 'short': return "dd/MM/yyyy";
      default: return "d MMMM, yyyy";
    }
  },
  time: (options: { width?: 'full' | 'long' | 'medium' | 'short' }) => {
    switch (options.width) {
      case 'full': return "h:mm:ss a zzzz";
      case 'long': return "h:mm:ss a z";
      case 'medium': return "h:mm:ss a";
      case 'short': return "h:mm a";
      default: return "h:mm:ss a";
    }
  },
  dateTime: (options: { width?: 'full' | 'long' | 'medium' | 'short' }) => {
    const date = formatLong.date(options);
    const time = formatLong.time(options);
    return `${date} ${time}`;
  },
};


export const ckb: Locale = {
  code: 'ckb',
  localize,
  match,
  formatLong,
  options: {
    weekStartsOn: 6, // Saturday
    firstWeekContainsDate: 1,
  },
};
