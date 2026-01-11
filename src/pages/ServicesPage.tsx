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

    const payload = {
      name: formData.name,
      price: parseFloat(formData.price),
      description: formData.description,
      consultationType: formData.consultationType || formData.name,
      durationMinutes: parseInt(formData.durationMinutes),
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
    <div className="h-screen w-full flex flex-col bg-gray-50">
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
      <div className="px-8 pt-6 pb-4 shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Catalog</h1>
          <p className="text-gray-600">
            Manage services, pricing, and provider assignments
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Service
        </button>
      </div>

      {/* Filters */}
      <div className="px-8 pb-4 shrink-0">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
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
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <div className="ml-auto text-sm text-gray-600">
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
        <div className="flex-1 bg-white shadow border-t border-gray-200 overflow-hidden">
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
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-2 gap-4">
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
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                    min="5"
                    step="5"
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
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
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
