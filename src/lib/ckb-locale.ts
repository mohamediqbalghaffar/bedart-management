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

const formatLongDate = {
  full: 'EEEE, d MMMM, yyyy',
  long: 'd MMMM, yyyy',
  medium: 'd MMM, yyyy',
  short: 'dd/MM/yyyy',
};

const formatLongTime = {
  full: 'h:mm:ss a zzzz',
  long: 'h:mm:ss a z',
  medium: 'h:mm:ss a',
  short: 'h:mm a',
};

const formatLongDateTime = {
  full: "{{date}} 'لە' {{time}}",
  long: "{{date}} 'لە' {{time}}",
  medium: '{{date}}, {{time}}',
  short: '{{date}}, {{time}}',
};

const formatLong: any = {
  date: (options: { width: keyof typeof formatLongDate }) => formatLongDate[options.width],
  time: (options: { width: keyof typeof formatLongTime }) => formatLongTime[options.width],
  dateTime: (options: { width: keyof typeof formatLongDateTime }) => formatLongDateTime[options.width],
};

const formatRelativeLocale = {
  lastWeek: "'ڕۆژی' eeee 'ی ڕابردوو کاتژمێر' p",
  yesterday: "'دوێنێ کاتژمێر' p",
  today: "'ئەمڕۆ کاتژمێر' p",
  tomorrow: "'سبەی کاتژمێر' p",
  nextWeek: "'ڕۆژی' eeee 'ی داهاتوو کاتژمێر' p",
  other: 'P',
};

const formatRelative = (
  token: keyof typeof formatRelativeLocale,
  _date: Date,
  _baseDate: Date,
  _options: any
): string => formatRelativeLocale[token];


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
  formatLong: formatLong,
  formatRelative: formatRelative as any,
  options: {
    weekStartsOn: 6, // Saturday
    firstWeekContainsDate: 1,
  },
};
