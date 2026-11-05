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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-0 sm:p-4">
      <div className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-white shadow-xl sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b p-4 sm:p-6">
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
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:max-h-[calc(90vh-180px)] sm:p-6">
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
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <h3 className="font-medium text-gray-900">{day.label}</h3>
                    </div>
                    <div className="flex gap-2">
                      {daySchedules[day.value]?.length > 0 && (
                        <button
                          onClick={() => copyToAllDays(day.value)}
                          className="min-h-11 text-left text-xs text-blue-600 hover:text-blue-700"
                        >
                          Copy to all days
                        </button>
                      )}
                      <button
                        onClick={() => addTimeSlot(day.value)}
                        className="flex min-h-11 items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
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
                        className="flex flex-col gap-3 rounded bg-gray-50 p-3 sm:flex-row sm:items-center sm:gap-3"
                      >
                        <Clock className="h-4 w-4 text-gray-400" />
                        
                        <div className="flex flex-1 flex-wrap items-center gap-2">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) =>
                              updateTimeSlot(day.value, index, 'startTime', e.target.value)
                            }
                            className="min-h-11 rounded border px-2 py-1 text-sm"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) =>
                              updateTimeSlot(day.value, index, 'endTime', e.target.value)
                            }
                            className="min-h-11 rounded border px-2 py-1 text-sm"
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
                          className="min-h-11 w-full rounded border px-2 py-1 text-sm sm:w-auto"
                        >
                          {SLOT_DURATIONS.map((duration) => (
                            <option key={duration} value={duration}>
                              {duration} min slots
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => removeTimeSlot(day.value, index)}
                          className="flex min-h-11 min-w-11 self-end items-center justify-center text-red-600 hover:text-red-700 sm:self-auto"
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
        <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-end sm:p-6">
          <button
            onClick={onClose}
            className="min-h-11 w-full px-4 py-2 text-gray-700 hover:text-gray-900 sm:w-auto"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !hasLoaded}
            className="min-h-11 w-full rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>
    </div>
  );
}
