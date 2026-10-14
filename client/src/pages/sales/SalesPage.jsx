import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getSales } from '../../services/saleService';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { useAuth } from '../../context/AuthContext';
import { PlusIcon } from '@heroicons/react/24/outline';

const fmt = (n) => `$${Number(n ?? 0).toFixed(2)}`;
const STATUS_COLORS = { completed: 'badge-green', cancelled: 'badge-red', refunded: 'badge-yellow', pending: 'badge-blue' };

const SalesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { params, page, goToPage } = usePagination({ limit: 20 });
  const { data, loading } = useApi(getSales, params, { deps: [JSON.stringify(params)] });
  const sales = data?.data ?? [];
  const meta  = data?.meta ?? {};

  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <p className="text-slate-500 text-sm">{meta.total ?? 0} sales</p>
        {hasPermission('sales:create') && (
          <button className="btn btn-primary" onClick={() => navigate('/sales/new')}><PlusIcon className="w-4 h-4" /> New Sale</button>
        )}
      </div>
      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead><tr><th>Sale #</th><th>Customer</th><th>Total</th><th>Tax</th><th>Payment</th><th>Status</th><th>Date</th><th></th></tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sales.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-slate-400">No sales found</td></tr>}
                {sales.map(s => (
                  <tr key={s._id} className="cursor-pointer" onClick={() => navigate(`/sales/${s._id}`)}>
                    <td className="text-primary-600 font-medium">{s.saleNumber}</td>
                    <td>{s.customer?.name ?? 'Walk-in'}</td>
                    <td className="font-semibold">{fmt(s.totalAmount)}</td>
                    <td>{fmt(s.taxAmount)}</td>
                    <td className="capitalize">{s.paymentMethod?.replace('_', ' ')}</td>
                    <td><span className={STATUS_COLORS[s.status] ?? 'badge-gray'}>{s.status}</span></td>
                    <td className="text-slate-400">{s.saleDate ? format(new Date(s.saleDate), 'MMM d, yyyy') : '-'}</td>
                    <td onClick={e => e.stopPropagation()}><button className="text-xs text-primary-600 hover:underline" onClick={() => navigate(`/sales/${s._id}`)}>View</button></td>
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
export default SalesPage;
