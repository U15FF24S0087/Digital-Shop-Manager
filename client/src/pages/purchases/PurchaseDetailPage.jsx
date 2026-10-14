import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getPurchaseById } from '../../services/purchaseService';
import useApi from '../../hooks/useApi';
import { PageSpinner } from '../../components/ui/Spinner';

const fmt = (n) => `$${Number(n ?? 0).toFixed(2)}`;
const STATUS_COLORS = { received: 'badge-green', cancelled: 'badge-red', partial: 'badge-yellow', pending: 'badge-blue' };

const PurchaseDetailPage = () => {
  const { id } = useParams(); const navigate = useNavigate();
  const { data, loading } = useApi(() => getPurchaseById(id), {}, { deps: [id] });
  const purchase = data?.data;
  const items    = purchase?.items ?? [];

  if (loading) return <PageSpinner />;
  if (!purchase) return <p className="text-slate-500">Purchase not found.</p>;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{purchase.purchaseNumber}</h2>
          <p className="text-slate-400 text-sm">{purchase.purchaseDate ? format(new Date(purchase.purchaseDate), 'MMMM d, yyyy') : ''}</p>
        </div>
        <span className={STATUS_COLORS[purchase.status] ?? 'badge-gray'}>{purchase.status}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="card"><p className="text-xs text-slate-400 uppercase mb-1">Supplier</p><p className="font-medium">{purchase.supplier?.name}</p><p className="text-sm text-slate-400">{purchase.supplier?.email}</p></div>
        <div className="card"><p className="text-xs text-slate-400 uppercase mb-1">Purchased By</p><p className="font-medium">{purchase.purchasedBy?.name}</p><p className="text-sm text-slate-400 capitalize">{purchase.paymentMethod?.replace('_',' ')}</p></div>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="table">
          <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Cost</th><th>Line Total</th></tr></thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map(i => (<tr key={i._id}><td>{i.productName}</td><td className="font-mono text-xs">{i.productSku}</td><td>{i.quantity}</td><td>{fmt(i.unitCost)}</td><td className="font-semibold">{fmt(i.lineTotal)}</td></tr>))}
          </tbody>
        </table>
        <div className="px-6 py-4 bg-slate-50 space-y-1 text-sm text-right">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{fmt(purchase.subtotal)}</span></div>
          {purchase.discountAmount > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>-{fmt(purchase.discountAmount)}</span></div>}
          {purchase.taxAmount > 0 && <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{fmt(purchase.taxAmount)}</span></div>}
          <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2"><span>Total</span><span>{fmt(purchase.totalAmount)}</span></div>
        </div>
      </div>
      <button className="btn btn-secondary" onClick={() => navigate('/purchases')}>← Back</button>
    </div>
  );
};
export default PurchaseDetailPage;
