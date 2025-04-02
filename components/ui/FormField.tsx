import React from 'react';
import { FieldError, FieldErrors } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: FieldError | FieldErrors<any> | undefined;
  helperText?: string;
  className?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helperText,
  className = '',
  children
}) => {
  // 從錯誤對象中提取錯誤消息
  const getErrorMessage = (error: FieldError | FieldErrors<any> | undefined): string => {
    if (!error) return '';
    if (typeof error === 'string') return error;
    if ('message' in error && typeof error.message === 'string') return error.message;
    if (typeof error === 'object') {
      const messages = Object.values(error)
        .map(err => {
          if (err && typeof err === 'object' && 'message' in err) {
            return err.message;
          }
          return '';
        })
        .filter(Boolean);
      return messages.join(', ');
    }
    return '';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{getErrorMessage(error)}</p>
      )}
    </div>
  );
};

export default FormField;