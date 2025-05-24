import { useState } from 'react';

export interface ReasonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  placeholder?: string;
  isRequired?: boolean;
  cancelText?: string;
  confirmText?: string;
}

const ReasonDialog: React.FC<ReasonDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  placeholder = '請輸入原因...',
  isRequired = false,
  cancelText = '取消',
  confirmText = '確認'
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isRequired && !reason.trim()) return;
    onConfirm(reason);
    setReason('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h3 className="text-lg font-medium mb-4">{title}</h3>
        <textarea
          className="w-full h-32 p-2 border rounded-md mb-4"
          placeholder={placeholder}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isRequired && !reason.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReasonDialog;