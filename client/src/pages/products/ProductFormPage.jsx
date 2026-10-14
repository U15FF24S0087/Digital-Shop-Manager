import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, CubeIcon } from '@heroicons/react/24/outline';
import { getProductById, createProduct, updateProduct } from '../../services/productService';
import { getAllCategories } from '../../services/categoryService';
import { getAllSuppliers } from '../../services/supplierService';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';

const FormField = ({ label, name, rules, type = 'text', step, register, errors }) => (
  <div>
    <label className="label" htmlFor={name}>{label}</label>
    <input
      id={name}
      type={type}
      step={step}
      className={`input ${errors[name] ? 'border-red-400' : ''}`}
      aria-invalid={Boolean(errors[name])}
      {...register(name, rules)}
    />
    {errors[name] && <p className="field-error">{errors[name].message}</p>}
  </div>
);

const ProductFormPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cats, setCats] = useState([]);
  const [sups, setSups] = useState([]);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { isActive: true, stock: 0, lowStockThreshold: 10 } });
  const imageUrl = watch('imageUrl');

  useEffect(() => {
    let mounted = true;
    const loadForm = async () => {
      setLoadError('');
      try {
        const requests = [
          getAllCategories(),
          hasPermission('suppliers:read')
            ? getAllSuppliers()
            : Promise.resolve({ data: { data: [] } }),
        ];
        if (isEdit) requests.push(getProductById(id));
        const [categoryResponse, supplierResponse, productResponse] = await Promise.all(requests);
        if (!mounted) return;
        const availableCategories = categoryResponse.data.data ?? [];
        setSups(supplierResponse.data.data ?? []);
        if (isEdit) {
          const product = productResponse.data.data;
          if (product.category && !availableCategories.some((category) => category._id === product.category._id)) {
            availableCategories.push(product.category);
          }
          setCats(availableCategories);
          reset({
            name: product.name,
            sku: product.sku,
            barcode: product.barcode ?? '',
            description: product.description ?? '',
            imageUrl: product.imageUrl ?? '',
            category: product.category?._id ?? '',
            supplier: product.supplier?._id ?? '',
            price: product.price,
            cost: product.cost,
            lowStockThreshold: product.lowStockThreshold,
            unit: product.unit,
            isActive: product.isActive,
            currentStock: product.stock,
          });
        } else setCats(availableCategories);
      } catch (requestError) {
        if (mounted) setLoadError(requestError.response?.data?.message || 'Could not load product form data.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadForm();
    return () => { mounted = false; };
  }, [id, isEdit, hasPermission, reset]);

  const onSubmit = async (formData) => {
    setSaving(true);
    setServerError('');
    const payload = {
      ...formData,
      price: Number(formData.price),
      cost: Number(formData.cost),
      lowStockThreshold: Number(formData.lowStockThreshold),
      isActive: formData.isActive === true || formData.isActive === 'true',
      supplier: formData.supplier || null,
    };
    delete payload.currentStock;
    if (isEdit) delete payload.stock;
    else payload.stock = Number(formData.stock);
    try {
      if (isEdit) {
        await updateProduct(id, payload);
        toast.success('Product updated');
      } else {
        await createProduct(payload);
        toast.success('Product created');
      }
      navigate('/products');
    } catch (requestError) {
      setServerError(requestError.response?.data?.message || 'Unable to save the product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSpinner />;

  if (loadError) {
    return (
      <div className="card max-w-xl" role="alert">
        <p className="font-medium text-red-700">Unable to load product</p>
        <p className="mt-2 text-sm text-slate-600">{loadError}</p>
        <Link to="/products" className="btn btn-secondary mt-4">Back to products</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/products" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" /> Back to products
      </Link>
      <div className="card">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-xl bg-primary-50 p-3 text-primary-600"><CubeIcon className="h-6 w-6" aria-hidden="true" /></span>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isEdit ? 'Update catalog details. Stock changes are recorded through Inventory.' : 'Add a product to your catalog and set its opening stock.'}
            </p>
          </div>
        </div>

        {serverError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField register={register} errors={errors} label="Product name *" name="name" rules={{ required: 'Product name is required', minLength: { value: 2, message: 'Enter at least 2 characters' }, maxLength: { value: 200, message: 'Maximum 200 characters' } }} />
            <FormField register={register} errors={errors} label="SKU *" name="sku" rules={{ required: 'SKU is required', maxLength: { value: 50, message: 'Maximum 50 characters' } }} />
            <FormField register={register} errors={errors} label="Barcode" name="barcode" rules={{ maxLength: { value: 100, message: 'Maximum 100 characters' } }} />
            <div>
              <label className="label" htmlFor="category">Category *</label>
              <select id="category" className={`input ${errors.category ? 'border-red-400' : ''}`} {...register('category', { required: 'Select a category' })}>
                <option value="">Select category</option>
                {cats.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
              {errors.category && <p className="field-error">{errors.category.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="supplier">Preferred supplier</label>
              <select id="supplier" className="input" {...register('supplier')}>
                <option value="">None</option>
                {sups.map((supplier) => <option key={supplier._id} value={supplier._id}>{supplier.name}</option>)}
              </select>
            </div>
            <FormField register={register} errors={errors} label="Purchase cost (₹) *" name="cost" type="number" step="0.01" rules={{ required: 'Purchase cost is required', valueAsNumber: true, min: { value: 0, message: 'Must be zero or greater' } }} />
            <FormField register={register} errors={errors} label="Selling price (₹) *" name="price" type="number" step="0.01" rules={{ required: 'Selling price is required', valueAsNumber: true, min: { value: 0, message: 'Must be zero or greater' } }} />
            {!isEdit && <FormField register={register} errors={errors} label="Initial stock quantity *" name="stock" type="number" step="1" rules={{ required: 'Initial stock is required', valueAsNumber: true, min: { value: 0, message: 'Must be zero or greater' }, validate: (value) => Number.isInteger(value) || 'Enter a whole number' }} />}
            <FormField register={register} errors={errors} label="Minimum stock level *" name="lowStockThreshold" type="number" step="1" rules={{ required: 'Minimum stock level is required', valueAsNumber: true, min: { value: 0, message: 'Must be zero or greater' }, validate: (value) => Number.isInteger(value) || 'Enter a whole number' }} />
            <FormField register={register} errors={errors} label="Stock unit" name="unit" rules={{ maxLength: { value: 20, message: 'Maximum 20 characters' } }} />
            <div>
              <label className="label" htmlFor="isActive">Product status</label>
              <select id="isActive" className="input" {...register('isActive', { setValueAs: (value) => value === true || value === 'true' })}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {isEdit && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Available stock: <strong>{watch('currentStock') ?? 0}</strong>. To change this quantity, use Inventory adjustments.
            </div>
          )}

          <div>
            <label className="label" htmlFor="imageUrl">Product image URL</label>
            <input
              id="imageUrl"
              type="url"
              className={`input ${errors.imageUrl ? 'border-red-400' : ''}`}
              placeholder="https://example.com/product.jpg"
              {...register('imageUrl', {
                validate: (value) => !value || /^https?:\/\/\S+$/i.test(value) || 'Enter a valid HTTP or HTTPS URL',
                maxLength: { value: 2048, message: 'Maximum 2048 characters' },
              })}
            />
            {errors.imageUrl && <p className="field-error">{errors.imageUrl.message}</p>}
            {imageUrl && !errors.imageUrl && (
              <img src={imageUrl} alt="Product preview" className="mt-3 h-24 w-24 rounded-lg border border-slate-200 object-cover" />
            )}
          </div>

          <div>
            <label className="label" htmlFor="description">Description</label>
            <textarea id="description" className={`input ${errors.description ? 'border-red-400' : ''}`} rows={4} {...register('description', { maxLength: { value: 1000, message: 'Maximum 1000 characters' } })} />
            {errors.description && <p className="field-error">{errors.description.message}</p>}
          </div>

          <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')} disabled={saving}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormPage;
