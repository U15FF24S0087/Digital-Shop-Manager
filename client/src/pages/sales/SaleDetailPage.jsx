import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getSaleById, updateSaleStatus } from '../../services/saleService';
import useApi from '../../hooks/useApi';
import { PageSpinner } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const fmt = (n) => `$${Number(n ?? 0).toFixed(2)}`;
const STATUS_COLORS = { completed: 'badge-green', cancelled: 'badge-red', refunded: 'badge-yellow', pending: 'badge-blue' };

const SaleDetailPage = () => {
  const { id } = useParams(); const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { data, loading, refetch } = useApi(() => getSaleById(id), {}, { deps: [id] });
  const [updating, setUpdating] = useState(false);
  const sale  = data?.data;
  const items = sale?.items ?? [];

  const handleStatus = async (status) => {
    if (!window.confirm(`Mark this sale as "${status}"?`)) return;
    setUpdating(true);
    try { await updateSaleStatus(id, { status }); toast.success('Status updated'); refetch(); }
    catch { } finally { setUpdating(false); }
  };

  if (loading) return <PageSpinner />;
  if (!sale)   return <p className="text-slate-500">Sale not found.</p>;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{sale.saleNumber}</h2>
          <p className="text-slate-400 text-sm">{sale.saleDate ? format(new Date(sale.saleDate), 'MMMM d, yyyy') : ''}</p>
        </div>
        <span className={STATUS_COLORS[sale.status] ?? 'badge-gray'}>{sale.status}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-xs text-slate-400 uppercase mb-1">Customer</p>
          <p className="font-medium">{sale.customer?.name ?? 'Walk-in'}</p>
          {sale.customer?.email && <p className="text-sm text-slate-400">{sale.customer.email}</p>}
        </div>
        <div className="card">
          <p className="text-xs text-slate-400 uppercase mb-1">Sold By</p>
          <p className="font-medium">{sale.soldBy?.name}</p>
          <p className="text-sm text-slate-400 capitalize">{sale.paymentMethod?.replace('_',' ')}</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="table">
          <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Disc</th><th>Line Total</th></tr></thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map(i => (
              <tr key={i._id}>
                <td>{i.productName}</td>
                <td className="font-mono text-xs">{i.productSku}</td>
                <td>{i.quantity}</td>
                <td>{fmt(i.unitPrice)}</td>
                <td>{i.discountPercent > 0 ? `${i.discountPercent}%` : '—'}</td>
                <td className="font-semibold">{fmt(i.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-6 py-4 bg-slate-50 space-y-1 text-sm text-right">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{fmt(sale.subtotal)}</span></div>
          {sale.discountAmount > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>-{fmt(sale.discountAmount)}</span></div>}
          <div className="flex justify-between"><span className="text-slate-500">Tax ({sale.taxRate}%)</span><span>{fmt(sale.taxAmount)}</span></div>
          <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2"><span>Total</span><span>{fmt(sale.totalAmount)}</span></div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="btn btn-secondary" onClick={() => navigate('/sales')}>← Back</button>
        {hasPermission('sales:update') && sale.status === 'completed' && (
          <>
            <button disabled={updating} className="btn btn-secondary" onClick={() => handleStatus('refunded')}>Mark Refunded</button>
            <button disabled={updating} className="btn btn-danger" onClick={() => handleStatus('cancelled')}>Cancel Sale</button>
          </>
        )}
      </div>
    </div>
  );
};
export default SaleDetailPage;
