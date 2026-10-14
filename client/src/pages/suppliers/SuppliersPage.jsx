import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSuppliers, deleteSupplier } from '../../services/supplierService';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { useAuth } from '../../context/AuthContext';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon } from '@heroicons/react/24/outline';

const SuppliersPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { params, page, handleSearch, goToPage } = usePagination({ limit: 20 });
  const [search, setSearch] = useState('');
  const { data, loading, refetch } = useApi(getSuppliers, params, { deps: [JSON.stringify(params)] });
  const suppliers = data?.data ?? [];
  const meta = data?.meta ?? {};

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    try { await deleteSupplier(id); toast.success('Supplier deactivated'); refetch(); } catch { }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search name…" value={search}
            onChange={e => { setSearch(e.target.value); handleSearch(e.target.value); }} />
        </div>
        {hasPermission('suppliers:create') && (
          <button className="btn btn-primary" onClick={() => navigate('/suppliers/new')}><PlusIcon className="w-4 h-4" /> New Supplier</button>
        )}
      </div>
      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead><tr><th>Name</th><th>Contact Person</th><th>Email</th><th>Phone</th><th>Status</th><th></th></tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {suppliers.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-slate-400">No suppliers</td></tr>}
                {suppliers.map(s => (
                  <tr key={s._id}>
                    <td className="font-medium">{s.name}</td>
                    <td>{s.contactPerson || '—'}</td>
                    <td className="text-slate-500">{s.email || '—'}</td>
                    <td className="text-slate-500">{s.phone || '—'}</td>
                    <td><span className={s.isActive ? 'badge-green' : 'badge-gray'}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td><div className="flex gap-2">
                      {hasPermission('suppliers:update') && <button className="btn btn-secondary btn-sm btn-icon" onClick={() => navigate(`/suppliers/${s._id}/edit`)}><PencilIcon className="w-4 h-4" /></button>}
                      {hasPermission('suppliers:delete') && s.isActive && <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(s._id, s.name)}>Deactivate</button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={meta.totalPages ?? 1} onPageChange={goToPage} />
        </div>
      )}
    </div>
  );
};
export default SuppliersPage;
