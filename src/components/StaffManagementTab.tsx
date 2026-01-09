import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';
import { listStaff, createStaff, updateStaff, deactivateStaff, type Staff, type CreateStaffRequest } from '../lib/api';
import ProviderServicesModal from './ProviderServicesModal';
import ProviderAvailabilityModal from './ProviderAvailabilityModal';

export default function StaffManagementTab() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Provider modals
  const [servicesModalProvider, setServicesModalProvider] = useState<Staff | null>(null);
  const [availabilityModalProvider, setAvailabilityModalProvider] = useState<Staff | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateStaffRequest>({
    name: '',
    role: 'DOCTOR',
    email: '',
    phone: '',
    qualifications: '',
    specialization: '',
    isActive: true,
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await listStaff();
      setStaff(data);
    } catch (err) {
      console.error('Failed to load staff:', err);
      setError('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, formData);
        setSuccess('Staff member updated successfully');
      } else {
        await createStaff(formData);
        setSuccess('Staff member added successfully');
      }
      
      await loadStaff();
      handleCloseModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save staff member');
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      role: staffMember.role,
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      qualifications: staffMember.qualifications || '',
      specialization: staffMember.specialization || '',
      isActive: staffMember.isActive,
    });
    setShowAddModal(true);
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) return;

    try {
      await deactivateStaff(id);
      setSuccess('Staff member deactivated');
      await loadStaff();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate staff member');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingStaff(null);
    setFormData({
      name: '',
      role: 'DOCTOR',
      email: '',
      phone: '',
      qualifications: '',
      specialization: '',
      isActive: true,
    });
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      DOCTOR: 'bg-blue-100 text-blue-800',
      NURSE: 'bg-green-100 text-green-800',
      THERAPIST: 'bg-purple-100 text-purple-800',
      RECEPTIONIST: 'bg-yellow-100 text-yellow-800',
      ADMIN: 'bg-red-100 text-red-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage your clinic's doctors, nurses, and staff members
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          {success}
        </div>
      )}

      {/* Staff List */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading staff...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No staff members added yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first staff member
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {staff.map((member) => (
              <div
                key={member.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-gray-900">{member.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                      {member.isActive ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <UserCheck className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <UserX className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    {member.specialization && (
                      <p className="text-sm text-gray-600 mt-1">{member.specialization}</p>
                    )}
                    
                    {member.qualifications && (
                      <p className="text-sm text-gray-500 mt-1">{member.qualifications}</p>
                    )}
                    
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      {member.email && <span>📧 {member.email}</span>}
                      {member.phone && <span>📱 {member.phone}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <button
                        onClick={() => setServicesModalProvider(member)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Manage Services
                      </button>
                      <span className="text-gray-300">•</span>
                      <button
                        onClick={() => setAvailabilityModalProvider(member)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Set Availability
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(member)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {member.isActive && (
                      <button
                        onClick={() => handleDeactivate(member.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Deactivate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="DOCTOR">Doctor</option>
                    <option value="NURSE">Nurse</option>
                    <option value="THERAPIST">Therapist</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g., Cardiologist, General Physician"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualifications
                  </label>
                  <input
                    type="text"
                    value={formData.qualifications}
                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                    placeholder="e.g., MBBS, MD"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Active (can accept appointments)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingStaff ? 'Update' : 'Add'} Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Provider Services Modal */}
      {servicesModalProvider && (
        <ProviderServicesModal
          isOpen={true}
          onClose={() => setServicesModalProvider(null)}
          providerId={servicesModalProvider.id}
          providerName={servicesModalProvider.name}
        />
      )}
      
      {/* Provider Availability Modal */}
      {availabilityModalProvider && (
        <ProviderAvailabilityModal
          isOpen={true}
          onClose={() => setAvailabilityModalProvider(null)}
          providerId={availabilityModalProvider.id}
          providerName={availabilityModalProvider.name}
        />
      )}
    </div>
  );
}
