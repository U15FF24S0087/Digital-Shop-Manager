import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getPurchases } from '../../services/purchaseService';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { useAuth } from '../../context/AuthContext';
import { PlusIcon } from '@heroicons/react/24/outline';

const fmt = (n) => `$${Number(n ?? 0).toFixed(2)}`;
const STATUS_COLORS = { received: 'badge-green', cancelled: 'badge-red', partial: 'badge-yellow', pending: 'badge-blue' };

const PurchasesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { params, page, goToPage } = usePagination({ limit: 20 });
  const { data, loading } = useApi(getPurchases, params, { deps: [JSON.stringify(params)] });
  const purchases = data?.data ?? [];
  const meta = data?.meta ?? {};

  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <p className="text-slate-500 text-sm">{meta.total ?? 0} purchase orders</p>
        {hasPermission('purchases:create') && (
          <button className="btn btn-primary" onClick={() => navigate('/purchases/new')}><PlusIcon className="w-4 h-4" /> New Purchase</button>
        )}
      </div>
      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead><tr><th>PO #</th><th>Supplier</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th></th></tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {purchases.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400">No purchases</td></tr>}
                {purchases.map(p => (
                  <tr key={p._id} className="cursor-pointer" onClick={() => navigate(`/purchases/${p._id}`)}>
                    <td className="text-primary-600 font-medium">{p.purchaseNumber}</td>
                    <td>{p.supplier?.name}</td>
                    <td className="font-semibold">{fmt(p.totalAmount)}</td>
                    <td className="capitalize">{p.paymentMethod?.replace('_',' ')}</td>
                    <td><span className={STATUS_COLORS[p.status] ?? 'badge-gray'}>{p.status}</span></td>
                    <td className="text-slate-400">{p.purchaseDate ? format(new Date(p.purchaseDate), 'MMM d, yyyy') : '-'}</td>
                    <td onClick={e => e.stopPropagation()}><button className="text-xs text-primary-600 hover:underline" onClick={() => navigate(`/purchases/${p._id}`)}>View</button></td>
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
export default PurchasesPage;
