
import { ckb } from 'date-fns/locale';

const formatLong = ckb.formatLong ? {
    date: (options: { width: 'full' | 'long' | 'medium' | 'short' }) => {
        if (options.width === 'full') {
            return "EEEE, d MMMM yyyy";
        } else if (options.width === 'long') {
            return "d MMMM yyyy";
        } else if (options.width === 'medium') {
            return "d MMM yyyy";
        }
        return "dd/MM/yyyy";
    },
    time: (options: { width: 'full' | 'long' | 'medium' | 'short' }) => {
        if (options.width === 'full') {
            return "h:mm:ss a zzzz";
        } else if (options.width === 'long') {
            return "h:mm:ss a z";
        } else if (options.width === 'medium') {
            return "h:mm:ss a";
        }
        return "h:mm a";
    },
    dateTime: (options: { width: 'full' | 'long' | 'medium' | 'short' }) => {
        const date = formatLong.date(options);
        const time = formatLong.time(options);
        return `${date}, ${time}`;
    }
} : undefined;


const ckbLocale = {
  ...ckb,
  formatLong: formatLong,
};

export { ckbLocale as ckb };
