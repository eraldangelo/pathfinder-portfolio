import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import type { User } from '../../../types';
import type { Reminder } from '../types/types';
import { PlusIcon } from '../components/icons';
import { Widget } from '../components/common';
import { modalOverlay } from '../../common/styles/ui';

export const AddReminderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddReminder: (text: string, due: string) => void;
}> = ({ isOpen, onClose, onAddReminder }) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [due, setDue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setText('');
      setDue('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (text && due) {
      onAddReminder(text, due);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`${modalOverlay} flex items-center justify-center z-50 animate-fade-in-fast`} onClick={onClose}>
      <div
        className="bg-white/80 dark:bg-black/80 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 dark:border-white/10"
        onClick={event => event.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-[#004097] dark:text-blue-300 mb-4">{t('addNewReminder')}</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder={t('reminderDetailsPlaceholder')}
            value={text}
            onChange={event => setText(event.target.value)}
            className="w-full px-3 py-2 bg-white/60 dark:bg-black/50 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder={t('dueDatePlaceholder')}
            value={due}
            onChange={event => setDue(event.target.value)}
            className="w-full px-3 py-2 bg-white/60 dark:bg-black/50 border border-gray-400/50 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text || !due}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          >
            {t('addReminder')}
          </button>
        </div>
      </div>
      <style>{`.animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; } @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export const Reminders: React.FC<{
  user: User;
  reminders: Reminder[];
  onOpenAddModal: () => void;
}> = ({ user, reminders, onOpenAddModal }) => {
  const { t } = useTranslation();
  const userReminders = useMemo(() => {
    if (!user || !user.displayName) return [];
    return reminders.filter(item => item.assigned === user.displayName);
  }, [user, reminders]);

  const headerContent = (
    <button
      onClick={onOpenAddModal}
      className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"
      aria-label={t('addReminder')}
    >
      <PlusIcon className="w-5 h-5" />
    </button>
  );

  return (
    <Widget title={t('reminders')} isCollapsible={true} headerContent={headerContent}>
      {userReminders.length > 0 ? (
        <ul className="space-y-4">
          {userReminders.map((item, index) => (
            <li key={`${item.text}-${index}`} className="flex items-start gap-3">
              <div className={`mt-1 flex-shrink-0 w-6 h-6 ${item.color}`}>{item.icon}</div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">{item.text}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.due}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">{t('youHaveNoReminders')}</div>
      )}
    </Widget>
  );
};
