import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { Plus } from 'lucide-react';
import api from '../lib/api';
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

const AppointmentsPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('week');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
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
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 flex justify-between items-start shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Appointments</h1>
          <p className="text-gray-600">Manage and view your clinic appointments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Appointment
        </button>
      </div>

      <div className="px-8 shrink-0">
      {/* Stats Cards */}
      <div
        className={`grid gap-4 mb-4 transition-all ${
          viewMode === 'calendar'
            ? 'grid-cols-6'
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
      <div className="flex gap-2 mb-6">
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
        
        {viewMode === 'calendar' && (
          <>
            <div className="w-px bg-gray-300 mx-2"></div>
            <button
              onClick={() => setCalendarMode('week')}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                calendarMode === 'week'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setCalendarMode('month')}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                calendarMode === 'month'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              Month
            </button>
          </>
        )}
      </div>
      
      {/* Provider Filter */}
      <div className="flex items-center gap-3 mb-6">
        <label htmlFor="provider-filter" className="text-sm font-medium text-gray-700">
          Filter by Provider:
        </label>
        <select
          id="provider-filter"
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
      <div className="flex-1 px-8 pb-6 overflow-auto">
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
        </div>
      ) : viewMode === 'calendar' ? (
        calendarMode === 'week' ? renderWeekCalendar() : renderCalendar()
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
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchBookings();
          setShowAddModal(false);
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
  const [editingPayment, setEditingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(booking.paymentStatus || 'PENDING');
  const [paymentMode, setPaymentMode] = useState(booking.paymentMode || 'CASH');
  const [paymentAmount, setPaymentAmount] = useState(booking.paymentAmount?.toString() || '');

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-semibold text-gray-800">Appointment Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
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
                <div className="grid grid-cols-3 gap-3">
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
        <div className="px-6 py-4 border-t bg-gray-50 flex gap-2 justify-end sticky bottom-0">
          {booking.status === 'PENDING' && (
            <button
              onClick={() => onUpdateStatus(booking.id, 'CONFIRMED')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
            >
              ✓ Confirm
            </button>
          )}
          {booking.status === 'CONFIRMED' && (
            <button
              onClick={() => onUpdateStatus(booking.id, 'COMPLETED')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-medium"
            >
              ✓ Mark Complete
            </button>
          )}
          {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
            <button
              onClick={() => onCancel(booking.id)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
            >
              ✕ Cancel
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-gray-700 rounded hover:bg-gray-100 border font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;
