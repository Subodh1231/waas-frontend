import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Filter, ToggleLeft, ToggleRight, X } from 'lucide-react';
import api, { type ServiceItem, type Staff } from '../lib/api';

interface ServiceFormData {
  name: string;
  price: string;
  description: string;
  consultationType: string;
  durationMinutes: string;
  color: string;
  category: string;
  bufferMinutes: string;
  isActive: boolean;
  onlineBookable: boolean;
  providerId: string;
}

const CATEGORIES = [
  'General',
  'Consultation',
  'Follow-up',
  'Diagnostic',
  'Procedure',
  'Therapy',
  'Dental',
  'Lab Test',
  'Vaccination',
  'Screening'
];

const CATEGORY_COLORS: Record<string, string> = {
  'General': '#6B7280',
  'Consultation': '#3B82F6',
  'Follow-up': '#10B981',
  'Diagnostic': '#F59E0B',
  'Procedure': '#EF4444',
  'Therapy': '#8B5CF6',
  'Dental': '#06B6D4',
  'Lab Test': '#F97316',
  'Vaccination': '#14B8A6',
  'Screening': '#EC4899'
};

const ServicesPage = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [providers, setProviders] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    price: '',
    description: '',
    consultationType: '',
    durationMinutes: '30',
    color: '#3B82F6',
    category: 'General',
    bufferMinutes: '0',
    isActive: true,
    onlineBookable: true,
    providerId: ''
  });
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchServices();
    fetchProviders();
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get<ServiceItem[]>('/api/services');
      setServices(response.data);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      showToast('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await api.get<Staff[]>('/api/staff?activeOnly=true');
      setProviders(response.data);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const openAddModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      price: '',
      description: '',
      consultationType: '',
      durationMinutes: '30',
      color: '#3B82F6',
      category: 'General',
      bufferMinutes: '0',
      isActive: true,
      onlineBookable: true,
      providerId: ''
    });
    setShowModal(true);
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price.toString(),
      description: service.description || '',
      consultationType: service.consultationType || service.name,
      durationMinutes: service.durationMinutes?.toString() || '30',
      color: service.color || '#3B82F6',
      category: service.category || 'General',
      bufferMinutes: service.bufferMinutes?.toString() || '0',
      isActive: service.isActive !== false,
      onlineBookable: service.onlineBookable !== false,
      providerId: service.providerId || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const durationMinutes = Number(formData.durationMinutes);
    if (!Number.isInteger(durationMinutes) || durationMinutes < 5) {
      showToast('Duration must be a whole number of at least 5 minutes', 'error');
      return;
    }

    const payload = {
      name: formData.name,
      price: formData.price.trim() ? parseFloat(formData.price) : 0,
      description: formData.description,
      consultationType: formData.consultationType || formData.name,
      durationMinutes,
      color: formData.color,
      category: formData.category,
      bufferMinutes: parseInt(formData.bufferMinutes),
      isActive: formData.isActive,
      onlineBookable: formData.onlineBookable,
      providerId: formData.providerId || null
    };

    try {
      if (editingService) {
        await api.put(`/api/services/${editingService.id}`, payload);
        showToast('Service updated successfully', 'success');
      } else {
        await api.post('/api/services', payload);
        showToast('Service created successfully', 'success');
      }
      closeModal();
      fetchServices();
    } catch (error: any) {
      console.error('Failed to save service:', error);
      showToast(error.response?.data?.message || 'Failed to save service', 'error');
    }
  };

  const handleToggleActive = async (service: ServiceItem) => {
    try {
      await api.put(`/api/services/${service.id}`, {
        ...service,
        isActive: !service.isActive
      });
      showToast(`Service ${!service.isActive ? 'activated' : 'deactivated'}`, 'success');
      fetchServices();
    } catch (error: any) {
      showToast('Failed to update service', 'error');
    }
  };

  const handleDelete = async (service: ServiceItem) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/services/${service.id}`);
      showToast('Service deleted successfully', 'success');
      fetchServices();
    } catch (error: any) {
      console.error('Failed to delete service:', error);
      showToast(error.response?.data?.message || 'Failed to delete service', 'error');
    }
  };

  // Filter services
  const filteredServices = services.filter((service) => {
    if (categoryFilter !== 'all' && service.category !== categoryFilter) return false;
    if (providerFilter !== 'all' && service.providerId !== providerFilter) return false;
    if (statusFilter === 'active' && !service.isActive) return false;
    if (statusFilter === 'inactive' && service.isActive) return false;
    return true;
  });

  const getProviderName = (providerId?: string) => {
    if (!providerId) return null;
    const provider = providers.find(p => p.id === providerId);
    return provider?.name;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading services...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 pb-20 lg:pb-0">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 flex flex-col items-stretch justify-between gap-3 px-4 pt-4 pb-3 sm:flex-row sm:items-center sm:px-8 sm:pt-6 sm:pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Catalog</h1>
          <p className="text-gray-600">
            Manage services, pricing, and provider assignments
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="min-h-11 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Service
        </button>
      </div>

      {/* Filters */}
      <div className="shrink-0 px-4 pb-4 sm:px-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4 sm:flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-h-11 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm sm:w-auto"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="min-h-11 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm sm:w-auto"
          >
            <option value="all">All Providers</option>
            <option value="">Unassigned</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>{provider.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-11 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm sm:w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <div className="text-sm text-gray-600 sm:ml-auto">
            {filteredServices.length} of {services.length} services
          </div>
        </div>
      </div>
      </div>

      {/* Services Table */}
      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">No services found</p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Your First Service
          </button>
        </div>
      ) : (
        <>
        <div className="flex-1 overflow-y-auto border-t border-gray-200 bg-white shadow lg:hidden">
          <ul className="divide-y divide-gray-200">
            {filteredServices.map((service) => (
              <li key={service.id} className={`p-4 ${!service.isActive ? 'bg-gray-50 opacity-70' : ''}`}>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: service.color || '#3B82F6' }} />
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words font-semibold text-gray-900">{service.name}</h2>
                    {service.description && <p className="mt-1 text-sm text-gray-600">{service.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full px-2 py-1 text-xs font-medium" style={{ backgroundColor: `${CATEGORY_COLORS[service.category || 'General']}20`, color: CATEGORY_COLORS[service.category || 'General'] }}>{service.category || 'General'}</span>
                      {!service.isActive && <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700">Inactive</span>}
                      {service.isActive && service.onlineBookable && <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">Online</span>}
                    </div>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-xs text-gray-500">Provider</dt><dd className="text-gray-800">{getProviderName(service.providerId) || 'Unassigned'}</dd></div>
                  <div><dt className="text-xs text-gray-500">Duration</dt><dd className="text-gray-800">{service.durationMinutes} min{service.bufferMinutes ? ` + ${service.bufferMinutes}m buffer` : ''}</dd></div>
                  <div><dt className="text-xs text-gray-500">Price</dt><dd className="font-semibold text-gray-900">₹{service.price.toFixed(2)}</dd></div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                  <button type="button" onClick={() => handleToggleActive(service)} className="min-h-11 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700">
                    {service.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button type="button" onClick={() => openEditModal(service)} className="min-h-11 flex-1 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700">Edit</button>
                  <button type="button" onClick={() => handleDelete(service)} className="min-h-11 flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="hidden flex-1 overflow-hidden border-t border-gray-200 bg-white shadow lg:block">
          <div className="h-full w-full overflow-auto">
            <table className="min-w-[1200px] w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.map((service) => (
                  <tr key={service.id} className={`hover:bg-gray-50 ${!service.isActive ? 'bg-gray-50 opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: service.color || '#3B82F6' }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                          {service.description && (
                            <div className="text-xs text-gray-500 line-clamp-1">{service.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-2 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[service.category || 'General']}20`,
                          color: CATEGORY_COLORS[service.category || 'General']
                        }}
                      >
                        {service.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getProviderName(service.providerId) || (
                          <span className="text-orange-600 text-xs">⚠️ Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {service.durationMinutes} min
                        {service.bufferMinutes ? (
                          <span className="text-xs text-gray-500 ml-1">+{service.bufferMinutes}m</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">₹{service.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(service)}
                          className="flex-shrink-0"
                          title={service.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {service.isActive ? (
                            <ToggleRight className="w-6 h-6 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-gray-400" />
                          )}
                        </button>
                        <div className="flex flex-col gap-1">
                          {service.isActive && service.onlineBookable && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                              Online
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEditModal(service)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit service"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(service)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-stretch bg-black/50 p-0 sm:items-center sm:justify-center sm:p-4">
          <div className="h-[100dvh] max-h-[100dvh] w-full max-w-2xl overflow-y-auto bg-white shadow-xl sm:h-auto sm:max-h-[90vh] sm:rounded-lg">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Provider
                  </label>
                  <select
                    value={formData.providerId}
                    onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Clinic-wide (no specific provider)</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name} - {provider.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buffer Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.bufferMinutes}
                    onChange={(e) => setFormData({ ...formData, bufferMinutes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    step="5"
                  />
                  <p className="text-xs text-gray-500 mt-1">Time blocked after appointment</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹, optional)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>

                {/* Checkboxes */}
                <div className="col-span-2 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Service is active and bookable</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.onlineBookable}
                      onChange={(e) => setFormData({ ...formData, onlineBookable: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Allow online booking</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
