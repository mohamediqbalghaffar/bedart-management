
import { buildFormatLongFn } from 'date-fns/locale/build_format_long_fn'

const eraValues = {
  narrow: ['پ.ز', 'ز'],
  abbreviated: ['پ.ز', 'ز'],
  wide: ['پێش زایین', 'زایینی'],
};

const quarterValues = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['چ1', 'چ2', 'چ3', 'چ4'],
  wide: ['چارەکی یەکەم', 'چارەکی دووەم', 'چارەکی سێیەم', 'چارەکی چوارەم'],
};

const monthValues = {
  narrow: ['ک', 'ش', 'ئ', 'ن', 'م', 'ح', 'ت', 'ئ', 'ئ', 'ت', 'ت', 'ک'],
  abbreviated: ['کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'مایس', 'حوزەیران', 'تەمووز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'],
  wide: ['کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'مایس', 'حوزەیران', 'تەمووز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'],
};

const dayValues = {
  narrow: ['ی', 'د', 'س', 'چ', 'پ', 'ه', 'ش'],
  short: ['یەک', 'دوو', 'سێ', 'چوار', 'پێنج', 'هەینی', 'شەممە'],
  abbreviated: ['یەکشەم', 'دووشەم', 'سێشەم', 'چوارشەم', 'پێنجشەم', 'هەینی', 'شەممە'],
  wide: ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'],
};

const dayPeriodValues = {
  narrow: { am: 'پ.ن', pm: 'د.ن', midnight: 'نیوەشەو', noon: 'نیوەڕۆ', morning: 'بەیانی', afternoon: 'دوای نیوەڕۆ', evening: 'ئێوارە', night: 'شەو' },
  abbreviated: { am: 'پ.ن', pm: 'د.ن', midnight: 'نیوەشەو', noon: 'نیوەڕۆ', morning: 'بەیانی', afternoon: 'دوای نیوەڕۆ', evening: 'ئێوارە', night: 'شەو' },
  wide: { am: 'پێш نیوەڕۆ', pm: 'دوای نیوەڕۆ', midnight: 'نیوەشەو', noon: 'نیوەڕۆ', morning: 'بەیانی', afternoon: 'دوای نیوەڕۆ', evening: 'ئێوارە', night: 'شەو' },
};

const formattingDayPeriodValues = {
  narrow: { am: 'پ.ن', pm: 'د.n', midnight: 'نیوەشەو', noon: 'نیوەڕۆ', morning: 'بەیانی', afternoon: 'دوای نیوەڕۆ', evening: 'ئێوارە', night: 'شەو' },
  abbreviated: { am: 'پ.ن', pm: 'د.ن', midnight: 'نیوەشەو', noon: 'نیوەڕۆ', morning: 'بەیانی', afternoon: 'دوای نیوەڕۆ', evening: 'ئێوارە', night: 'شەو' },
  wide: { am: 'پێш نیوەڕۆ', pm: 'دوای نیوەڕۆ', midnight: 'نیوەشەو', noon: 'نیوەڕۆ', morning: 'بەیانی', afternoon: 'دوای نیوەڕۆ', evening: 'ئێوارە', night: 'شەو' },
};

const ordinalNumber: any = (dirtyNumber: any) => {
  return String(dirtyNumber);
};

const localize = {
    ordinalNumber,
    era: (value: 0 | 1) => eraValues['wide'][value],
    quarter: (value: 1 | 2 | 3 | 4) => quarterValues['wide'][value - 1],
    month: (value: number) => monthValues['wide'][value],
    day: (value: number) => dayValues['wide'][value],
    dayPeriod: (value: 'am' | 'pm' | 'midnight' | 'noon' | 'morning' | 'afternoon' | 'evening' | 'night', options: { width?: 'narrow' | 'abbreviated' | 'wide' } = {}) => {
      const dayPeriod = dayPeriodValues[options.width || 'wide'];
      return dayPeriod[value]
    }
} as const;

const match = {
    ordinalNumber: /^(\d+)(.)?/i,
    era: (str: string) => Object.values(eraValues.wide).find(e => e === str) || Object.values(eraValues.abbreviated).find(e => e === str) || Object.values(eraValues.narrow).find(e => e === str),
    quarter: (str: string) => (Object.values(quarterValues.wide).find(q => q === str) || Object.values(quarterValues.abbreviated).find(q => q === str) || Object.values(quarterValues.narrow).find(q => q === str)),
    month: (str: string) => (Object.values(monthValues.wide).find(m => m === str) || Object.values(monthValues.abbreviated).find(m => m === str) || Object.values(monthValues.narrow).find(m => m === str)),
    day: (str: string) => (Object.values(dayValues.wide).find(d => d === str) || Object.values(dayValues.abbreviated).find(d => d === str) || Object.values(dayValues.short).find(d => d === str) || Object.values(dayValues.narrow).find(d => d === str)),
    dayPeriod: (str: string) => (Object.values(dayPeriodValues.wide).find(p => p === str) || Object.values(dayPeriodValues.abbreviated).find(p => p === str) || Object.values(dayPeriodValues.narrow).find(p => p === str))
} as const;

const formatLong = buildFormatLongFn({
  formats: {
    full: 'EEEE, d MMMM yyyy',
    long: 'd MMMM yyyy',
    medium: 'd MMM yyyy',
    short: 'dd/MM/yyyy',
  },
  defaultWidth: 'full',
});

const ckbLocale = {
  code: 'ckb',
  formatDistance: (token: any, count: any, options: any) => {
    options = options || {};
    let result;
    const a = {
        lessThanXSeconds: { one: 'کەمتر لە چرکەیەک', other: 'کەمتر لە {{count}} چرکە' },
        xSeconds: { one: '1 چرکە', other: '{{count}} چرکە' },
        halfAMinute: 'نیو خولەک',
        lessThanXMinutes: { one: 'کەمتر لە خولەکێک', other: 'کەمتر لە {{count}} خولەک' },
        xMinutes: { one: '1 خولەک', other: '{{count}} خولەک' },
        aboutXHours: { one: 'نزیکەی 1 کاتژمێر', other: 'نزیکەی {{count}} کاتژمێر' },
        xHours: { one: '1 کاتژمێر', other: '{{count}} کاتژمێر' },
        xDays: { one: '1 ڕۆژ', other: '{{count}} ڕۆژ' },
        aboutXWeeks: { one: 'نزیکەی 1 هەفتە', other: 'نزیکەی {{count}} هەفتە' },
        xWeeks: { one: '1 هەفتە', other: '{{count}} هەفتە' },
        aboutXMonths: { one: 'نزیکەی 1 مانگ', other: 'نزیکەی {{count}} مانگ' },
        xMonths: { one: '1 مانگ', other: '{{count}} مانگ' },
        aboutXYears: { one: 'نزیکەی 1 ساڵ', other: 'نزیکەی {{count}} ساڵ' },
        xYears: { one: '1 ساڵ', other: '{{count}} ساڵ' },
        overXYears: { one: 'زیاتر لە 1 ساڵ', other: 'زیاتر لە {{count}} ساڵ' },
        almostXYears: { one: 'نزیکەی 1 ساڵ', other: 'نزیکەی {{count}} ساڵ' },
    };
    result = (a[token as keyof typeof a] as any)[count === 1 ? 'one' : 'other'].replace('{{count}}', count);

    if (options.addSuffix) {
      if (options.comparison > 0) {
        return 'لە ماوەی ' + result + 'دا';
      } else {
        return result + ' لەمەوپێش';
      }
    }
    return result;
  },
  formatLong: {
    date: formatLong,
    time: buildFormatLongFn({
        formats: {
            full: 'h:mm:ss a zzzz',
            long: 'h:mm:ss a z',
            medium: 'h:mm:ss a',
            short: 'h:mm a',
        },
        defaultWidth: 'full',
    }),
    dateTime: (options: { width: 'full' | 'long' | 'medium' | 'short' }) => {
        const date = formatLong(options);
        const time = buildFormatLongFn({
            formats: {
                full: 'h:mm:ss a zzzz',
                long: 'h:mm:ss a z',
                medium: 'h:mm:ss a',
                short: 'h:mm a',
            },
            defaultWidth: 'full',
        })(options);
        return `${date} ${time}`;
    },
  },
  formatRelative: (token: 'lastWeek' | 'yesterday' | 'today' | 'tomorrow' | 'nextWeek' | 'other', _date: Date, _baseDate: Date, _options: object) =>
    ({
      lastWeek: "eeee 'لەمەوپێش کاتژمێر' p",
      yesterday: "'دوێنێ کاتژمێر' p",
      today: "'ئەمڕۆ کاتژمێر' p",
      tomorrow: "'سبەی کاتژمێر' p",
      nextWeek: "eeee 'کاتژمێر' p",
      other: 'P',
    }[token]),
  localize: localize,
  match: match,
  options: { weekStartsOn: 6, firstWeekContainsDate: 1 },
};

export { ckbLocale as ckb };

    