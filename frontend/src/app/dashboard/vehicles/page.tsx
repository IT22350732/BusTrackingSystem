'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Vehicle, VehicleFormData, VehicleStatus } from '@/types';
import styles from './vehicles.module.css';
import '../../../components/ui/ui.css';

// Format date for display
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Status badge class
function getStatusClass(status: VehicleStatus): string {
  switch (status) {
    case 'Active': return 'active';
    case 'Inactive': return 'inactive';
    case 'Maintenance': return 'maintenance';
    default: return 'inactive';
  }
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<VehicleFormData>({
    busNumber: '',
    routeName: '',
    gpsDeviceId: '',
    deviceModel: '',
    status: 'Active',
  });

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    try {
      const data = await api.getVehicles();
      setVehicles(data);
    } catch (err) {
      setError('Failed to load vehicles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Open modal for add
  const handleAdd = () => {
    setEditingVehicle(null);
    setFormData({
      busNumber: '',
      routeName: '',
      gpsDeviceId: '',
      deviceModel: '',
      status: 'Active',
    });
    setFormError('');
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      busNumber: vehicle.busNumber,
      routeName: vehicle.routeName,
      gpsDeviceId: vehicle.gpsDeviceId,
      deviceModel: vehicle.deviceModel || '',
      status: vehicle.status,
    });
    setFormError('');
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      if (editingVehicle) {
        await api.updateVehicle(editingVehicle.id, formData);
      } else {
        await api.createVehicle(formData);
      }
      setShowModal(false);
      await fetchVehicles();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  // Handle deactivate
  const handleDeactivate = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this vehicle?')) return;

    try {
      await api.deleteVehicle(id);
      await fetchVehicles();
    } catch (err) {
      console.error('Failed to deactivate vehicle:', err);
    }
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter(
    (v) =>
      v.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.gpsDeviceId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: 'unset', flex: 1 }}>
        <div className="spinner" />
        <p>Loading vehicles...</p>
      </div>
    );
  }

  return (
    <div className={styles['vehicles-page']}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Vehicle Management</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Add, edit, and manage your fleet vehicles
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          ➕ Add Vehicle
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles['vehicles-toolbar']}>
        <input
          type="text"
          className={`form-input ${styles['vehicles-search']}`}
          placeholder="🔍 Search by bus number, route, or device ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''}
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* Table */}
      <div className={styles['vehicles-table-wrapper']}>
        {filteredVehicles.length === 0 ? (
          <div className={styles['vehicles-empty']}>
            <div className={styles['empty-icon']}>🚌</div>
            <p>{searchQuery ? 'No vehicles match your search' : 'No vehicles registered yet'}</p>
            {!searchQuery && (
              <button className="btn btn-primary btn-sm" onClick={handleAdd}>
                Add Your First Vehicle
              </button>
            )}
          </div>
        ) : (
          <table className={styles['vehicles-table']}>
            <thead>
              <tr>
                <th>Bus Number</th>
                <th>Route</th>
                <th className="hide-mobile">GPS Device ID</th>
                <th className="hide-mobile">Device Model</th>
                <th>Status</th>
                <th className="hide-mobile">Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>
                    <span className={styles['bus-number-cell']}>{vehicle.busNumber}</span>
                  </td>
                  <td>{vehicle.routeName}</td>
                  <td className="hide-mobile">
                    <span className={styles['device-id-cell']}>{vehicle.gpsDeviceId}</span>
                  </td>
                  <td className="hide-mobile">{vehicle.deviceModel || '—'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(vehicle.status)}`}>
                      <span className="dot" />
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="hide-mobile">{formatDate(vehicle.updatedAt)}</td>
                  <td>
                    <div className={styles['actions-cell']}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleEdit(vehicle)}
                        title="Edit vehicle"
                      >
                        ✏️
                      </button>
                      {vehicle.status !== 'Inactive' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDeactivate(vehicle.id)}
                          title="Deactivate vehicle"
                          style={{ color: 'var(--color-danger)' }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingVehicle ? '✏️ Edit Vehicle' : '➕ Add New Vehicle'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-error" style={{ marginBottom: 'var(--space-lg)' }}>
                    ⚠️ {formError}
                  </div>
                )}

                <div className={styles['vehicle-form']}>
                  <div className={styles['form-row']}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="busNumber">Bus Number *</label>
                      <input
                        id="busNumber"
                        type="text"
                        className="form-input"
                        placeholder="e.g. NB-2547"
                        value={formData.busNumber}
                        onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="status">Status *</label>
                      <select
                        id="status"
                        className="form-select"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Maintenance">Under Maintenance</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="routeName">Route Name *</label>
                    <input
                      id="routeName"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Colombo – Kandy"
                      value={formData.routeName}
                      onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles['form-row']}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="gpsDeviceId">GPS Device ID *</label>
                      <input
                        id="gpsDeviceId"
                        type="text"
                        className="form-input"
                        placeholder="e.g. TRK-006-SIM"
                        value={formData.gpsDeviceId}
                        onChange={(e) => setFormData({ ...formData, gpsDeviceId: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="deviceModel">Device Model</label>
                      <input
                        id="deviceModel"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Teltonika FMB920"
                        value={formData.deviceModel || ''}
                        onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                      Saving...
                    </>
                  ) : editingVehicle ? (
                    'Save Changes'
                  ) : (
                    'Add Vehicle'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
