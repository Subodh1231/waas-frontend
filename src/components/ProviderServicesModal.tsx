import { useState, useEffect } from 'react';
import { X, Plus, Trash2, DollarSign, Clock, Check } from 'lucide-react';
import type { ServiceItem } from '../lib/api';
import api from '../lib/api';

interface ProviderServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
}

export default function ProviderServicesModal({
  isOpen,
  onClose,
  providerId,
  providerName,
}: ProviderServicesModalProps) {
  const [allServices, setAllServices] = useState<ServiceItem[]>([]);
  const [providerServices, setProviderServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: 30,
    price: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadServices();
    }
  }, [isOpen]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/services');
      const services = response.data as ServiceItem[];
      
      // Split services into provider-specific and clinic-wide
      const providerSpecific = services.filter(
        (s: ServiceItem) => s.providerId === providerId
      );
      setProviderServices(providerSpecific);
      setAllServices(services);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async () => {
    if (!newService.name || !newService.price) {
      setError('Name and price are required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      await api.post('/api/services', {
        name: newService.name,
        description: newService.description,
        durationMinutes: newService.duration,
        price: parseFloat(newService.price),
        providerId, // Assign to this provider
      });

      // Reset form
      setNewService({ name: '', description: '', duration: 30, price: '' });
      setShowAddService(false);
      
      // Reload services
      await loadServices();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create service');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignService = async (serviceId: string) => {
    try {
      setSaving(true);
      setError('');
      
      // Find the service to get its full data
      const service = allServices.find((s: ServiceItem) => s.id === serviceId);
      if (!service) {
        setError('Service not found');
        return;
      }
      
      // Send full service data with updated providerId
      await api.put(`/api/services/${serviceId}`, {
        name: service.name,
        price: service.price,
        description: service.description,
        consultationType: service.consultationType,
        durationMinutes: service.durationMinutes,
        color: service.color,
        providerId, // Assign to this provider
      });
      await loadServices();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign service');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassignService = async (serviceId: string) => {
    try {
      setSaving(true);
      setError('');
      
      // Find the service to get its full data
      const service = providerServices.find((s: ServiceItem) => s.id === serviceId);
      if (!service) {
        setError('Service not found');
        return;
      }
      
      // Send full service data with null providerId to make it clinic-wide
      await api.put(`/api/services/${serviceId}`, {
        name: service.name,
        price: service.price,
        description: service.description,
        consultationType: service.consultationType,
        durationMinutes: service.durationMinutes,
        color: service.color,
        providerId: null, // Make clinic-wide
      });
      await loadServices();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unassign service');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      setSaving(true);
      setError('');
      
      await api.delete(`/api/services/${serviceId}`);
      await loadServices();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete service');
    } finally {
      setSaving(false);
    }
  };

  // Get clinic-wide services that can be assigned
  const availableClinicServices = allServices.filter(
    (s: ServiceItem) => !s.providerId && !providerServices.find((ps) => ps.id === s.id)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Services
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure services for {providerName}
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
              <p className="text-gray-600 mt-2">Loading services...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Provider's Services */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">
                    Assigned Services ({providerServices.length})
                  </h3>
                  <button
                    onClick={() => setShowAddService(true)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Service
                  </button>
                </div>

                {providerServices.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-gray-500">
                      No services assigned yet. Create a new service or assign from clinic services below.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {providerServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{service.name}</h4>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {service.durationMinutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {service.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUnassignService(service.id)}
                            disabled={saving}
                            className="text-sm text-gray-600 hover:text-gray-900"
                          >
                            Unassign
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            disabled={saving}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Service Form */}
              {showAddService && (
                <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="font-medium text-gray-900 mb-3">Create New Service</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Name *
                      </label>
                      <input
                        type="text"
                        value={newService.name}
                        onChange={(e) =>
                          setNewService({ ...newService, name: e.target.value })
                        }
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="e.g., General Consultation"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newService.description}
                        onChange={(e) =>
                          setNewService({ ...newService, description: e.target.value })
                        }
                        className="w-full border rounded-lg px-3 py-2"
                        rows={2}
                        placeholder="Brief description of the service"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (minutes) *
                        </label>
                        <input
                          type="number"
                          value={newService.duration}
                          onChange={(e) =>
                            setNewService({
                              ...newService,
                              duration: parseInt(e.target.value) || 30,
                            })
                          }
                          className="w-full border rounded-lg px-3 py-2"
                          min="5"
                          step="5"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price *
                        </label>
                        <input
                          type="number"
                          value={newService.price}
                          onChange={(e) =>
                            setNewService({ ...newService, price: e.target.value })
                          }
                          className="w-full border rounded-lg px-3 py-2"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={handleCreateService}
                        disabled={saving || !newService.name || !newService.price}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? 'Creating...' : 'Create Service'}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddService(false);
                          setNewService({ name: '', description: '', duration: 30, price: '' });
                        }}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Available Clinic-Wide Services */}
              {availableClinicServices.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    Available Clinic Services
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    These are clinic-wide services. Assign them to this provider.
                  </p>
                  <div className="space-y-2">
                    {availableClinicServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{service.name}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {service.durationMinutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {service.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAssignService(service.id)}
                          disabled={saving}
                          className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50"
                        >
                          <Check className="h-4 w-4" />
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:text-gray-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
