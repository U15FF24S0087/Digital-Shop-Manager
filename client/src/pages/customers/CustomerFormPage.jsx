import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getCustomerById, createCustomer, updateCustomer } from '../../services/customerService';
import { PageSpinner } from '../../components/ui/Spinner';

const CustomerFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (isEdit) {
      getCustomerById(id).then(res => {
        const c = res.data.data;
        reset({ name: c.name, email: c.email || '', phone: c.phone || '', notes: c.notes || '',
          'address.street': c.address?.street, 'address.city': c.address?.city,
          'address.state': c.address?.state,   'address.zip': c.address?.zip,
          'address.country': c.address?.country });
      }).finally(() => setLoading(false));
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (raw) => {
    setSaving(true);
    const data = { ...raw, address: { street: raw['address.street'], city: raw['address.city'], state: raw['address.state'], zip: raw['address.zip'], country: raw['address.country'] } };
    try {
      isEdit ? await updateCustomer(id, data) : await createCustomer(data);
      toast.success(isEdit ? 'Customer updated' : 'Customer created');
      navigate('/customers');
    } catch { } finally { setSaving(false); }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-2xl">
      <div className="card">
        <h2 className="text-lg font-semibold mb-6">{isEdit ? 'Edit Customer' : 'New Customer'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input className="input" {...register('name', { required: 'Required' })} />{errors.name && <p className="field-error">{errors.name.message}</p>}</div>
            <div><label className="label">Email</label><input type="email" className="input" {...register('email')} /></div>
          </div>
          <div><label className="label">Phone</label><input className="input" {...register('phone')} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Street</label><input className="input" {...register('address.street')} /></div>
            <div><label className="label">City</label><input className="input" {...register('address.city')} /></div>
            <div><label className="label">State</label><input className="input" {...register('address.state')} /></div>
            <div><label className="label">ZIP</label><input className="input" {...register('address.zip')} /></div>
          </div>
          <div><label className="label">Country</label><input className="input" {...register('address.country')} /></div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} {...register('notes')} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/customers')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CustomerFormPage;
