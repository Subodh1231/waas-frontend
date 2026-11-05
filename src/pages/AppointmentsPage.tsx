import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays, addMonths, parseISO, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Star } from 'lucide-react';
import api from '../lib/api';
import { getAppointmentFeedback, type AppointmentFeedbackView } from '../lib/api';
import AddAppointmentModal from '../components/AddAppointmentModal';

interface Booking {
  id: string;
  customerName: string;
  serviceName: string;
  dateTime: string;
  status: string;
  appointmentStatus?: string;
  source?: 'MANUAL' | 'WHATSAPP' | 'ONLINE';
  providerName?: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED';
  paymentMode?: 'CASH' | 'CARD' | 'UPI' | 'ONLINE' | 'INSURANCE';
  paymentAmount?: number;
  cancellationReason?: string;
  structuredData?: {
    doctorName?: string;
    phoneNumber?: string;
    notes?: string;
  };
}

type ViewMode = 'calendar' | 'list';
type CalendarMode = 'week' | 'month';
type StatusFilter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

const AppointmentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointmentPatientId, setAppointmentPatientId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('week');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [mobileSelectedDate, setMobileSelectedDate] = useState(new Date());
  const [mobileStatusFilter, setMobileStatusFilter] = useState<StatusFilter>('ALL');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsByDate, setBookingsByDate] = useState<Record<string, Booking[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    today: 0
  });

  useEffect(() => {
    const patientId = searchParams.get('patientId');
    const shouldCreateAppointment = searchParams.get('new') === '1';
    if (!patientId && !shouldCreateAppointment) return;
    if (patientId) setAppointmentPatientId(patientId);
    setShowAddModal(true);
    setSearchParams((current) => {
      current.delete('patientId');
      current.delete('new');
      return current;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  // Fetch bookings data
  const fetchBookings = async () => {
    try {
      setLoading(true);

      if (viewMode === 'calendar') {
        // Fetch calendar view data
        let start: string, end: string;
        
        if (calendarMode === 'week') {
          // Fetch current week
          start = format(startOfWeek(currentWeek), 'yyyy-MM-dd');
          end = format(endOfWeek(currentWeek), 'yyyy-MM-dd');
        } else {
          // Fetch current month
          start = format(startOfWeek(startOfMonth(currentMonth)), 'yyyy-MM-dd');
          end = format(endOfWeek(endOfMonth(currentMonth)), 'yyyy-MM-dd');
        }

        const response = await api.get('/api/bookings/calendar', {
          params: { startDate: start, endDate: end }
        });

        if (response.data.status === 'success') {
          setBookingsByDate(response.data.bookingsByDate || {});
        }
      } else {
        // Fetch all bookings for list view
        const response = await api.get('/api/bookings');
        if (response.data.status === 'success') {
          setBookings(response.data.bookings || []);
        }
      }

      // Fetch stats
      const statsResponse = await api.get('/api/bookings/stats');
      if (statsResponse.data.status === 'success') {
        setStats(statsResponse.data.stats);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [viewMode, currentMonth, currentWeek, calendarMode]);

  // Update booking status
  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await api.patch(`/api/bookings/${bookingId}/status`, { status: newStatus });
      fetchBookings(); // Refresh data
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  // Cancel booking with reason
  const handleCancelClick = (bookingId: string) => {
    setSelectedBooking(bookings.find(b => b.id === bookingId) || selectedBooking);
    setShowCancelModal(true);
    setCancelReason('');
  };

  const cancelBooking = async () => {
    if (!selectedBooking || !cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }
    
    try {
      await api.delete(`/api/bookings/${selectedBooking.id}`, {
        data: { cancellationReason: cancelReason }
      });
      fetchBookings(); // Refresh data
      setShowCancelModal(false);
      setSelectedBooking(null);
      setCancelReason('');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel appointment. Please try again.');
    }
  };

  // Get unique providers from bookings
  const getUniqueProviders = (): string[] => {
    const providers = new Set<string>();
    
    // Extract from bookingsByDate if in calendar view
    if (viewMode === 'calendar') {
      Object.values(bookingsByDate).forEach(dayBookings => {
        dayBookings.forEach(booking => {
          const provider = booking.providerName || booking.structuredData?.doctorName || 'Unknown';
          if (provider && provider !== 'Unknown') {
            providers.add(provider);
          }
        });
      });
    } else {
      // Extract from bookings array in list view
      bookings.forEach(booking => {
        const provider = booking.providerName || booking.structuredData?.doctorName || 'Unknown';
        if (provider && provider !== 'Unknown') {
          providers.add(provider);
        }
      });
    }
    
    return Array.from(providers).sort();
  };

  // Filter bookings by provider
  const filterBookingsByProvider = (bookingsList: Booking[]): Booking[] => {
    if (selectedProvider === 'all') return bookingsList;
    return bookingsList.filter(booking => {
      const provider = booking.providerName || booking.structuredData?.doctorName || 'Unknown';
      return provider === selectedProvider;
    });
  };

  // Filter bookings by date for provider
  const getFilteredBookingsByDate = (): Record<string, Booking[]> => {
    if (selectedProvider === 'all') return bookingsByDate;
    
    const filtered: Record<string, Booking[]> = {};
    Object.keys(bookingsByDate).forEach(date => {
      filtered[date] = filterBookingsByProvider(bookingsByDate[date]);
    });
    return filtered;
  };

  const renderMobileAgenda = () => {
    const filteredBookingsByDate = getFilteredBookingsByDate();
    const weekDays = eachDayOfInterval({
      start: startOfWeek(currentWeek),
      end: endOfWeek(currentWeek),
    });
    const selectedDateKey = format(mobileSelectedDate, 'yyyy-MM-dd');
    const selectedDateBookings = (filteredBookingsByDate[selectedDateKey] || [])
      .slice()
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    const visibleBookings = mobileStatusFilter === 'ALL'
      ? selectedDateBookings
      : selectedDateBookings.filter((booking) => booking.status === mobileStatusFilter);
    const statusFilters: { value: StatusFilter; label: string }[] = [
      { value: 'ALL', label: 'All' },
      { value: 'PENDING', label: 'Pending' },
      { value: 'CONFIRMED', label: 'Confirmed' },
      { value: 'COMPLETED', label: 'Completed' },
      { value: 'CANCELLED', label: 'Cancelled' },
    ];
    const setMobileDate = (date: Date) => {
      setMobileSelectedDate(date);
      setCurrentWeek(date);
      setCalendarMode('week');
      setViewMode('calendar');
    };
    const shiftWeek = (direction: -1 | 1) => {
      setMobileDate(addDays(mobileSelectedDate, direction * 7));
    };

    return (
      <div className="space-y-3">
        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => shiftWeek(-1)} aria-label="Previous week" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <p className="min-w-0 flex-1 text-center text-sm font-semibold text-gray-900">
              {format(startOfWeek(currentWeek), 'MMM d')} – {format(endOfWeek(currentWeek), 'MMM d')}
            </p>
            <button type="button" onClick={() => shiftWeek(1)} aria-label="Next week" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100">
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setMobileDate(new Date())}
              className="min-h-11 rounded-lg px-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              Today
            </button>
            <label className="relative flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
              <span className="sr-only">Jump to date</span>
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
              <input
                type="date"
                value={format(mobileSelectedDate, 'yyyy-MM-dd')}
                onChange={(event) => {
                  if (event.target.value) setMobileDate(parseISO(event.target.value));
                }}
                aria-label="Jump to appointment date"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
          </div>
          <div className="grid grid-cols-7 gap-1" role="group" aria-label="Choose appointment day">
            {weekDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const isSelected = isSameDay(day, mobileSelectedDate);
              const count = (filteredBookingsByDate[dateKey] || []).length;
              return (
                <button
                  key={dateKey}
                  type="button"
                  aria-label={`${format(day, 'EEEE, MMMM d')}${count ? `, ${count} appointments` : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => setMobileDate(day)}
                  className={`flex min-h-16 min-w-0 flex-col items-center justify-center rounded-lg border px-1 py-2 text-xs ${isSelected ? 'border-blue-600 bg-blue-600 font-semibold text-white' : 'border-transparent text-gray-700 hover:border-gray-200 hover:bg-gray-50'}`}
                >
                  <span>{format(day, 'EEE')}</span>
                  <span className="mt-1 text-sm font-semibold">{format(day, 'd')}</span>
                  {count > 0 && <span className="sr-only">{count} appointments</span>}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
            <div aria-live="polite">
              <h2 className="text-sm font-semibold text-gray-900">{format(mobileSelectedDate, 'EEEE, MMM d')}</h2>
              <p className="text-xs text-gray-600">
                {selectedDateBookings.length} appointment{selectedDateBookings.length === 1 ? '' : 's'}
              </p>
            </div>
            <label htmlFor="mobile-provider-filter" className="sr-only">Filter by provider</label>
            <select
              id="mobile-provider-filter"
              value={selectedProvider}
              onChange={(event) => setSelectedProvider(event.target.value)}
              className="min-h-11 max-w-[58%] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All providers</option>
              {getUniqueProviders().map((provider) => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter appointments by status">
          <div className="flex w-max min-w-full gap-2">
            {statusFilters.map((filter) => {
              const count = filter.value === 'ALL'
                ? selectedDateBookings.length
                : selectedDateBookings.filter((booking) => booking.status === filter.value).length;
              const isSelected = mobileStatusFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setMobileStatusFilter(filter.value)}
                  className={`min-h-11 shrink-0 rounded-full border px-3 text-sm ${isSelected ? 'border-blue-700 bg-blue-700 font-semibold text-white' : 'border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-50'}`}
                >
                  {filter.label} {count}
                </button>
              );
            })}
          </div>
        </div>

        {visibleBookings.length > 0 ? (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {visibleBookings.map((booking) => {
              const appointmentTime = format(new Date(booking.dateTime), 'h:mm a');
              const providerName = booking.providerName || booking.structuredData?.doctorName;
              return (
                <li key={booking.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(booking)}
                    aria-label={`${appointmentTime}, ${booking.customerName || 'Patient'}, ${booking.status}. View details`}
                    className="flex min-h-[76px] w-full items-center gap-3 px-3 py-3 text-left hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                  >
                    <span className="w-[4.5rem] shrink-0 text-sm font-semibold text-gray-900">{appointmentTime}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold text-gray-900">{booking.customerName || 'Patient'}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>{booking.status}</span>
                      </span>
                      <span className="mt-1 block truncate text-sm text-gray-600">{booking.serviceName}</span>
                      {providerName && <span className="block truncate text-xs text-gray-500">{providerName}</span>}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
            <p className="text-sm text-gray-700">
              {selectedDateBookings.length === 0
                ? `No appointments scheduled for ${format(mobileSelectedDate, 'EEEE, MMMM d')}.`
                : `No ${mobileStatusFilter.toLowerCase()} appointments on ${format(mobileSelectedDate, 'EEEE, MMMM d')}.`}
            </p>
            {mobileStatusFilter !== 'ALL' && selectedDateBookings.length > 0 && (
              <button
                type="button"
                onClick={() => setMobileStatusFilter('ALL')}
                className="mt-2 min-h-11 px-3 text-sm font-semibold text-blue-700"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Week Calendar rendering
  const renderWeekCalendar = () => {
    const weekStart = startOfWeek(currentWeek);
    const weekEnd = endOfWeek(currentWeek);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const filteredBookingsByDate = getFilteredBookingsByDate();

    return (
      <div className="bg-white rounded-lg shadow h-full flex flex-col">
        {/* Week Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-800">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded font-medium"
            >
              This Week
            </button>
            <button
              onClick={() => setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Week Grid */}
        <div className="px-4 pb-4 pt-2 flex-1 overflow-auto">
          <div className="grid grid-cols-7 gap-2 h-full">
            {weekDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayBookings = filteredBookingsByDate[dateKey] || [];
              const isTodayDate = isToday(day);

              return (
                <div
                  key={day.toString()}
                  className={`border rounded p-3 flex flex-col ${
                    isTodayDate ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'
                  }`}
                >
                  {/* Day Header */}
                  <div className="text-center mb-3 pb-2 border-b">
                    <div className="text-xs font-medium text-gray-500 uppercase">
                      {format(day, 'EEE')}
                    </div>
                    <div className={`text-2xl font-bold ${
                      isTodayDate ? 'text-blue-600' : 'text-gray-800'
                    }`}>
                      {format(day, 'd')}
                    </div>
                  </div>

                  {/* Appointments */}
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {dayBookings.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center mt-4">No appointments</p>
                    ) : (
                      dayBookings.map((booking) => {
                        let bgColor = 'bg-gray-100 text-gray-800';
                        if (booking.source === 'MANUAL') {
                          bgColor = 'bg-blue-100 text-blue-800';
                        } else if (booking.source === 'WHATSAPP') {
                          bgColor = 'bg-green-100 text-green-800';
                        } else if (booking.source === 'ONLINE') {
                          bgColor = 'bg-purple-100 text-purple-800';
                        }

                        return (
                          <div
                            key={booking.id}
                            onClick={() => setSelectedBooking(booking)}
                            className={`text-xs p-2 rounded cursor-pointer hover:shadow-md transition-shadow ${bgColor}`}
                          >
                            <div className="font-semibold mb-1">
                              {format(new Date(booking.dateTime), 'HH:mm')}
                              {booking.paymentStatus === 'PAID' && (
                                <span className="ml-1 text-[10px]">💰</span>
                              )}
                            </div>
                            <div className="truncate">{booking.customerName}</div>
                            <div className="text-[10px] opacity-75 truncate mt-1">
                              {booking.serviceName}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Calendar rendering
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    const filteredBookingsByDate = getFilteredBookingsByDate();

    const weeks: Date[][] = [];
    for (let i = 0; i < dateRange.length; i += 7) {
      weeks.push(dateRange.slice(i, i + 7));
    }

    return (
      <div className="bg-white rounded-lg shadow h-full flex flex-col">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-800">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded font-medium"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="px-4 pb-4 flex-1 overflow-auto">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-1">
              {week.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayBookings = filteredBookingsByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);

                return (
                  <div
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      min-h-[88px] p-2 border rounded cursor-pointer transition-colors
                      ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                      ${isTodayDate ? 'ring-2 ring-blue-500' : ''}
                      ${selectedDate && isSameDay(day, selectedDate) ? 'bg-blue-50 border-blue-400' : 'border-gray-200'}
                      hover:bg-gray-50
                    `}
                  >
                    <div className={`text-sm font-semibold mb-1 ${isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}`}>
                      {format(day, 'd')}
                    </div>
                    
                    {dayBookings.length > 0 && (
                      <div className="space-y-1">
                        {dayBookings.slice(0, 3).map((booking) => {
                          // Determine color based on source
                          let bgColor = 'bg-gray-100 text-gray-800';
                          if (booking.source === 'MANUAL') {
                            bgColor = 'bg-blue-100 text-blue-800';
                          } else if (booking.source === 'WHATSAPP') {
                            bgColor = 'bg-green-100 text-green-800';
                          } else if (booking.source === 'ONLINE') {
                            bgColor = 'bg-purple-100 text-purple-800';
                          } else {
                            // Fallback to status-based coloring if no source
                            if (booking.status === 'CONFIRMED') bgColor = 'bg-green-100 text-green-800';
                            else if (booking.status === 'PENDING') bgColor = 'bg-yellow-100 text-yellow-800';
                            else if (booking.status === 'CANCELLED') bgColor = 'bg-red-100 text-red-800';
                            else if (booking.status === 'COMPLETED') bgColor = 'bg-gray-100 text-gray-800';
                          }

                          return (
                            <div
                              key={booking.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBooking(booking);
                              }}
                              className={`text-xs p-1 rounded truncate hover:shadow-sm ${bgColor}`}
                            >
                              {format(new Date(booking.dateTime), 'HH:mm')} {booking.customerName}
                            </div>
                          );
                        })}
                        {dayBookings.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayBookings.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Selected date details */}
        {selectedDate && (
          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Appointments on {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {filteredBookingsByDate[format(selectedDate, 'yyyy-MM-dd')]?.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredBookingsByDate[format(selectedDate, 'yyyy-MM-dd')].map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="bg-white p-3 rounded border hover:border-blue-400 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {format(new Date(booking.dateTime), 'HH:mm')} - {booking.customerName}
                        </p>
                        <p className="text-sm text-gray-600">{booking.serviceName}</p>
                        {booking.structuredData?.doctorName && (
                          <p className="text-xs text-gray-500">Dr. {booking.structuredData.doctorName}</p>
                        )}
                      </div>
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded
                        ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : ''}
                        ${booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                        ${booking.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No appointments on this date</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // List view rendering
  const renderListView = () => {
    const filteredBookings = filterBookingsByProvider(bookings);
    
    const todayBookings = filteredBookings.filter(b => {
      const bookingDate = new Date(b.dateTime);
      return isToday(bookingDate) && b.status !== 'CANCELLED';
    });

    const upcomingBookings = filteredBookings.filter(b => {
      const bookingDate = new Date(b.dateTime);
      return bookingDate > new Date() && !isToday(bookingDate) && b.status !== 'CANCELLED';
    });

    const pastBookings = filteredBookings.filter(b => {
      const bookingDate = new Date(b.dateTime);
      return bookingDate < new Date() && !isToday(bookingDate);
    });

    return (
      <div className="space-y-6 flex-1">
        {/* Today's Appointments */}
        {todayBookings.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Today's Appointments</h2>
              <p className="text-sm text-gray-500">{format(new Date(), 'MMMM d, yyyy')}</p>
            </div>
            <div className="divide-y">
              {todayBookings.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  onSelect={() => setSelectedBooking(booking)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Appointments */}
        {upcomingBookings.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Upcoming Appointments</h2>
            </div>
            <div className="divide-y">
              {upcomingBookings.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  onSelect={() => setSelectedBooking(booking)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past Appointments */}
        {pastBookings.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Past Appointments</h2>
            </div>
            <div className="divide-y">
              {pastBookings.slice(0, 20).map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  onSelect={() => setSelectedBooking(booking)}
                />
              ))}
            </div>
          </div>
        )}

        {bookings.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No appointments found</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="shrink-0 px-4 pb-2 pt-3 sm:px-8 sm:pt-6 sm:pb-4 lg:flex lg:flex-row lg:items-start lg:justify-between lg:gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-gray-800 lg:mb-2 lg:text-3xl">Appointments</h1>
          <p className="hidden text-gray-600 lg:block">Manage and view your clinic appointments</p>
        </div>
        <button
          onClick={() => {
            setAppointmentPatientId(undefined);
            setShowAddModal(true);
          }}
          className="hidden min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-blue-700 lg:flex"
        >
          <Plus className="w-5 h-5" />
          New Appointment
        </button>
      </div>

      <div className="hidden shrink-0 px-4 sm:px-8 lg:block">
      {/* Stats Cards */}
      <div
        className={`grid gap-4 mb-4 transition-all ${
          viewMode === 'calendar'
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
            : 'grid-cols-2 md:grid-cols-6'
        }`}
      >
        <StatCard label="Today" value={stats.today} color="blue" />
        <StatCard label="Total" value={stats.total} color="gray" />
        <StatCard label="Pending" value={stats.pending} color="yellow" />
        <StatCard label="Confirmed" value={stats.confirmed} color="green" />
        <StatCard label="Completed" value={stats.completed} color="gray" />
        <StatCard label="Cancelled" value={stats.cancelled} color="red" />
      </div>

      {/* View Toggle */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        <button
          onClick={() => setViewMode('calendar')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            viewMode === 'calendar'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border'
          }`}
        >
          📅 Calendar
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border'
          }`}
        >
          📋 List
        </button>
        
        <div className="w-px bg-gray-300 mx-2"></div>
        <button
          onClick={() => {
            setCalendarMode('week');
            setViewMode('calendar');
          }}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            viewMode === 'calendar' && calendarMode === 'week'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-white text-gray-700 hover:bg-gray-50 border'
          }`}
        >
          Week
        </button>
        <button
          onClick={() => {
            setCalendarMode('month');
            setViewMode('calendar');
          }}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            viewMode === 'calendar' && calendarMode === 'month'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-white text-gray-700 hover:bg-gray-50 border'
          }`}
        >
          Month
        </button>
      </div>
      
      {/* Provider Filter */}
      <div className="flex flex-col items-stretch gap-2 mb-4 sm:flex-row sm:items-center sm:gap-3 sm:mb-6">
        <label htmlFor="provider-filter" className="text-sm font-medium text-gray-700">
          Filter by Provider:
        </label>
        <select
          id="provider-filter"
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto"
        >
          <option value="all">All Staff ({getUniqueProviders().length} provider{getUniqueProviders().length !== 1 ? 's' : ''})</option>
          {getUniqueProviders().map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>
      </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-24 overflow-auto sm:px-8 sm:pb-6">
      {loading ? (
        <>
          <div className="hidden rounded-lg bg-white p-12 text-center shadow lg:block">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading appointments...</p>
          </div>
          <div className="space-y-3 lg:hidden" aria-label="Loading appointments">
            <div className="h-36 animate-pulse rounded-xl bg-white shadow-sm" />
            <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
              <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
              <div className="h-14 animate-pulse rounded bg-gray-100" />
              <div className="h-14 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        </>
      ) : viewMode === 'calendar' ? (
        <>
          <div className="hidden h-full lg:block">
            {calendarMode === 'week' ? renderWeekCalendar() : renderCalendar()}
          </div>
          <div className="h-full lg:hidden">{renderMobileAgenda()}</div>
        </>
      ) : (
        renderListView()
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && !showCancelModal && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdateStatus={updateBookingStatus}
          onCancel={handleCancelClick}
        />
      )}

      {/* Cancel Reason Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Cancel Appointment</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Patient: <span className="font-semibold">{selectedBooking.customerName}</span></p>
                <p className="text-sm text-gray-600">Date: <span className="font-semibold">{format(new Date(selectedBooking.dateTime), 'MMM d, yyyy • h:mm a')}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Cancellation <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="e.g., Patient requested reschedule, Emergency, Doctor unavailable..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">This reason will be saved for future communication with the patient.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="px-4 py-2 bg-white text-gray-700 rounded hover:bg-gray-100 border font-medium"
              >
                Go Back
              </button>
              <button
                onClick={cancelBooking}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Add Appointment Modal */}
      <AddAppointmentModal
        isOpen={showAddModal}
        defaultPatientId={appointmentPatientId}
        onClose={() => {
          setShowAddModal(false);
          setAppointmentPatientId(undefined);
        }}
        onSuccess={() => {
          fetchBookings();
          setShowAddModal(false);
          setAppointmentPatientId(undefined);
        }}
      />
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    gray: 'bg-gray-50 text-gray-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

// Booking Row Component
const BookingRow = ({ booking, onSelect }: { booking: Booking; onSelect: () => void }) => {
  const getSourceBadge = (source?: string) => {
    if (!source) return null;
    
    const badges = {
      MANUAL: { color: 'bg-blue-100 text-blue-800', text: '👤 Manual' },
      WHATSAPP: { color: 'bg-green-100 text-green-800', text: '💬 WhatsApp' },
      ONLINE: { color: 'bg-purple-100 text-purple-800', text: '🌐 Online' },
    };
    
    const badge = badges[source as keyof typeof badges];
    if (!badge) return null;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div
      onClick={onSelect}
      className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <p className="font-semibold text-gray-800">
              {format(new Date(booking.dateTime), 'MMM d, yyyy • h:mm a')}
            </p>
            <span className={`
              px-2 py-1 text-xs font-medium rounded
              ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : ''}
              ${booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
              ${booking.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : ''}
            `}>
              {booking.status}
            </span>
            {getSourceBadge(booking.source)}
            {booking.paymentStatus && (
              <span className={`
                px-2 py-1 text-xs font-medium rounded
                ${booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : ''}
                ${booking.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${booking.paymentStatus === 'PARTIAL' ? 'bg-orange-100 text-orange-800' : ''}
                ${booking.paymentStatus === 'REFUNDED' ? 'bg-gray-100 text-gray-800' : ''}
              `}>
                💰 {booking.paymentStatus}
              </span>
            )}
          </div>
          <p className="text-lg font-medium text-gray-700 mt-1">{booking.customerName}</p>
          <p className="text-sm text-gray-600">{booking.serviceName}</p>
          {booking.structuredData?.doctorName && (
            <p className="text-sm text-gray-500">Dr. {booking.structuredData.doctorName}</p>
          )}
        </div>
        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          View Details →
        </button>
      </div>
    </div>
  );
};

// Booking Detail Modal Component
const BookingDetailModal = ({
  booking,
  onClose,
  onUpdateStatus,
  onCancel
}: {
  booking: Booking;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onCancel: (id: string) => void;
}) => {
  const navigate = useNavigate();
  const isCompleted = booking.status === 'COMPLETED' || booking.appointmentStatus === 'COMPLETED';
  const [existingInvoiceId, setExistingInvoiceId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(booking.paymentStatus || 'PENDING');
  const [paymentMode, setPaymentMode] = useState(booking.paymentMode || 'CASH');
  const [paymentAmount, setPaymentAmount] = useState(booking.paymentAmount?.toString() || '');
  const [feedback, setFeedback] = useState<AppointmentFeedbackView | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setExistingInvoiceId(null);
    if (!isCompleted) return () => { active = false; };
    api.get(`/api/invoices/appointments/${booking.id}`)
      .then((response) => {
        if (active) setExistingInvoiceId(response.data.id);
      })
      .catch((error) => {
        if (active) {
          if (error.response?.status !== 404) {
            console.error('Could not check for an existing invoice:', error);
          }
          setExistingInvoiceId(null);
        }
      });
    return () => { active = false; };
  }, [booking.id, isCompleted]);

  useEffect(() => {
    let active = true;
    if (!isCompleted) {
      setFeedback(null);
      return () => { active = false; };
    }
    setFeedbackLoading(true);
    getAppointmentFeedback(booking.id)
      .then((result) => { if (active) setFeedback(result); })
      .catch(() => { if (active) setFeedback({ status: 'NOT_REQUESTED' }); })
      .finally(() => { if (active) setFeedbackLoading(false); });
    return () => { active = false; };
  }, [booking.id, isCompleted]);

  const handleUpdatePayment = async () => {
    try {
      const response = await api.patch(`/api/appointments/${booking.id}/payment`, {
        paymentStatus,
        paymentMode,
        paymentAmount: paymentAmount ? parseFloat(paymentAmount) : null
      });
      
      if (response.data) {
        setEditingPayment(false);
        // Refresh the page or show success message
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error updating payment:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update payment information';
      alert(errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-stretch bg-black/50 p-0 sm:items-center sm:justify-center sm:p-4">
      <div className="flex h-[100dvh] max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-xl sm:h-auto sm:max-h-[90vh] sm:rounded-lg">
        {/* Modal Header */}
        <div className="sticky top-0 flex shrink-0 items-center justify-between border-b bg-white px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-xl font-semibold text-gray-800 sm:text-2xl">Appointment Details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close appointment details"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          {/* Status Badge */}
          <div>
            <span className={`
              px-3 py-1 text-sm font-medium rounded
              ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : ''}
              ${booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
              ${booking.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : ''}
            `}>
              {booking.status}
            </span>
          </div>

          {/* Date & Time */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Date & Time</p>
            <p className="text-lg font-semibold text-gray-800">
              {format(new Date(booking.dateTime), 'MMMM d, yyyy • h:mm a')}
            </p>
          </div>

          {/* Patient Info */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Patient Name</p>
            <p className="text-lg font-semibold text-gray-800">{booking.customerName}</p>
          </div>

          {/* Service */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Service</p>
            <p className="text-lg font-semibold text-gray-800">{booking.serviceName}</p>
          </div>

          {isCompleted && (
            <section className="border-t pt-4" aria-label="Appointment feedback">
              <h3 className="text-sm font-semibold text-gray-800">Feedback</h3>
              {feedbackLoading ? <p className="mt-2 text-sm text-gray-500">Loading feedback…</p> : feedback?.status === 'SUBMITTED' ? (
                <div className="mt-2">
                  <div className="flex items-center gap-1" aria-label={`${feedback.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-4 w-4 ${index < (feedback.rating || 0) ? 'fill-amber-400 text-amber-500' : 'text-gray-300'}`} aria-hidden="true" />)}
                    <span className="ml-1 text-sm font-medium text-gray-700">{feedback.rating}/5</span>
                  </div>
                  {feedback.comment && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">“{feedback.comment}”</p>}
                  {feedback.submittedAt && <p className="mt-2 text-xs text-gray-500">Submitted {format(new Date(feedback.submittedAt), 'MMM d, yyyy')}</p>}
                </div>
              ) : <p className="mt-2 text-sm text-gray-600">{{ NOT_REQUESTED: 'Feedback not requested', SCHEDULED: 'Feedback request scheduled', SENT: 'Feedback request sent', SKIPPED_NO_EMAIL: 'Feedback skipped · no patient email', EXPIRED: 'Feedback request expired', FAILED: 'Feedback request failed' }[feedback?.status || 'NOT_REQUESTED'] || 'Feedback status unavailable'}</p>}
            </section>
          )}

          {/* Doctor */}
          {(booking.providerName || booking.structuredData?.doctorName) && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Doctor/Provider</p>
              <p className="text-lg font-semibold text-gray-800">
                {booking.providerName || booking.structuredData?.doctorName}
              </p>
            </div>
          )}

          {/* Phone Number */}
          {booking.structuredData?.phoneNumber && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Phone Number</p>
              <p className="text-lg font-semibold text-gray-800">{booking.structuredData.phoneNumber}</p>
            </div>
          )}

          {/* Notes */}
          {booking.structuredData?.notes && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Notes</p>
              <p className="text-gray-800">{booking.structuredData.notes}</p>
            </div>
          )}

          {/* Payment Status */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold text-gray-700">Payment Information</p>
              <button
                onClick={() => setEditingPayment(!editingPayment)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {editingPayment ? 'Cancel Edit' : 'Edit Payment'}
              </button>
            </div>
            
            {!editingPayment ? (
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`
                  px-3 py-1 text-sm font-medium rounded
                  ${paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : ''}
                  ${paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${paymentStatus === 'PARTIAL' ? 'bg-orange-100 text-orange-800' : ''}
                  ${paymentStatus === 'REFUNDED' ? 'bg-gray-100 text-gray-800' : ''}
                `}>
                  {paymentStatus}
                </span>
                {paymentMode && (
                  <span className="text-sm text-gray-600">
                    via <span className="font-semibold">{paymentMode}</span>
                  </span>
                )}
                {paymentAmount && (
                  <span className="text-sm font-semibold text-gray-800">
                    ₹{paymentAmount}
                  </span>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PAID">Paid</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="REFUNDED">Refunded</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="ONLINE">Online</option>
                      <option value="INSURANCE">Insurance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
                <button
                  onClick={handleUpdatePayment}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium"
                >
                  Save Payment Info
                </button>
              </div>
            )}
          </div>

          {/* Cancellation Reason */}
          {booking.cancellationReason && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Cancellation Reason</p>
              <p className="text-gray-800 bg-red-50 p-3 rounded border border-red-200">
                {booking.cancellationReason}
              </p>
            </div>
          )}

          {/* Booking ID */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Booking ID</p>
            <p className="text-sm font-mono text-gray-600">{booking.id}</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="sticky bottom-0 flex shrink-0 flex-col gap-2 border-t bg-gray-50 px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
          {isCompleted && (
            <button
              onClick={() => navigate(existingInvoiceId
                ? `/invoices/${existingInvoiceId}`
                : `/invoices?appointmentId=${booking.id}`)}
              className="min-h-11 rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              {existingInvoiceId ? 'View Invoice' : 'Generate Invoice'}
            </button>
          )}
          {booking.status === 'PENDING' && (
            <button
              onClick={() => onUpdateStatus(booking.id, 'CONFIRMED')}
              className="min-h-11 rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
            >
              ✓ Confirm
            </button>
          )}
          {booking.status === 'CONFIRMED' && (
            <button
              onClick={() => onUpdateStatus(booking.id, 'COMPLETED')}
              className="min-h-11 rounded bg-gray-600 px-4 py-2 font-medium text-white hover:bg-gray-700"
            >
              ✓ Mark Complete
            </button>
          )}
          {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
            <button
              onClick={() => onCancel(booking.id)}
              className="min-h-11 rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
            >
              ✕ Cancel
            </button>
          )}
          <button
            onClick={onClose}
            className="min-h-11 rounded border bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;
