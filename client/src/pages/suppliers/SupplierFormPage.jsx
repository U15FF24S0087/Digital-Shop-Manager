import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getSupplierById, createSupplier, updateSupplier } from '../../services/supplierService';
import { PageSpinner } from '../../components/ui/Spinner';

const SupplierFormPage = () => {
  const navigate = useNavigate(); const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (isEdit) {
      getSupplierById(id).then(res => {
        const s = res.data.data;
        reset({ name: s.name, email: s.email || '', phone: s.phone || '',
          contactPerson: s.contactPerson || '', notes: s.notes || '',
          'address.street': s.address?.street, 'address.city': s.address?.city,
          'address.state': s.address?.state,   'address.country': s.address?.country });
      }).finally(() => setLoading(false));
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (raw) => {
    setSaving(true);
    const data = { ...raw, address: { street: raw['address.street'], city: raw['address.city'], state: raw['address.state'], country: raw['address.country'] } };
    try {
      isEdit ? await updateSupplier(id, data) : await createSupplier(data);
      toast.success(isEdit ? 'Supplier updated' : 'Supplier created');
      navigate('/suppliers');
    } catch { } finally { setSaving(false); }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-2xl">
      <div className="card">
        <h2 className="text-lg font-semibold mb-6">{isEdit ? 'Edit Supplier' : 'New Supplier'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input className="input" {...register('name', { required: 'Required' })} />{errors.name && <p className="field-error">{errors.name.message}</p>}</div>
            <div><label className="label">Contact Person</label><input className="input" {...register('contactPerson')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Email</label><input type="email" className="input" {...register('email')} /></div>
            <div><label className="label">Phone</label><input className="input" {...register('phone')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Street</label><input className="input" {...register('address.street')} /></div>
            <div><label className="label">City</label><input className="input" {...register('address.city')} /></div>
            <div><label className="label">State</label><input className="input" {...register('address.state')} /></div>
            <div><label className="label">Country</label><input className="input" {...register('address.country')} /></div>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} {...register('notes')} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/suppliers')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default SupplierFormPage;
