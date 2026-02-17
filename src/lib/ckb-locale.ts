
import type { Locale } from 'date-fns';

const era = {
  narrow: ['پ.ز', 'ز'],
  abbreviated: ['پ.ز', 'ز'],
  wide: ['پێش زایین', 'زایینی'],
};

const quarter = {
  narrow: ['١', '٢', '٣', '٤'],
  abbreviated: ['چ١', 'چ٢', 'چ٣', 'چ٤'],
  wide: ['چارەکی یەکەم', 'چارەکی دووەم', 'چارەکی سێیەم', 'چارەکی چوارەم'],
};

const month = {
  narrow: ['ک', 'ش', 'ئ', 'ن', 'ئ', 'ح', 'ت', 'ئ', 'ئ', 'ت', 'ت', 'ک'],
  abbreviated: [
    'کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران',
    'تەمموز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'
  ],
  wide: [
    'کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران',
    'تەمموز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'
  ],
};

const day = {
  narrow: ['ی', 'د', 'س', 'چ', 'پ', 'ه', 'ش'],
  short: ['یەکشەم', 'دووشەم', 'سێشەم', 'چوارشەم', 'پێنجشەم', 'هەینی', 'شەممە'],
  abbreviated: ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'],
  wide: ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'],
};

const dayPeriod = {
  narrow: { am: 'ب', pm: 'د.ن', midnight: 'ن.ش', noon: 'ن', morning: 'بەیانی', afternoon: 'د.ن', evening: 'ئێوارە', night: 'شەو' },
  abbreviated: { am: 'بەیانی', pm: 'د.نیوەڕۆ', midnight: 'نیوەی شەو', noon: 'نیوەڕۆ', morning: 'بەیانی', afternoon: 'دوای نیوەڕۆ', evening: 'ئێوارە', night: 'شەو' },
  wide: { am: 'بەیانی', pm: 'دوای نیوەڕۆ', midnight: 'نیوەی شەو', noon: 'نیوەڕۆ', morning: 'بەیانی', afternoon: 'دوای نیوەڕۆ', evening: 'ئێوارە', night: 'شەو' },
};

const formatLong = {
  date: {
    full: 'EEEE, d MMMM, yyyy', // یەکشەممە، ١٤ی نیسانی ٢٠٢٤
    long: 'd MMMM, yyyy', // ١٤ی نیسانی ٢٠٢٤
    medium: 'd MMM, yyyy', // ١٤ نیسان ٢٠٢٤
    short: 'dd/MM/yyyy', // ١٤/٠٤/٢٠٢٤
  },
  time: {
    full: 'h:mm:ss a zzzz',
    long: 'h:mm:ss a z',
    medium: 'h:mm:ss a',
    short: 'h:mm a',
  },
  dateTime: {
    full: "{{date}} 'لە' {{time}}",
    long: "{{date}} 'لە' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
};

const localize = {
    ordinalNumber: (n: number) => String(n),
    era: (n: number) => era.wide[n],
    quarter: (n: number) => quarter.wide[n - 1],
    month: (n: number) => month.wide[n - 1],
    day: (n: number) => day.wide[n],
    dayPeriod: (key: keyof typeof dayPeriod.wide) => dayPeriod.wide[key],
};

const match = {
  ordinalNumber: /^\d+/,
  era: /^(پێش زایین|زایینی)/,
  quarter: /^(چارەکی یەکەم|چارەکی دووەم|چارەکی سێیەم|چارەکی چوارەم)/,
  month: /^(کانوونی دووەم|شوبات|ئازار|نیسان|ئایار|حوزەیران|تەمموز|ئاب|ئەیلوول|تشرینی یەکەم|تشرینی دووەم|کانوونی یەکەم)/,
  day: /^(یەکشەممە|دووشەممە|سێشەممە|چوارشەممە|پێنجشەممە|هەینی|شەممە)/,
  dayPeriod: /^(بەیانی|دوای نیوەڕۆ|نیوەی شەو|نیوەڕۆ|بەیانی|دوای نیوەڕۆ|ئێوارە|شەو)/,
};

export const ckb: Locale = {
  code: 'ckb',
  localize: localize as any,
  match: match as any,
  formatLong: formatLong as any,
  options: {
    weekStartsOn: 6, // Saturday
    firstWeekContainsDate: 1,
  },
};

    