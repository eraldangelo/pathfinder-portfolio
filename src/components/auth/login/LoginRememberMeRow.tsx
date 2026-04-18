import React from 'react';

interface LoginRememberMeRowProps {
  rememberMe: boolean;
  onRememberMeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  rememberMeLabel: string;
}

const LoginRememberMeRow: React.FC<LoginRememberMeRowProps> = ({
  rememberMe,
  onRememberMeChange,
  rememberMeLabel,
}) => (
  <div className="w-full max-w-xs flex justify-start items-center mt-3">
    <label className="flex items-center space-x-2 cursor-pointer text-sm text-[#004097]/90 dark:text-white/80 text-floating">
      <div className="relative flex items-center justify-center w-4 h-4">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={onRememberMeChange}
          className="appearance-none h-4 w-4 border border-gray-400 dark:border-gray-500 rounded-sm bg-white dark:bg-gray-700 checked:bg-blue-500 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 dark:focus:ring-offset-gray-800 cursor-pointer"
        />
        <svg
          className={`absolute w-3 h-3 text-white transition-opacity pointer-events-none ${rememberMe ? 'opacity-100' : 'opacity-0'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span>{rememberMeLabel}</span>
    </label>
  </div>
);

export default LoginRememberMeRow;
