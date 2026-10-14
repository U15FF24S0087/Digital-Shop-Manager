import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CubeIcon,
  PencilIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { getCategoryById, getCategoryProducts } from '../../services/categoryService';
import Pagination from '../../components/ui/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';

const dateTime = (value) => value ? format(new Date(value), 'dd MMM yyyy, HH:mm') : '—';

const CategoryDetailPage = () => {
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const canReadProducts = hasPermission('products:read');
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const categoryRequest = getCategoryById(id);
      const productsRequest = canReadProducts
        ? getCategoryProducts(id, { page, limit: 10, sortBy: 'name', order: 'asc' })
        : Promise.resolve(null);
      const [categoryResponse, productsResponse] = await Promise.all([categoryRequest, productsRequest]);
      setCategory(categoryResponse.data.data);
      setProducts(productsResponse?.data.data ?? []);
      setMeta(productsResponse?.data.meta ?? { totalPages: 1, total: 0 });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load category details.');
    } finally {
      setLoading(false);
    }
  }, [id, page, retry, canReadProducts]);

  useEffect(() => { load(); }, [load]);

  if (loading && !category) return <PageSpinner />;
  if (error && !category) {
    return (
      <div className="card mx-auto max-w-xl py-10 text-center" role="alert">
        <p className="font-medium text-red-700">Unable to load category</p>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <button type="button" className="btn btn-primary mt-4" onClick={() => setRetry((value) => value + 1)}>Try again</button>
      </div>
    );
  }
  if (!category) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/categories" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" /> Back to categories
          </Link>
          <h1 className="page-title">{category.name}</h1>
          <p className="page-subtitle">Category details and associated products.</p>
        </div>
        {hasPermission('categories:update') && (
          <Link to={`/categories/${id}/edit`} className="btn btn-primary">
            <PencilIcon className="h-4 w-4" aria-hidden="true" /> Edit Category
          </Link>
        )}
      </div>

      {error && <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" role="alert"><span>{error}</span><button type="button" className="btn btn-secondary btn-sm" onClick={() => setRetry((value) => value + 1)}>Retry</button></div>}

      <section className="card grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
        {category.imageUrl ? (
          <img src={category.imageUrl} alt={`${category.name} category`} className="h-36 w-36 rounded-xl border border-slate-200 object-cover" />
        ) : (
          <span className="flex h-36 w-36 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><TagIcon className="h-12 w-12" aria-hidden="true" /></span>
        )}
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Description</p>
            <p className="mt-1 text-sm text-slate-700">{category.description || 'No description provided.'}</p>
          </div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Slug</p><p className="mt-1 font-mono text-sm text-slate-700">{category.slug}</p></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</p><span className={`mt-1 inline-flex ${category.isActive ? 'badge-green' : 'badge-gray'}`}>{category.isActive ? 'Active' : 'Inactive'}</span></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Products</p><p className="mt-1 text-sm font-semibold text-slate-800">{Number(category.productCount ?? meta.total).toLocaleString('en-IN')}</p></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Created</p><p className="mt-1 text-sm text-slate-700">{dateTime(category.createdAt)}</p></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Last updated</p><p className="mt-1 text-sm text-slate-700">{dateTime(category.updatedAt)}</p></div>
        </div>
      </section>

      {canReadProducts && <section className="card overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-800">Products in this category</h2>
            <p className="mt-1 text-sm text-slate-500">{Number(meta.total ?? 0).toLocaleString('en-IN')} associated products</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRetry((value) => value + 1)} aria-label="Refresh products">
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            </button>
            <Link to={`/products?category=${id}`} className="btn btn-secondary btn-sm">View all products</Link>
          </div>
        </div>
        {loading ? <div className="animate-pulse px-5 pb-6 text-sm text-slate-400">Loading associated products…</div> : (
          <div className="table-wrapper rounded-none border-x-0 border-b-0">
            <table className="table">
              <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Status</th><th /></tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {products.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-500"><CubeIcon className="mx-auto mb-2 h-8 w-8 text-slate-300" aria-hidden="true" />No products are assigned to this category.</td></tr>
                ) : products.map((product) => (
                  <tr key={product._id}>
                    <td className="font-medium text-slate-800">{product.name}</td>
                    <td className="font-mono text-xs text-slate-500">{product.sku}</td>
                    <td>{Number(product.stock).toLocaleString('en-IN')} {product.unit}</td>
                    <td><span className={product.isActive ? 'badge-green' : 'badge-gray'}>{product.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td><Link to={`/products/${product._id}`} className="font-medium text-primary-600 hover:underline">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={meta.totalPages ?? 1} onPageChange={setPage} />
      </section>}
    </div>
  );
};

export default CategoryDetailPage;
