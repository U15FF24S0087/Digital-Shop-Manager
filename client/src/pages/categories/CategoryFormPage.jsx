import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, TagIcon } from '@heroicons/react/24/outline';
import { createCategory, getCategoryById, updateCategory } from '../../services/categoryService';
import { PageSpinner } from '../../components/ui/Spinner';

const makeSlug = (value) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const CategoryFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { name: '', description: '', imageUrl: '', isActive: true } });
  const name = watch('name');
  const imageUrl = watch('imageUrl');
  const slugPreview = useMemo(() => makeSlug(name || ''), [name]);

  useEffect(() => {
    if (!isEdit) return undefined;
    let mounted = true;
    getCategoryById(id)
      .then((response) => {
        if (mounted) {
          const category = response.data.data;
          reset({
            name: category.name,
            description: category.description ?? '',
            imageUrl: category.imageUrl ?? '',
            isActive: category.isActive,
          });
        }
      })
      .catch((requestError) => {
        if (mounted) setLoadError(requestError.response?.data?.message || 'Could not load this category.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [id, isEdit, reset]);

  const onSubmit = async (formData) => {
    setSaving(true);
    setServerError('');
    const payload = {
      ...formData,
      name: formData.name.trim().replace(/\s+/g, ' '),
      isActive: formData.isActive === true || formData.isActive === 'true',
    };
    try {
      if (isEdit) {
        await updateCategory(id, payload);
        toast.success('Category updated');
      } else {
        await createCategory(payload);
        toast.success('Category created');
      }
      navigate('/categories');
    } catch (requestError) {
      setServerError(requestError.response?.data?.message || 'Unable to save this category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSpinner />;

  if (loadError) {
    return (
      <div className="card max-w-xl" role="alert">
        <p className="font-medium text-red-700">Unable to load category</p>
        <p className="mt-2 text-sm text-slate-600">{loadError}</p>
        <Link to="/categories" className="btn btn-secondary mt-4">Back to categories</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/categories" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" /> Back to categories
      </Link>
      <div className="card">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-xl bg-primary-50 p-3 text-primary-600"><TagIcon className="h-6 w-6" aria-hidden="true" /></span>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{isEdit ? 'Edit Category' : 'Add Category'}</h1>
            <p className="mt-1 text-sm text-slate-500">Category changes preserve products assigned to it.</p>
          </div>
        </div>
        {serverError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{serverError}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="label" htmlFor="name">Category name *</label>
            <input
              id="name"
              className={`input ${errors.name ? 'border-red-400' : ''}`}
              aria-invalid={Boolean(errors.name)}
              {...register('name', {
                required: 'Category name is required',
                minLength: { value: 2, message: 'Enter at least 2 characters' },
                maxLength: { value: 100, message: 'Maximum 100 characters' },
                validate: (value) => value.trim().length >= 2 || 'Enter at least 2 non-space characters',
              })}
            />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="slug-preview">URL slug</label>
            <input id="slug-preview" className="input bg-slate-50 font-mono text-slate-500" value={slugPreview} readOnly />
            <p className="mt-1 text-xs text-slate-500">Generated from the category name. Renaming updates this slug.</p>
          </div>
          <div>
            <label className="label" htmlFor="imageUrl">Category image URL</label>
            <input
              id="imageUrl"
              type="url"
              className={`input ${errors.imageUrl ? 'border-red-400' : ''}`}
              placeholder="https://example.com/category.jpg"
              {...register('imageUrl', {
                validate: (value) => !value || /^https?:\/\/\S+$/i.test(value) || 'Enter a valid HTTP or HTTPS URL',
                maxLength: { value: 2048, message: 'Maximum 2048 characters' },
              })}
            />
            {errors.imageUrl && <p className="field-error">{errors.imageUrl.message}</p>}
            {imageUrl && !errors.imageUrl && <img src={imageUrl} alt="Category preview" className="mt-3 h-24 w-24 rounded-lg border border-slate-200 object-cover" />}
          </div>
          <div>
            <label className="label" htmlFor="description">Description</label>
            <textarea id="description" rows={4} className={`input ${errors.description ? 'border-red-400' : ''}`} {...register('description', { maxLength: { value: 500, message: 'Maximum 500 characters' } })} />
            {errors.description && <p className="field-error">{errors.description.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="isActive">Category status</label>
            <select id="isActive" className="input" {...register('isActive', { setValueAs: (value) => value === true || value === 'true' })}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">Inactive categories cannot be assigned to new products.</p>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create category'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/categories')} disabled={saving}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormPage;
