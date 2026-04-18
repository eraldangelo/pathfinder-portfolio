import React, { useMemo } from 'react';
import type { Lead } from '../leads-page/LeadsPage';

export interface InfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isEditing: boolean;
  name: keyof Lead;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'date' | 'month';
  className?: string;
}

export const InfoField: React.FC<InfoFieldProps> = ({
  icon,
  label,
  value,
  isEditing,
  name,
  onChange,
  type = 'text',
  className = '',
}) => {
  const displayValue = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const toMonthLabel = (year: string, month: string) => {
      const monthIndex = Number(month) - 1;
      if (!Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex >= monthNames.length) {
        return null;
      }
      return `${monthNames[monthIndex]} ${year}`;
    };

    if (type === 'date' && value) {
      const formatDate = (year: string, month: string, day: string) => {
        const monthIndex = Number(month) - 1;
        if (!Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex >= monthNames.length) {
          return null;
        }
        const dayValue = Number(day);
        if (!Number.isFinite(dayValue) || dayValue < 1 || dayValue > 31) {
          return null;
        }
        return `${String(dayValue).padStart(2, '0')}-${monthNames[monthIndex]}-${year}`;
      };

      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = value.split('-');
        const formatted = formatDate(year, month, day);
        if (formatted) return formatted;
      }

      if (value.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        const [year, month, day] = value.split('/');
        const formatted = formatDate(year, month, day);
        if (formatted) return formatted;
      }

      if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = value.split('/');
        const formatted = formatDate(year, month, day);
        if (formatted) return formatted;
      }
    }
    if (type === 'month' && value) {
      if (value.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = value.split('-');
        const formatted = toMonthLabel(year, month);
        if (formatted) return formatted;
      }

      if (value.match(/^\d{4}[-/]\d{2}[-/]\d{2}$/)) {
        const [year, month] = value.split(/[-/]/);
        const formatted = toMonthLabel(year, month);
        if (formatted) return formatted;
      }

      if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [, month, year] = value.split('/');
        const formatted = toMonthLabel(year, month);
        if (formatted) return formatted;
      }

      const parsedMillis = Date.parse(value);
      if (Number.isFinite(parsedMillis)) {
        const parsed = new Date(parsedMillis);
        const formatted = toMonthLabel(String(parsed.getFullYear()), String(parsed.getMonth() + 1).padStart(2, '0'));
        if (formatted) return formatted;
      }
    }
    return value || '';
  }, [type, value]);

  return (
    <div className={`flex items-start gap-4 ${className}`}>
      <div className="flex-shrink-0 text-blue-500 mt-1">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        {isEditing ? (
          <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            className="w-full text-sm font-semibold bg-black/5 dark:bg-white/5 p-2 rounded-md mt-1 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        ) : (
          <p className="text-sm font-semibold text-gray-800 dark:text-white mt-1">{displayValue}</p>
        )}
      </div>
    </div>
  );
};
