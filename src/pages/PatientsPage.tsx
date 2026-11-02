import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, DollarSign, Activity, Phone, Plus, Filter, Search } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import api from '../lib/api';

dayjs.extend(relativeTime);

interface PatientAnalytics {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
  
  // Analytics
  totalVisits: number;
  totalRevenue: number;
  averageVisitValue: number;
  lastVisitDate?: string;
  nextAppointmentDate?: string;
  upcomingAppointmentsCount: number;
  
  // Source breakdown
  manualAppointments: number;
  whatsappAppointments: number;
  onlineAppointments: number;
  otherAppointments: number;
  
  // Status
  isNewPatient: boolean;
  hasUpcoming: boolean;
  daysSinceLastVisit?: number;
}

const PatientsPage = () => {
  const [patients, setPatients] = useState<PatientAnalytics[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('recent');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, [sourceFilter, typeFilter, sortBy]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get<PatientAnalytics[]>(
        `/api/patients/list?source=${sourceFilter}&type=${typeFilter}&sort=${sortBy}`
      );
      setPatients(response.data);
      setFilteredPatients(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch patients:', err);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!searchQuery.trim()) {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter(patient => {
        const name = patient.name?.toLowerCase() || '';
        const phone = patient.phoneNumber.toLowerCase();
        const email = patient.email?.toLowerCase() || '';
        return name.includes(query) || phone.includes(query) || email.includes(query);
      });
      setFilteredPatients(filtered);
    }
  };

  const handleBookAppointment = (patientId: string) => {
    navigate(`/appointments?patientId=${patientId}`);
  };

  const handleViewHistory = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  const getSourceBadge = (patient: PatientAnalytics) => {
    const channels = [
      patient.manualAppointments > 0 ? 'Manual' : null,
      patient.whatsappAppointments > 0 ? 'WhatsApp' : null,
      patient.onlineAppointments > 0 ? 'Online' : null,
    ].filter(Boolean);
    if (channels.length === 0) return <span className="text-xs text-gray-400">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {channels.map((channel) => (
          <span key={channel} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">{channel}</span>
        ))}
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatLastVisit = (date?: string, days?: number) => {
    if (!date) return 'No visits yet';
    if (days !== undefined && days !== null) {
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;
      if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
      return `${Math.floor(days / 30)} months ago`;
    }
    return dayjs(date).fromNow();
  };

  const formatNextAppointment = (date?: string) => {
    if (!date) return 'No upcoming appointments';
    const appointmentDate = dayjs(date);
    const today = dayjs();
    const tomorrow = dayjs().add(1, 'day');
    
    if (appointmentDate.isSame(today, 'day')) {
      return `Today at ${appointmentDate.format('hh:mm A')}`;
    } else if (appointmentDate.isSame(tomorrow, 'day')) {
      return `Tomorrow at ${appointmentDate.format('hh:mm A')}`;
    } else {
      return appointmentDate.format('MMM DD, YYYY @ hh:mm A');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading patients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 shrink-0 sm:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Patients</h1>
        <p className="text-gray-600">
          Manage patient records and appointment history
        </p>
      </div>

      {/* Filters */}
      <div className="px-4 pb-4 shrink-0 sm:px-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Sources</option>
              <option value="MANUAL">Manual Only</option>
              <option value="WHATSAPP">WhatsApp Only</option>
              <option value="ONLINE">Online Only</option>
            </select>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Patients</option>
            <option value="NEW">New Patients</option>
            <option value="RETURNING">Returning Patients</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Sort: Most Recent</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="visits">Sort: Most Visits</option>
            <option value="revenue">Sort: Highest Revenue</option>
          </select>

          <div className="ml-auto text-sm text-gray-600">
            {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
      </div>

      {/* Patients Grid */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center mx-8">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">
            {searchQuery ? 'No patients found matching your search' : 'No patients yet. Patients will appear here when appointments are created.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate('/appointments')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Book First Appointment
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 bg-white shadow border-t border-gray-200 overflow-hidden">
          <div className="h-full w-full overflow-auto">
            <table className="min-w-[1200px] w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Invoice Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Appointment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Channels
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewHistory(patient.id)}
                              aria-label={`View patient ${patient.name || 'record'}`}
                              className="text-left text-sm font-medium text-gray-900 underline decoration-transparent underline-offset-2 hover:text-blue-700 hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                            >
                              {patient.name || 'Unknown'}
                            </button>
                            {patient.isNewPatient && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {patient.phoneNumber ? (
                        <a href={`tel:${patient.phoneNumber}`} className="text-sm text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label={`Call patient ${patient.name || ''} at ${patient.phoneNumber}`}>
                          {patient.phoneNumber}
                        </a>
                      ) : <span className="text-sm text-gray-400">No phone number</span>}
                      {patient.email && (
                        <div className="text-xs text-gray-500">{patient.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          {patient.totalVisits}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(patient.totalRevenue)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {formatLastVisit(patient.lastVisitDate, patient.daysSinceLastVisit)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {patient.nextAppointmentDate ? (
                        <div className="text-sm text-green-700 font-medium">
                          {formatNextAppointment(patient.nextAppointmentDate)}
                        </div>
                      ) : (
                        <div className="text-sm text-orange-600">None</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSourceBadge(patient)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleBookAppointment(patient.id)}
                          type="button"
                          className="rounded p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          title="New Appointment"
                          aria-label={`New appointment for ${patient.name || 'patient'}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewHistory(patient.id)}
                          type="button"
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          title="View Patient"
                          aria-label={`View patient ${patient.name || 'record'}`}
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        {patient.phoneNumber && (
                          <a
                            href={`tel:${patient.phoneNumber}`}
                            className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            title="Call Patient"
                            aria-label={`Call patient ${patient.name || 'patient'}`}
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsPage;
