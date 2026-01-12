
import { buildLocalizeFn, buildMatchFn } from 'date-fns/locale/build';

const eraValues = {
  narrow: ['پ.ز', 'ز'],
  abbreviated: ['پ.ز', 'ز'],
  wide: ['پێш زایین', 'زایینی'],
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
  narrow: { am: 'پ.ن', pm: 'د.ن', midnight: 'نیوەشەو', noon: 'نیوەڕۆ', morning: 'بەیانی', afternoon: 'دوای نیوەڕۆ', evening: 'ئێوارە', night: 'شەو' },
  abbreviated: { am: 'پ.ن', pm: 'د.ن', midnight: 'نیوەشەو', noon: 'نیوەڕۆ', morning: 'بەیانی', afternoon: 'دوای نیوەڕۆ', evening: 'ئێوارە', night: 'شەو' },
  wide: { am: 'پێш نیوەڕۆ', pm: 'دوای نیوەڕۆ', midnight: 'نیوەشەو', noon: 'نیوەڕۆ', morning: 'بەیانی', afternoon: 'دوای نیوەڕۆ', evening: 'ئێوارە', night: 'شەو' },
};

const ordinalNumber: any = (dirtyNumber: any, _options: any) => {
  return String(dirtyNumber);
};

export const ckb = {
  code: 'ckb',
  formatDistance: (token: any, count: any, options: any) => {
    options = options || {};
    const result = (
      {
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
      }[token] as any
    )[count === 1 ? 'one' : 'other'].replace('{{count}}', count);

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
    date: 'yyyy/MM/dd',
    time: 'HH:mm:ss',
    dateTime: 'yyyy/MM/dd HH:mm:ss',
  },
  formatRelative: (token: any, _date: any, _baseDate: any, _options: any) =>
    ({
      lastWeek: "eeee 'لەمەوپێش کاتژمێر' p",
      yesterday: "'دوێنێ کاتژمێر' p",
      today: "'ئەمڕۆ کاتژمێر' p",
      tomorrow: "'سبەی کاتژمێر' p",
      nextWeek: "eeee 'کاتژمێر' p",
      other: 'P',
    }[token]),
  localize: {
    ordinalNumber,
    era: buildLocalizeFn({ values: eraValues, defaultWidth: 'wide' }),
    quarter: buildLocalizeFn({ values: quarterValues, defaultWidth: 'wide', argumentCallback: (quarter) => quarter - 1 }),
    month: buildLocalizeFn({ values: monthValues, defaultWidth: 'wide' }),
    day: buildLocalizeFn({ values: dayValues, defaultWidth: 'wide' }),
    dayPeriod: buildLocalizeFn({ values: dayPeriodValues, defaultWidth: 'wide', formattingValues: formattingDayPeriodValues, defaultFormattingWidth: 'wide' }),
  },
  match: {
    ordinalNumber: /^(\d+)(.)?/i,
    era: buildMatchFn({ values: eraValues, defaultWidth: 'wide' }),
    quarter: buildMatchFn({ values: quarterValues, defaultWidth: 'wide', parsePatterns: [/1/i, /2/i, /3/i, /4/i] }),
    month: buildMatchFn({ values: monthValues, defaultWidth: 'wide' }),
    day: buildMatchFn({ values: dayValues, defaultWidth: 'wide' }),
    dayPeriod: buildMatchFn({ values: dayPeriodValues, defaultWidth: 'wide' }),
  },
  options: { weekStartsOn: 6, firstWeekContainsDate: 1 },
};
