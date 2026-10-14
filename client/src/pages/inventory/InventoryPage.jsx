import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getStock, getLowStock, adjustStock } from '../../services/inventoryService';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { ExclamationTriangleIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

const InventoryPage = () => {
  const { hasPermission } = useAuth();
  const { params, page, goToPage } = usePagination({ limit: 20 });
  const [tab, setTab] = useState('all'); // 'all' | 'low'
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const allParams = { ...params, ...(tab === 'low' ? { lowStock: true } : {}) };
  const { data, loading, refetch } = useApi(getStock, allParams, { deps: [JSON.stringify(allParams)] });
  const { data: lowData } = useApi(getLowStock, {}, { deps: [] });

  const products   = data?.data ?? [];
  const meta       = data?.meta ?? {};
  const lowCount   = lowData?.data?.length ?? 0;

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onAdjust = async (data) => {
    setSaving(true);
    try {
      await adjustStock({ product: data.product, type: data.type, quantityChange: Number(data.quantityChange), notes: data.notes });
      toast.success('Stock adjusted');
      setModal(false); reset(); refetch();
    } catch { } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button className={`btn btn-sm ${tab === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('all')}>All Stock</button>
          <button className={`btn btn-sm ${tab === 'low' ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setTab('low')}>
            <ExclamationTriangleIcon className="w-4 h-4" /> Low Stock {lowCount > 0 && <span className="ml-1 bg-red-100 text-red-700 rounded-full px-1.5">{lowCount}</span>}
          </button>
        </div>
        {hasPermission('inventory:adjust') && (
          <button className="btn btn-primary" onClick={() => setModal(true)}><AdjustmentsHorizontalIcon className="w-4 h-4" /> Adjust Stock</button>
        )}
      </div>

      {loading ? <PageSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Threshold</th><th>Unit</th><th>Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {products.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400">No products</td></tr>}
                {products.map(p => {
                  const isLow = p.stock <= p.lowStockThreshold;
                  return (
                    <tr key={p._id}>
                      <td className="font-medium">{p.name}</td>
                      <td className="font-mono text-xs text-slate-500">{p.sku}</td>
                      <td>{p.category?.name ?? '—'}</td>
                      <td className={isLow ? 'text-red-600 font-bold' : 'font-medium'}>{p.stock}</td>
                      <td>{p.lowStockThreshold}</td>
                      <td>{p.unit}</td>
                      <td>{p.stock === 0 ? <span className="badge-red">Out of Stock</span> : isLow ? <span className="badge-yellow">Low Stock</span> : <span className="badge-green">In Stock</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={meta.totalPages ?? 1} onPageChange={goToPage} />
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Adjust Stock">
        <form onSubmit={handleSubmit(onAdjust)} className="space-y-4">
          <div>
            <label className="label">Product *</label>
            <select className="input" {...register('product', { required: 'Required' })}>
              <option value="">Select product</option>
              {(data?.data ?? []).map(p => <option key={p._id} value={p._id}>{p.name} (stock: {p.stock})</option>)}
            </select>
            {errors.product && <p className="field-error">{errors.product.message}</p>}
          </div>
          <div>
            <label className="label">Adjustment Type *</label>
            <select className="input" {...register('type', { required: 'Required' })}>
              {['adjustment','return_in','return_out','damage'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quantity Change * (positive = add, negative = remove)</label>
            <input type="number" className="input" {...register('quantityChange', { required: 'Required', validate: v => v != 0 || 'Cannot be zero' })} />
            {errors.quantityChange && <p className="field-error">{errors.quantityChange.message}</p>}
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} {...register('notes')} /></div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving…' : 'Apply'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default InventoryPage;
