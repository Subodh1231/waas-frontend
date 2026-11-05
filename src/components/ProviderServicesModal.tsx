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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-0 sm:p-4">
      <div className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-white shadow-xl sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b p-4 sm:p-6">
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
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-medium text-gray-900">
                    Assigned Services ({providerServices.length})
                  </h3>
                  <button
                    onClick={() => setShowAddService(true)}
                    className="flex min-h-11 items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
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
                        className="flex flex-col gap-3 rounded-lg border p-4 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{service.name}</h4>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {service.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
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
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => handleUnassignService(service.id)}
                            disabled={saving}
                            className="min-h-11 px-2 text-sm text-gray-600 hover:text-gray-900"
                          >
                            Unassign
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            disabled={saving}
                            className="flex min-h-11 min-w-11 items-center justify-center text-red-600 hover:text-red-700"
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

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

                    <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
                      <button
                        onClick={handleCreateService}
                        disabled={saving || !newService.name || !newService.price}
                        className="min-h-11 w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
                      >
                        {saving ? 'Creating...' : 'Create Service'}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddService(false);
                          setNewService({ name: '', description: '', duration: 30, price: '' });
                        }}
                        className="min-h-11 w-full px-4 py-2 text-gray-700 hover:text-gray-900 sm:w-auto"
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
                        className="flex flex-col gap-3 rounded-lg border p-4 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{service.name}</h4>
                          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-500">
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
                          className="flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-blue-600 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 sm:w-auto"
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
        <div className="flex justify-end border-t bg-gray-50 p-4 sm:p-6">
          <button
            onClick={onClose}
            className="min-h-11 w-full px-6 py-2 text-gray-700 hover:text-gray-900 sm:w-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
