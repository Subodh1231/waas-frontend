import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Clock, Calendar } from 'lucide-react';
import type {
  CreateAvailabilityRequest,
} from '../lib/api';
import {
  getProviderAvailability,
  replaceProviderAvailability,
  getApiErrorMessage,
} from '../lib/api';

interface ProviderAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  slotDuration: number;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const SLOT_DURATIONS = [15, 20, 30, 45, 60];

export default function ProviderAvailabilityModal({
  isOpen,
  onClose,
  providerId,
  providerName,
}: ProviderAvailabilityModalProps) {
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Track changes per day
  const [daySchedules, setDaySchedules] = useState<Record<number, TimeSlot[]>>({});

  const loadAvailability = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      setHasLoaded(false);
      setError('');
      const data = await getProviderAvailability(providerId);
      
      // Group by day of week
      const grouped: Record<number, TimeSlot[]> = {};
      data.forEach((slot) => {
        if (!grouped[slot.dayOfWeek]) {
          grouped[slot.dayOfWeek] = [];
        }
        grouped[slot.dayOfWeek].push({
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotDuration: slot.slotDuration || slot.slotDurationMinutes || 30,
        });
      });
      setDaySchedules(grouped);
      setHasLoaded(true);
    } catch (err: unknown) {
      setLoadError(getApiErrorMessage(err, 'Failed to load availability'));
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    if (isOpen) {
      void loadAvailability();
    }
  }, [isOpen, loadAvailability]);

  const addTimeSlot = (dayOfWeek: number) => {
    setDaySchedules((prev) => ({
      ...prev,
      [dayOfWeek]: [
        ...(prev[dayOfWeek] || []),
        { startTime: '09:00', endTime: '17:00', slotDuration: 30 },
      ],
    }));
  };

  const removeTimeSlot = (dayOfWeek: number, index: number) => {
    setDaySchedules((prev) => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].filter((_, i) => i !== index),
    }));
  };

  const updateTimeSlot = (
    dayOfWeek: number,
    index: number,
    field: keyof TimeSlot,
    value: string | number
  ) => {
    setDaySchedules((prev) => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const handleSave = async () => {
    if (!hasLoaded) return;
    try {
      setSaving(true);
      setError('');

      const newSlots: CreateAvailabilityRequest[] = [];
      Object.entries(daySchedules).forEach(([day, slots]) => {
        slots.forEach((slot) => {
          newSlots.push({
            providerId,
            dayOfWeek: parseInt(day),
            startTime: slot.startTime,
            endTime: slot.endTime,
            slotDurationMinutes: slot.slotDuration,
          });
        });
      });

      await replaceProviderAvailability(providerId, newSlots);

      onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to save availability'));
    } finally {
      setSaving(false);
    }
  };

  const copyToAllDays = (dayOfWeek: number) => {
    const slots = daySchedules[dayOfWeek];
    if (!slots || slots.length === 0) return;

    const newSchedules: Record<number, TimeSlot[]> = {};
    DAYS_OF_WEEK.forEach((day) => {
      newSchedules[day.value] = slots.map((slot) => ({ ...slot }));
    });
    setDaySchedules(newSchedules);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Set Availability
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure weekly schedule for {providerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading availability...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {loadError && (
                <div role="alert" className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  <p>{loadError}</p>
                  <button type="button" onClick={() => void loadAvailability()} className="mt-2 font-semibold underline">
                    Try loading again
                  </button>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <h3 className="font-medium text-gray-900">{day.label}</h3>
                    </div>
                    <div className="flex gap-2">
                      {daySchedules[day.value]?.length > 0 && (
                        <button
                          onClick={() => copyToAllDays(day.value)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Copy to all days
                        </button>
                      )}
                      <button
                        onClick={() => addTimeSlot(day.value)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        Add Time Slot
                      </button>
                    </div>
                  </div>

                  {daySchedules[day.value]?.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No availability set. Click "Add Time Slot" to begin.
                    </p>
                  )}

                  <div className="space-y-2">
                    {daySchedules[day.value]?.map((slot, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 bg-gray-50 p-3 rounded"
                      >
                        <Clock className="h-4 w-4 text-gray-400" />
                        
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) =>
                              updateTimeSlot(day.value, index, 'startTime', e.target.value)
                            }
                            className="border rounded px-2 py-1 text-sm"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) =>
                              updateTimeSlot(day.value, index, 'endTime', e.target.value)
                            }
                            className="border rounded px-2 py-1 text-sm"
                          />
                        </div>

                        <select
                          value={slot.slotDuration}
                          onChange={(e) =>
                            updateTimeSlot(
                              day.value,
                              index,
                              'slotDuration',
                              parseInt(e.target.value)
                            )
                          }
                          className="border rounded px-2 py-1 text-sm"
                        >
                          {SLOT_DURATIONS.map((duration) => (
                            <option key={duration} value={duration}>
                              {duration} min slots
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => removeTimeSlot(day.value, index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !hasLoaded}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>
    </div>
  );
}
