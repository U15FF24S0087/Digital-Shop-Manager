import { useState } from 'react';
import toast from 'react-hot-toast';
import { getUsers, toggleUserStatus, deleteUser } from '../../services/userService';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const UsersPage = () => {
  const { params, page, handleSearch, goToPage } = usePagination({ limit: 20 });
  const [search, setSearch] = useState('');
  const { data, loading, refetch } = useApi(getUsers, params, { deps: [JSON.stringify(params)] });
  const users = data?.data ?? [];
  const meta  = data?.meta ?? {};

  const handleToggle = async (id, name, isActive) => {
    if (!window.confirm(`${isActive ? 'Deactivate' : 'Activate'} "${name}"?`)) return;
    try { await toggleUserStatus(id); toast.success(`User ${isActive ? 'deactivated' : 'activated'}`); refetch(); } catch { }
  };
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}"?`)) return;
    try { await deleteUser(id); toast.success('User deleted'); refetch(); } catch { }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search name, email…" value={search}
            onChange={e => { setSearch(e.target.value); handleSearch(e.target.value); }} />
        </div>
      </div>
      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th></th></tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-slate-400">No users</td></tr>}
                {users.map(u => (
                  <tr key={u._id}>
                    <td className="font-medium">{u.name}</td>
                    <td className="text-slate-500">{u.email}</td>
                    <td><span className="badge-blue">{u.role?.name}</span></td>
                    <td><span className={u.isActive ? 'badge-green' : 'badge-gray'}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-slate-400 text-xs">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                    <td><div className="flex gap-2">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleToggle(u._id, u.name, u.isActive)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id, u.name)}>Delete</button>
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
export default UsersPage;
