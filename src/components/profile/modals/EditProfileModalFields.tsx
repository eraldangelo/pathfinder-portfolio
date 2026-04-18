import React from 'react';
import { inputField } from '../../common/styles/ui';

type InputFieldProps = {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
};

export const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, type = 'text' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <input type={type} id={name} name={name} value={value} onChange={onChange} className={inputField} />
    </div>
);

type SelectFieldProps = {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    children: React.ReactNode;
    disabled?: boolean;
};

export const SelectField: React.FC<SelectFieldProps> = ({ name, value, onChange, children, disabled = false }) => (
    <select name={name} value={value} onChange={onChange} disabled={disabled} className={inputField}>
        {children}
    </select>
);
