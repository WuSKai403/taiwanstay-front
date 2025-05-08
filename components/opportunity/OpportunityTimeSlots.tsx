import TimeSlotDisplay from '@/components/opportunities/TimeSlotDisplay';
import { OpportunityDetail } from './constants';
import Link from 'next/link';

interface OpportunityTimeSlotsProps {
  opportunity: OpportunityDetail;
  displayMode?: 'full' | 'summary';
}

const OpportunityTimeSlots: React.FC<OpportunityTimeSlotsProps> = ({
  opportunity,
  displayMode = 'full'
}) => {
  if (!opportunity.hasTimeSlots || !opportunity.timeSlots || opportunity.timeSlots.length === 0) {
    return null;
  }

  // 摘要模式 - 用於側邊欄
  if (displayMode === 'summary') {
    return (
      <div className="border-t border-gray-200 pt-4 mb-4">
        <h3 className="font-semibold text-lg mb-2">可用時段</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {opportunity.timeSlots
            .filter(slot => slot.status === 'OPEN')
            .map(slot => (
              <div key={slot.id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <p className="text-sm font-medium">
                  {slot.startDate} 至 {slot.endDate}
                </p>
                <div className="flex justify-between items-center mt-1 text-xs text-gray-600">
                  <span>最短 {slot.minimumStay} 天</span>
                  <span>剩餘 {slot.defaultCapacity - slot.confirmedCount} 名額</span>
                </div>
              </div>
            ))}
        </div>
        <div className="mt-2 text-center">
          <Link href="#available-timeslots" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            查看所有時段
          </Link>
        </div>
      </div>
    );
  }

  // 完整模式 - 用於主要內容區
  return (
    <div className="mb-8" id="available-timeslots">
      <h3 className="text-xl font-bold mb-4">可申請時段</h3>
      <TimeSlotDisplay
        startDate={opportunity.timeSlots[0].startDate}
        endDate={opportunity.timeSlots[opportunity.timeSlots.length - 1].endDate}
        defaultCapacity={opportunity.timeSlots[0].defaultCapacity}
        minimumStay={opportunity.timeSlots[0].minimumStay}
        appliedCount={opportunity.timeSlots.reduce((total, slot) => total + slot.appliedCount, 0)}
      />

      <div className="mt-4 space-y-3">
        <h4 className="font-medium">可用時段詳情</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {opportunity.timeSlots.map(slot => (
            <div
              key={slot.id}
              className={`p-3 rounded-md border ${
                slot.status === 'OPEN'
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {slot.startDate} 至 {slot.endDate}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    最短停留 {slot.minimumStay} 天
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    <span className={slot.status === 'OPEN' ? 'text-green-600' : 'text-gray-500'}>
                      {slot.status === 'OPEN' ? '開放申請' : '已關閉'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    已申請 {slot.appliedCount}/{slot.defaultCapacity}
                  </p>
                </div>
              </div>
              {slot.description && (
                <p className="mt-2 text-sm text-gray-700">{slot.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OpportunityTimeSlots;