import { OpportunityStatus } from '@/models/enums';
import { statusLabelMap, statusColorMap } from './constants';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface StatusHistoryItem {
  status: OpportunityStatus;
  reason?: string;
  changedBy?: string;
  changedAt: string;
  _id?: string;
}

interface OpportunityStatusHistoryProps {
  statusHistory: StatusHistoryItem[];
  className?: string;
}

const OpportunityStatusHistory: React.FC<OpportunityStatusHistoryProps> = ({
  statusHistory,
  className = ''
}) => {
  return (
    <div className={`bg-white shadow-sm rounded-lg p-6 ${className}`}>
      <h3 className="text-xl font-bold mb-4 pb-2 border-b">狀態變更歷史</h3>
      <div className="flow-root">
        <ul role="list" className="-mb-8">
          {statusHistory.map((historyItem, idx) => (
            <li key={historyItem._id}>
              <div className="relative pb-8">
                {idx !== statusHistory.length - 1 ? (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                        statusColorMap[historyItem.status as OpportunityStatus].replace('text-', 'text-white ')
                      }`}
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        狀態變更為{' '}
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusColorMap[historyItem.status as OpportunityStatus]
                        }`}>
                          {statusLabelMap[historyItem.status as OpportunityStatus]}
                        </span>
                      </p>
                      {historyItem.reason && (
                        <p className="mt-1 text-sm text-gray-500">
                          原因：{historyItem.reason}
                        </p>
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      <time dateTime={historyItem.changedAt}>
                        {format(new Date(historyItem.changedAt), 'PPpp', { locale: zhTW })}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default OpportunityStatusHistory;
