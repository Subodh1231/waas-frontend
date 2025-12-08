import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import api from '../lib/api';

interface Booking {
  id: string;
  customerName: string;
  serviceName: string;
  dateTime: string;
  status: string;
  appointmentStatus?: string;
  structuredData?: {
    doctorName?: string;
    phoneNumber?: string;
    notes?: string;
  };
}

type ViewMode = 'calendar' | 'list';

const AppointmentsPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsByDate, setBookingsByDate] = useState<Record<string, Booking[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
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
        // Fetch calendar view data for the current month
        const start = format(startOfWeek(startOfMonth(currentMonth)), 'yyyy-MM-dd');
        const end = format(endOfWeek(endOfMonth(currentMonth)), 'yyyy-MM-dd');

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
  }, [viewMode, currentMonth]);

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

  // Cancel booking
  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      await api.delete(`/api/bookings/${bookingId}`);
      fetchBookings(); // Refresh data
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  // Calendar rendering
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    const weeks: Date[][] = [];
    for (let i = 0; i < dateRange.length; i += 7) {
      weeks.push(dateRange.slice(i, i + 7));
    }

    return (
      <div className="bg-white rounded-lg shadow">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
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
        <div className="p-4">
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
                const dayBookings = bookingsByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);

                return (
                  <div
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      min-h-[100px] p-2 border rounded cursor-pointer transition-colors
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
                        {dayBookings.slice(0, 3).map((booking) => (
                          <div
                            key={booking.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(booking);
                            }}
                            className={`
                              text-xs p-1 rounded truncate
                              ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : ''}
                              ${booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                              ${booking.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : ''}
                              hover:shadow-sm
                            `}
                          >
                            {format(new Date(booking.dateTime), 'HH:mm')} {booking.customerName}
                          </div>
                        ))}
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
            
            {bookingsByDate[format(selectedDate, 'yyyy-MM-dd')]?.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {bookingsByDate[format(selectedDate, 'yyyy-MM-dd')].map((booking) => (
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
    const todayBookings = bookings.filter(b => {
      const bookingDate = new Date(b.dateTime);
      return isToday(bookingDate) && b.status !== 'CANCELLED';
    });

    const upcomingBookings = bookings.filter(b => {
      const bookingDate = new Date(b.dateTime);
      return bookingDate > new Date() && !isToday(bookingDate) && b.status !== 'CANCELLED';
    });

    const pastBookings = bookings.filter(b => {
      const bookingDate = new Date(b.dateTime);
      return bookingDate < new Date() && !isToday(bookingDate);
    });

    return (
      <div className="space-y-6">
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Appointments</h1>
        <p className="text-gray-600">Manage and view your clinic appointments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
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
          📅 Calendar View
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border'
          }`}
        >
          📋 List View
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
        </div>
      ) : viewMode === 'calendar' ? (
        renderCalendar()
      ) : (
        renderListView()
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdateStatus={updateBookingStatus}
          onCancel={cancelBooking}
        />
      )}
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
          {booking.structuredData?.doctorName && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Doctor</p>
              <p className="text-lg font-semibold text-gray-800">Dr. {booking.structuredData.doctorName}</p>
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
