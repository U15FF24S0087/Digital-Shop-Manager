import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getCustomers, deleteCustomer } from '../../services/customerService';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { useAuth } from '../../context/AuthContext';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon } from '@heroicons/react/24/outline';

const CustomersPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { params, page, handleSearch, goToPage } = usePagination({ limit: 20 });
  const [search, setSearch] = useState('');
  const { data, loading, refetch } = useApi(getCustomers, params, { deps: [JSON.stringify(params)] });
  const customers = data?.data ?? [];
  const meta = data?.meta ?? {};

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    try { await deleteCustomer(id); toast.success('Customer deactivated'); refetch(); } catch { }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search name, email…" value={search}
            onChange={e => { setSearch(e.target.value); handleSearch(e.target.value); }} />
        </div>
        {hasPermission('customers:create') && (
          <button className="btn btn-primary" onClick={() => navigate('/customers/new')}><PlusIcon className="w-4 h-4" /> New Customer</button>
        )}
      </div>
      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th></th></tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {customers.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-400">No customers</td></tr>}
                {customers.map(c => (
                  <tr key={c._id}>
                    <td className="font-medium">{c.name}</td>
                    <td className="text-slate-500">{c.email || '—'}</td>
                    <td className="text-slate-500">{c.phone || '—'}</td>
                    <td><span className={c.isActive ? 'badge-green' : 'badge-gray'}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td><div className="flex gap-2">
                      {hasPermission('customers:update') && <button className="btn btn-secondary btn-sm btn-icon" onClick={() => navigate(`/customers/${c._id}/edit`)}><PencilIcon className="w-4 h-4" /></button>}
                      {hasPermission('customers:delete') && c.isActive && <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(c._id, c.name)}>Deactivate</button>}
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
export default CustomersPage;
