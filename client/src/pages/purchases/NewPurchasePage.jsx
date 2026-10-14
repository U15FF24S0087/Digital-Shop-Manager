import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { createPurchase } from '../../services/purchaseService';
import { getProducts } from '../../services/productService';
import { getAllSuppliers } from '../../services/supplierService';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const fmt = (n) => `$${Number(n ?? 0).toFixed(2)}`;

const NewPurchasePage = () => {
  const navigate = useNavigate();
  const [products,  setProducts]  = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [saving,    setSaving]    = useState(false);

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { supplier: '', paymentMethod: 'cash', discountAmount: 0, taxAmount: 0, notes: '',
      items: [{ product: '', quantity: 1, unitCost: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');
  const watchDisc  = watch('discountAmount');
  const watchTax   = watch('taxAmount');

  useEffect(() => {
    getProducts({ limit: 100, isActive: true }).then(r => setProducts(r.data.data ?? []));
    getAllSuppliers().then(r => setSuppliers(r.data.data ?? []));
  }, []);

  const subtotal = (watchItems || []).reduce((s, i) => s + (Number(i.unitCost) * Number(i.quantity)), 0);
  const total    = subtotal - Number(watchDisc || 0) + Number(watchTax || 0);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await createPurchase({
        supplier: data.supplier, paymentMethod: data.paymentMethod,
        discountAmount: Number(data.discountAmount), taxAmount: Number(data.taxAmount),
        notes: data.notes,
        items: data.items.map(i => ({ product: i.product, quantity: Number(i.quantity), unitCost: Number(i.unitCost) })),
      });
      toast.success('Purchase recorded');
      navigate('/purchases');
    } catch { } finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl">
      <div className="card">
        <h2 className="text-lg font-semibold mb-6">New Purchase Order</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Supplier *</label>
              <select className="input" {...register('supplier', { required: 'Required' })}>
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              {errors.supplier && <p className="field-error">{errors.supplier.message}</p>}
            </div>
            <div><label className="label">Payment</label>
              <select className="input" {...register('paymentMethod')}>
                {['cash','card','bank_transfer','credit','other'].map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Items *</label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => append({ product: '', quantity: 1, unitCost: 0 })}>
                <PlusIcon className="w-4 h-4" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    {idx === 0 && <label className="label">Product</label>}
                    <select className="input" {...register(`items.${idx}.product`, { required: true })}>
                      <option value="">Select…</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name} (stock: {p.stock})</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    {idx === 0 && <label className="label">Quantity</label>}
                    <input type="number" min="1" className="input" {...register(`items.${idx}.quantity`, { required: true, min: 1 })} />
                  </div>
                  <div className="col-span-3">
                    {idx === 0 && <label className="label">Unit Cost ($)</label>}
                    <input type="number" step="0.01" min="0" className="input" {...register(`items.${idx}.unitCost`, { required: true })} />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => remove(idx)} disabled={fields.length === 1}>
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Discount ($)</label><input type="number" step="0.01" min="0" className="input" {...register('discountAmount')} /></div>
            <div><label className="label">Tax ($)</label><input type="number" step="0.01" min="0" className="input" {...register('taxAmount')} /></div>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} {...register('notes')} /></div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-1 text-sm text-right">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>-{fmt(watchDisc || 0)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{fmt(watchTax || 0)}</span></div>
            <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2"><span>Total</span><span>{fmt(total)}</span></div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Processing…' : 'Record Purchase'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/purchases')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default NewPurchasePage;
