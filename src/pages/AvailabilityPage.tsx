import { useState, useEffect } from 'react';
import api from '../lib/api';

interface WeeklySchedule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

interface BlockedDate {
  id?: string;
  blockedDate: string;
  reason: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AvailabilityPage = () => {
  const [schedule, setSchedule] = useState<WeeklySchedule[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [doctorName, setDoctorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch current schedule on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch tenant data to get doctor name
        const tenantResponse = await api.get('/api/tenants/me');
        const tenant = tenantResponse.data;
        const doctorNameFromConfig = tenant.config?.doctorName || `Dr. ${tenant.name}`;
        setDoctorName(doctorNameFromConfig);
        
        // Fetch schedule with the doctor name
        const scheduleResponse = await api.get('/api/availability/schedule', {
          params: { doctorName: doctorNameFromConfig }
        });
        
        if (scheduleResponse.data.status === 'success') {
          const schedules = (scheduleResponse.data.schedules || []).map((s: any) => {
            // Handle time format - backend returns "09:00:00" or LocalTime object
            const formatTime = (time: any) => {
              if (typeof time === 'string') {
                return time.substring(0, 5); // "09:00:00" -> "09:00"
              }
              if (time && typeof time === 'object' && time.hour !== undefined) {
                // LocalTime object: {hour: 9, minute: 0, second: 0, nano: 0}
                const h = String(time.hour).padStart(2, '0');
                const m = String(time.minute).padStart(2, '0');
                return `${h}:${m}`;
              }
              return time;
            };

            return {
              id: s.id,
              dayOfWeek: s.dayOfWeek,
              startTime: formatTime(s.startTime),
              endTime: formatTime(s.endTime),
              slotDurationMinutes: s.slotDurationMinutes || 30,
              isActive: Boolean(s.isActive)
            };
          });
          
          console.log('Loaded schedules:', schedules);
          setSchedule(schedules);
        }
        
        // Fetch blocked dates
        const today = new Date().toISOString().split('T')[0];
        const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
        
        const blockedResponse = await api.get('/api/availability/blocked', {
          params: { startDate: today, endDate: nextYear }
        });
        
        if (blockedResponse.data.status === 'success') {
          setBlockedDates(blockedResponse.data.blockedDates || []);
        }
      } catch (err: any) {
        console.error('Error initializing data:', err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  const fetchSchedule = async () => {
    try {
      setError(null);
      
      const response = await api.get('/api/availability/schedule', {
        params: { doctorName }
      });
      
      if (response.data.status === 'success') {
        const schedules = (response.data.schedules || []).map((s: any) => {
          const formatTime = (time: any) => {
            if (typeof time === 'string') return time.substring(0, 5);
            if (time && typeof time === 'object' && time.hour !== undefined) {
              const h = String(time.hour).padStart(2, '0');
              const m = String(time.minute).padStart(2, '0');
              return `${h}:${m}`;
            }
            return time;
          };

          return {
            id: s.id,
            dayOfWeek: s.dayOfWeek,
            startTime: formatTime(s.startTime),
            endTime: formatTime(s.endTime),
            slotDurationMinutes: s.slotDurationMinutes || 30,
            isActive: Boolean(s.isActive)
          };
        });
        setSchedule(schedules);
      }
    } catch (err: any) {
      console.error('Error fetching schedule:', err);
      setError(err.response?.data?.message || 'Failed to load schedule');
    }
  };

  const fetchBlockedDates = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
      
      const response = await api.get('/api/availability/blocked', {
        params: { startDate: today, endDate: nextYear }
      });
      
      if (response.data.status === 'success') {
        setBlockedDates(response.data.blockedDates || []);
      }
    } catch (err: any) {
      console.error('Error fetching blocked dates:', err);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      const activeSchedules = schedule.filter(s => s.isActive);
      
      if (activeSchedules.length === 0) {
        setError('Please enable at least one day in your schedule');
        return;
      }

      const response = await api.post(`/api/availability/schedule`, {
        doctorName,
        schedule: activeSchedules.map(s => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          slotDurationMinutes: s.slotDurationMinutes
        }))
      });

      if (response.data.status === 'success') {
        setSuccessMessage('Schedule saved successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchSchedule(); // Refresh
      }
    } catch (err: any) {
      console.error('Error saving schedule:', err);
      setError(err.response?.data?.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleBlockDate = async (date: string, reason: string) => {
    try {
      setError(null);
      
      const response = await api.post(`/api/availability/block`, {
        doctorName,
        blockedDate: date,
        reason,
        isFullDay: true
      });

      if (response.data.status === 'success') {
        setSuccessMessage('Date blocked successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchBlockedDates(); // Refresh
      }
    } catch (err: any) {
      console.error('Error blocking date:', err);
      setError(err.response?.data?.message || 'Failed to block date');
    }
  };

  const handleUnblockDate = async (blockedDateId: string) => {
    try {
      setError(null);
      
      await api.delete(`/api/availability/block/${blockedDateId}`);
      
      setSuccessMessage('Date unblocked successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchBlockedDates(); // Refresh
    } catch (err: any) {
      console.error('Error unblocking date:', err);
      setError(err.response?.data?.message || 'Failed to unblock date');
    }
  };

  const updateScheduleDay = (dayOfWeek: number, field: keyof WeeklySchedule, value: any) => {
    setSchedule(prev => {
      const existing = prev.find(s => s.dayOfWeek === dayOfWeek);
      
      if (existing) {
        return prev.map(s => 
          s.dayOfWeek === dayOfWeek 
            ? { ...s, [field]: value }
            : s
        );
      } else {
        return [...prev, {
          dayOfWeek,
          startTime: '09:00',
          endTime: '17:00',
          slotDurationMinutes: 30,
          isActive: field === 'isActive' ? value : false,
          [field]: value
        }];
      }
    });
  };

  const getScheduleForDay = (dayOfWeek: number): WeeklySchedule => {
    return schedule.find(s => s.dayOfWeek === dayOfWeek) || {
      dayOfWeek,
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMinutes: 30,
      isActive: false
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Availability Settings</h1>
        <p className="text-gray-600">Set your weekly schedule and manage blocked dates</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <svg className="w-5 h-5 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Weekly Schedule Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
          <p className="text-sm text-gray-600 mt-1">Set your working hours for each day of the week</p>
        </div>
        
        <div className="p-6">
          <WeeklyScheduleEditor 
            schedule={schedule}
            getScheduleForDay={getScheduleForDay}
            updateScheduleDay={updateScheduleDay}
          />
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveSchedule}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </div>
      </div>

      {/* Blocked Dates Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Blocked Dates</h2>
          <p className="text-sm text-gray-600 mt-1">Block specific dates when you're unavailable</p>
        </div>
        
        <div className="p-6">
          <BlockedDatesManager 
            blockedDates={blockedDates}
            onBlockDate={handleBlockDate}
            onUnblockDate={handleUnblockDate}
          />
        </div>
      </div>
    </div>
  );
};

// Weekly Schedule Editor Component
interface WeeklyScheduleEditorProps {
  schedule: WeeklySchedule[];
  getScheduleForDay: (dayOfWeek: number) => WeeklySchedule;
  updateScheduleDay: (dayOfWeek: number, field: keyof WeeklySchedule, value: any) => void;
}

const WeeklyScheduleEditor = ({ schedule, getScheduleForDay, updateScheduleDay }: WeeklyScheduleEditorProps) => {
  return (
    <div className="space-y-3">
      {DAYS_OF_WEEK.map((dayName, index) => {
        const daySchedule = getScheduleForDay(index);
        
        return (
          <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center min-w-[140px]">
              <input
                type="checkbox"
                checked={daySchedule.isActive}
                onChange={(e) => updateScheduleDay(index, 'isActive', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="ml-3 text-sm font-medium text-gray-900">{dayName}</label>
            </div>
            
            <div className="flex items-center space-x-2 flex-1">
              <input
                type="time"
                value={daySchedule.startTime}
                onChange={(e) => updateScheduleDay(index, 'startTime', e.target.value)}
                disabled={!daySchedule.isActive}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              />
              <span className="text-gray-500">to</span>
              <input
                type="time"
                value={daySchedule.endTime}
                onChange={(e) => updateScheduleDay(index, 'endTime', e.target.value)}
                disabled={!daySchedule.isActive}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Slot:</label>
              <select
                value={daySchedule.slotDurationMinutes}
                onChange={(e) => updateScheduleDay(index, 'slotDurationMinutes', parseInt(e.target.value))}
                disabled={!daySchedule.isActive}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Blocked Dates Manager Component
interface BlockedDatesManagerProps {
  blockedDates: BlockedDate[];
  onBlockDate: (date: string, reason: string) => void;
  onUnblockDate: (id: string) => void;
}

const BlockedDatesManager = ({ blockedDates, onBlockDate, onUnblockDate }: BlockedDatesManagerProps) => {
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDate && newReason) {
      onBlockDate(newDate, newReason);
      setNewDate('');
      setNewReason('');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <input
              type="text"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="e.g., Christmas Holiday"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Block Date
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-2">
        {blockedDates.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No blocked dates yet</p>
        ) : (
          blockedDates.map((blocked) => (
            <div key={blocked.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">
                  {new Date(blocked.blockedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-sm text-gray-600">{blocked.reason}</p>
              </div>
              <button
                onClick={() => blocked.id && onUnblockDate(blocked.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AvailabilityPage;
