import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { createSale } from '../../services/saleService';
import { getProducts } from '../../services/productService';
import { getAllCustomers } from '../../services/customerService';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const fmt = (n) => `$${Number(n ?? 0).toFixed(2)}`;

const NewSalePage = () => {
  const navigate = useNavigate();
  const [products,  setProducts]  = useState([]);
  const [customers, setCustomers] = useState([]);
  const [saving,    setSaving]    = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { customer: '', paymentMethod: 'cash', taxRate: 0, notes: '', items: [{ product: '', quantity: 1, unitPrice: 0, discountPercent: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems  = watch('items');
  const watchTaxRate = watch('taxRate');

  useEffect(() => {
    getProducts({ limit: 100, isActive: true }).then(r => setProducts(r.data.data ?? []));
    getAllCustomers().then(r => setCustomers(r.data.data ?? []));
  }, []);

  const handleProductChange = (idx, productId) => {
    const p = products.find(x => x._id === productId);
    if (p) setValue(`items.${idx}.unitPrice`, p.price);
  };

  // Compute totals
  const subtotal = (watchItems || []).reduce((sum, item) => {
    const disc = ((item.unitPrice * item.quantity) * (item.discountPercent / 100));
    return sum + Math.max(0, item.unitPrice * item.quantity - disc);
  }, 0);
  const taxAmt = subtotal * ((watchTaxRate || 0) / 100);
  const total  = subtotal + taxAmt;

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await createSale({
        customer:      data.customer || undefined,
        paymentMethod: data.paymentMethod,
        taxRate:       Number(data.taxRate),
        notes:         data.notes,
        items: data.items.map(i => ({
          product:         i.product,
          quantity:        Number(i.quantity),
          unitPrice:       Number(i.unitPrice),
          discountPercent: Number(i.discountPercent),
        })),
      });
      toast.success('Sale created successfully');
      navigate('/sales');
    } catch { } finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl">
      <div className="card">
        <h2 className="text-lg font-semibold mb-6">New Sale</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Header info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Customer</label>
              <select className="input" {...register('customer')}>
                <option value="">Walk-in</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select className="input" {...register('paymentMethod')}>
                {['cash','card','bank_transfer','other'].map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tax Rate (%)</label>
              <input type="number" step="0.1" min="0" max="100" className="input" {...register('taxRate')} />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Items *</label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => append({ product: '', quantity: 1, unitPrice: 0, discountPercent: 0 })}>
                <PlusIcon className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    {idx === 0 && <label className="label">Product</label>}
                    <select className="input" {...register(`items.${idx}.product`, { required: true })}
                      onChange={e => { register(`items.${idx}.product`).onChange(e); handleProductChange(idx, e.target.value); }}>
                      <option value="">Select…</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name} (stock: {p.stock})</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <label className="label">Qty</label>}
                    <input type="number" min="1" className="input" {...register(`items.${idx}.quantity`, { required: true, min: 1 })} />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <label className="label">Unit Price</label>}
                    <input type="number" step="0.01" min="0" className="input" {...register(`items.${idx}.unitPrice`)} />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <label className="label">Disc %</label>}
                    <input type="number" min="0" max="100" className="input" {...register(`items.${idx}.discountPercent`)} />
                  </div>
                  <div className="col-span-2 flex items-end gap-1">
                    {idx === 0 && <div className="label invisible">x</div>}
                    <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => remove(idx)} disabled={fields.length === 1}>
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} {...register('notes')} />
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-1 text-sm text-right">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium">{fmt(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tax ({watchTaxRate}%)</span><span className="font-medium">{fmt(taxAmt)}</span></div>
            <div className="flex justify-between text-base font-bold text-slate-800 border-t border-slate-200 pt-2 mt-2">
              <span>Total</span><span>{fmt(total)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Processing…' : 'Create Sale'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/sales')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default NewSalePage;
