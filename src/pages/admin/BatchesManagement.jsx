import { useState, useEffect } from 'react';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import { PlusCircle, Edit3, Save, Layers, Copy, Check, Power, RefreshCw, Trash2 } from 'lucide-react';

const generateUniqueCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BATCH-${randomStr}`;
};

export default function BatchesManagement() {
  const [batchesList, setBatchesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editBatch, setEditBatch] = useState(null);
  const [deleteConfirmBatch, setDeleteConfirmBatch] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Forms state
  const [createForm, setCreateForm] = useState({ batchName: '', inviteCode: '', description: '', startYear: '', endYear: '' });
  const [editForm, setEditForm] = useState({ batchName: '', inviteCode: '', description: '', isActive: true, startYear: '', endYear: '' });

  const token = localStorage.getItem('crms_token');

  const handleOpenCreate = () => {
    setCreateForm({
      batchName: '',
      inviteCode: generateUniqueCode(),
      description: '',
      startYear: '',
      endYear: ''
    });
    setIsCreateOpen(true);
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/batches', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch batches');
      }
      setBatchesList(data.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (parseInt(createForm.startYear, 10) >= parseInt(createForm.endYear, 10)) {
      alert('Start year must be less than end year');
      return;
    }
    try {
      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create batch');
      }
      alert('Batch created successfully!');
      setIsCreateOpen(false);
      setCreateForm({ batchName: '', inviteCode: '', description: '', startYear: '', endYear: '' });
      fetchBatches();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditClick = (batch) => {
    setEditBatch(batch);
    setEditForm({
      batchName: batch.batchName || '',
      inviteCode: batch.inviteCode || '',
      description: batch.description || '',
      isActive: batch.isActive !== undefined ? batch.isActive : true,
      startYear: batch.startYear || '',
      endYear: batch.endYear || '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (parseInt(editForm.startYear, 10) >= parseInt(editForm.endYear, 10)) {
      alert('Start year must be less than end year');
      return;
    }
    try {
      const res = await fetch(`/api/admin/batches/${editBatch._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update batch');
      }
      alert('Batch updated successfully!');
      setEditBatch(null);
      fetchBatches();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleDeactivate = async (batch) => {
    const isDeactivating = batch.isActive;
    const confirmMessage = isDeactivating
      ? `Are you sure you want to deactivate batch "${batch.batchName}"? Inactive batches cannot accept new students.`
      : `Reactivate batch "${batch.batchName}"?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      let res;
      if (isDeactivating) {
        // Call Patch Deactivate
        res = await fetch(`/api/admin/batches/${batch._id}/deactivate`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } else {
        // Call Put update with isActive: true
        res = await fetch(`/api/admin/batches/${batch._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: true }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Action failed');
      }

      alert(`Batch ${isDeactivating ? 'deactivated' : 'reactivated'} successfully!`);
      fetchBatches();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteBatch = async () => {
    if (!deleteConfirmBatch) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/admin/batches/${deleteConfirmBatch._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete batch');
      }

      setDeleteConfirmBatch(null);
      alert('Batch and all registered students deleted successfully!');
      fetchBatches();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      header: 'Batch Name',
      accessor: 'batchName',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white shrink-0">
            <Layers size={16} />
          </div>
          <div>
            <p className="font-bold text-surface-900 dark:text-white text-sm">{row.batchName}</p>
            <p className="text-[11px] text-surface-400 max-w-[200px] truncate">{row.description || 'No description'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Academic Year',
      accessor: 'canonicalBatch',
      render: (row) => (
        <span className="font-semibold text-surface-800 dark:text-surface-200 text-sm">
          {row.canonicalBatch || `${row.startYear}-${row.endYear}`}
        </span>
      ),
    },
    {
      header: 'Invite Code',
      accessor: 'inviteCode',
      render: (row) => (
        <div className="flex items-center gap-2">
          <code className="px-2.5 py-1 bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 text-xs font-semibold rounded-md border border-surface-200/50 dark:border-surface-700/50 select-all font-mono">
            {row.inviteCode}
          </code>
          <button
            onClick={() => handleCopyCode(row.inviteCode, row._id)}
            className="p-1 rounded-md text-surface-400 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            title="Copy Invite Code"
          >
            {copiedId === row._id ? <Check size={13} className="text-success-500" /> : <Copy size={13} />}
          </button>
        </div>
      ),
    },
    {
      header: 'Registered Status',
      accessor: 'isActive',
      render: (row) => (
        <StatusBadge status={row.isActive ? 'Active' : 'Inactive'} />
      ),
    },
  ];

  if (loading && batchesList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-surface-400 text-sm">Loading batches...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Batch Management</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">{batchesList.length} total academic batches</p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary">
          <PlusCircle size={16} /> Create New Batch
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Batches Table */}
      <DataTable
        columns={columns}
        data={batchesList}
        searchPlaceholder="Search batches..."
        actions={(row) => (
          <>
            <button
              onClick={() => handleEditClick(row)}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              title="Edit Batch Details"
            >
              <Edit3 size={15} className="text-primary-500" />
            </button>
            <button
              onClick={() => toggleDeactivate(row)}
              className={`p-2 rounded-lg transition-colors ${
                row.isActive
                  ? 'hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500'
                  : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-500'
              }`}
              title={row.isActive ? 'Deactivate Batch' : 'Reactivate Batch'}
            >
              <Power size={15} />
            </button>
            <button
              onClick={() => setDeleteConfirmBatch(row)}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors"
              title="Delete Batch"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      />

      {/* Create Batch Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Batch" size="md">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="input-label">Batch Name *</label>
            <input
              type="text"
              placeholder="e.g. CSE Final Year"
              value={createForm.batchName}
              onChange={(e) => setCreateForm({ ...createForm, batchName: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Start Year *</label>
              <input
                type="number"
                placeholder="e.g. 2023"
                value={createForm.startYear}
                onChange={(e) => setCreateForm({ ...createForm, startYear: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="input-label">End Year *</label>
              <input
                type="number"
                placeholder="e.g. 2027"
                value={createForm.endYear}
                onChange={(e) => setCreateForm({ ...createForm, endYear: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>
          <div>
            <label className="input-label">Invitation Code *</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. GEU2327"
                value={createForm.inviteCode}
                onChange={(e) => setCreateForm({ ...createForm, inviteCode: e.target.value })}
                className="input-field uppercase font-mono flex-1"
                required
              />
              <button
                type="button"
                onClick={() => setCreateForm({ ...createForm, inviteCode: generateUniqueCode() })}
                className="btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 shrink-0"
                title="Regenerate unique code"
              >
                <RefreshCw size={14} /> Generate
              </button>
            </div>
            <p className="text-[11px] text-surface-400 mt-1">Students will enter this code during signup to auto-map to this batch.</p>
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea
              placeholder="e.g. CSE Engineering Batch graduating in 2027"
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="input-field resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-2.5">
              Create Batch
            </button>
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Batch Modal */}
      <Modal isOpen={!!editBatch} onClose={() => setEditBatch(null)} title="Edit Batch Details" size="md">
        {editBatch && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="input-label">Batch Name *</label>
              <input
                type="text"
                value={editForm.batchName}
                onChange={(e) => setEditForm({ ...editForm, batchName: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Start Year *</label>
                <input
                  type="number"
                  value={editForm.startYear}
                  onChange={(e) => setEditForm({ ...editForm, startYear: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="input-label">End Year *</label>
                <input
                  type="number"
                  value={editForm.endYear}
                  onChange={(e) => setEditForm({ ...editForm, endYear: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>
            <div>
              <label className="input-label">Invitation Code *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editForm.inviteCode}
                  onChange={(e) => setEditForm({ ...editForm, inviteCode: e.target.value })}
                  className="input-field uppercase font-mono flex-1"
                  required
                />
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, inviteCode: generateUniqueCode() })}
                  className="btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 shrink-0"
                  title="Generate new unique code"
                >
                  <RefreshCw size={14} /> Generate
                </button>
              </div>
            </div>
            <div>
              <label className="input-label">Description</label>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="input-field resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="editIsActive"
                checked={editForm.isActive}
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-surface-300 text-primary-500"
              />
              <label htmlFor="editIsActive" className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Active & Accepting Registrations
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1 py-2.5">
                <Save size={16} /> Save Changes
              </button>
              <button type="button" onClick={() => setEditBatch(null)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmBatch}
        onClose={() => setDeleteConfirmBatch(null)}
        title="Confirm Batch Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
            Are you sure you want to delete the batch <strong className="text-surface-900 dark:text-white">{deleteConfirmBatch?.batchName}</strong>?
          </p>
          <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-800 leading-normal">
            <strong>Warning:</strong> You will permanently lose all registered students in this batch and their application/profile history. This action is irreversible.
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDeleteBatch}
              disabled={deleteLoading}
              className="btn-primary bg-red-600 hover:bg-red-500 text-white flex-1"
            >
              {deleteLoading ? 'Deleting...' : 'Delete Batch'}
            </button>
            <button
              onClick={() => setDeleteConfirmBatch(null)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
