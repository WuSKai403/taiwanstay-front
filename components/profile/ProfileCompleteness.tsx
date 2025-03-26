import { User } from '@/lib/types';

interface ProfileCompletenessProps {
  user: User;
}

export const REQUIRED_FIELDS = [
  { key: 'name', label: '姓名' },
  { key: 'phone', label: '電話' },
  { key: 'emergencyContact', label: '緊急聯絡人' },
  { key: 'aboutMe', label: '自我介紹' }
] as const;

export const ProfileCompleteness: React.FC<ProfileCompletenessProps> = ({ user }) => {
  const completedFields = REQUIRED_FIELDS.filter(field => user[field.key]);
  const percentage = Math.round((completedFields.length / REQUIRED_FIELDS.length) * 100);
  const incompleteFields = REQUIRED_FIELDS.filter(field => !user[field.key]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">個人資料完整度</h3>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-gray-600">{percentage}% 完成</p>
      </div>

      {incompleteFields.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">尚未完成的項目：</p>
          <ul className="list-disc list-inside text-sm text-gray-500">
            {incompleteFields.map(field => (
              <li key={field.key}>{field.label}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfileCompleteness;