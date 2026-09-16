import { useState, useEffect } from 'react';
import { getActivityLogs, getActivitySummary } from '../services/api';

const ACTION_COLORS = {
  LOGIN: 'bg-blue-100 text-blue-700',
  REGISTER: 'bg-purple-100 text-purple-700',
  CREATE: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  STOCK_IN: 'bg-teal-100 text-teal-700',
  STOCK_OUT: 'bg-orange-100 text-orange-700',
  ADJUSTMENT: 'bg-indigo-100 text-indigo-700',
};

const ACTION_ICONS = {
  LOGIN: '🔐',
  REGISTER: '👤',
  CREATE: '➕',
  UPDATE: '✏️',
  DELETE: '🗑️',
  STOCK_IN: '📦',
  STOCK_OUT: '📤',
  ADJUSTMENT: '⚖️',
};

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  const fetchLogs = async () => {
    try {
      const params = {};
      if (filterAction) params.action = filterAction;
      if (filterEntity) params.entity_type = filterEntity;
      const [logsRes, summaryRes] = await Promise.all([
        getActivityLogs(params),
        getActivitySummary(),
      ]);
      setLogs(logsRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchLogs(); }, [filterAction, filterEntity]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Activity Log</h2>
        <p className="text-sm text-gray-500">Complete audit trail of all system actions</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-indigo-600">{summary.total_activities}</p>
            <p className="text-sm text-gray-500 mt-1">Total Activities</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-blue-600">{summary.last_24_hours}</p>
            <p className="text-sm text-gray-500 mt-1">Last 24 Hours</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-emerald-600">{summary.last_7_days}</p>
            <p className="text-sm text-gray-500 mt-1">Last 7 Days</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-purple-600">
              {Object.keys(summary.by_action).length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Action Types</p>
          </div>
        </div>
      )}

      {/* Action Breakdown */}
      {summary && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Activity Breakdown</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.by_action).map(([action, count]) => (
              <div key={action} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${ACTION_COLORS[action] || 'bg-gray-100 text-gray-700'}`}>
                <span>{ACTION_ICONS[action] || '•'}</span>
                <span>{action.replace('_', ' ')}: {count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Actions</option>
          <option value="LOGIN">Login</option>
          <option value="REGISTER">Register</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="STOCK_IN">Stock In</option>
          <option value="STOCK_OUT">Stock Out</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Entities</option>
          <option value="USER">User</option>
          <option value="PRODUCT">Product</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Time</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">User</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Action</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Entity</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-400">
                    No activity logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold">
                          {log.user_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-xs">{log.user_name}</p>
                          <p className="text-xs text-gray-400">{log.user_role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                        {ACTION_ICONS[log.action]} {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{log.entity_type}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{log.details || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}