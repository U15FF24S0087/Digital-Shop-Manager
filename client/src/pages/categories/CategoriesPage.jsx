import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  TagIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { deleteCategory, getAllCategories, getCategories, getCategoryStats } from '../../services/categoryService';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { useAuth } from '../../context/AuthContext';

const dateFormat = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const csvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const CategorySkeleton = () => (
  <div className="card space-y-4" aria-label="Loading categories" aria-busy="true">
    {Array.from({ length: 5 }, (_value, index) => (
      <div className="flex animate-pulse gap-4" key={index}>
        <div className="h-11 w-11 rounded-lg bg-slate-100" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 w-1/3 rounded bg-slate-100" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
    ))}
  </div>
);

const CategoriesPage = () => {
  const { hasPermission } = useAuth();
  const { params, page, limit, search, handleSearch, goToPage, changeLimit, setFilter } = usePagination({ limit: 20 });
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [reassignTo, setReassignTo] = useState('');
  const query = useMemo(() => ({ ...params, sortBy, order }), [params, sortBy, order]);
  const { data: response, loading, error, refetch } = useApi(getCategories, query, {
    deps: [JSON.stringify(query), refreshKey],
  });
  const { data: statsResponse, error: statsError, refetch: refetchStats } = useApi(
    getCategoryStats,
    {},
    { deps: [refreshKey] },
  );
  const {
    data: activeCategoriesResponse,
    error: activeCategoriesError,
    refetch: refetchActiveCategories,
  } = useApi(getAllCategories);
  const categories = response?.data ?? [];
  const meta = response?.meta ?? {};
  const stats = statsResponse?.data ?? {};
  const activeCategories = activeCategoriesResponse?.data ?? [];
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  const exportCsv = async () => {
    try {
      const first = await getCategories({ ...query, page: 1, limit: 100 });
      const rows = [...(first.data.data ?? [])];
      for (let exportPage = 2; exportPage <= (first.data.meta?.totalPages ?? 1); exportPage += 1) {
        const next = await getCategories({ ...query, page: exportPage, limit: 100 });
        rows.push(...(next.data.data ?? []));
      }
      const columns = [
        ['Name', (category) => category.name],
        ['Description', (category) => category.description],
        ['Slug', (category) => category.slug],
        ['Products', (category) => category.productCount],
        ['Status', (category) => category.isActive ? 'Active' : 'Inactive'],
        ['Created', (category) => category.createdAt],
      ];
      const csv = [
        columns.map(([label]) => csvValue(label)).join(','),
        ...rows.map((category) => columns.map(([, getValue]) => csvValue(getValue(category))).join(',')),
      ].join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'categories.csv';
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(`${rows.length} categories exported`);
    } catch {
      // The shared API interceptor displays request errors.
    }
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;
    setDeleting(true);
    try {
      const responseData = await deleteCategory(selectedCategory._id, reassignTo || undefined);
      const reassigned = responseData.data.data?.reassignedProducts ?? 0;
      toast.success(reassigned ? `Category deleted; ${reassigned} products reassigned` : 'Category deleted');
      setSelectedCategory(null);
      setReassignTo('');
      refresh();
    } catch {
      // The shared API interceptor displays request errors.
    } finally {
      setDeleting(false);
    }
  };

  const statCards = [
    ['Total categories', stats.total, 'text-blue-600 bg-blue-50'],
    ['Active categories', stats.active, 'text-green-600 bg-green-50'],
    ['Inactive categories', stats.inactive, 'text-slate-600 bg-slate-100'],
    ['Categories with products', stats.withProducts, 'text-purple-600 bg-purple-50'],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Categories Management</h1>
          <p className="page-subtitle">Organize products into clear, searchable categories.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary" onClick={refresh}>
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh
          </button>
          <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={loading}>
            <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" /> Export CSV
          </button>
          {hasPermission('categories:create') && (
            <Link to="/categories/new" className="btn btn-primary">
              <PlusIcon className="h-4 w-4" aria-hidden="true" /> Add Category
            </Link>
          )}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Category statistics">
        {statCards.map(([label, value, color]) => (
          <div className="card flex items-center gap-4" key={label}>
            <span className={`rounded-xl p-3 ${color}`}><TagIcon className="h-6 w-6" aria-hidden="true" /></span>
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{value === undefined ? '—' : Number(value).toLocaleString('en-IN')}</p>
            </div>
          </div>
        ))}
      </section>
      {statsError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" role="alert">
          <span>Category statistics could not be loaded: {statsError}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => refetchStats()}>Retry statistics</button>
        </div>
      )}

      <section className="card space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="relative">
            <span className="sr-only">Search categories by name or description</span>
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input className="input pl-9" placeholder="Search name or description…" value={search} onChange={(event) => handleSearch(event.target.value)} />
          </label>
          <label>
            <span className="sr-only">Filter by category status</span>
            <select className="input" value={params.isActive ?? ''} onChange={(event) => setFilter('isActive', event.target.value)}>
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Sort categories</span>
            <select
              className="input"
              value={`${sortBy}:${order}`}
              onChange={(event) => {
                const [field, direction] = event.target.value.split(':');
                setSortBy(field);
                setOrder(direction);
              }}
            >
              <option value="name:asc">Name A–Z</option>
              <option value="name:desc">Name Z–A</option>
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>{meta.total ?? 0} categories</span>
          <label className="flex items-center gap-2">
            Rows
            <select className="input w-auto py-1.5" value={limit} onChange={(event) => changeLimit(Number(event.target.value))}>
              {[10, 20, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            per page
          </label>
        </div>
      </section>

      {loading ? <CategorySkeleton /> : error ? (
        <div className="card py-10 text-center" role="alert">
          <p className="font-medium text-red-700">Unable to load categories</p>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
          <button type="button" className="btn btn-primary mt-4" onClick={() => refetch()}>Try again</button>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead><tr><th>Category</th><th>Description</th><th>Slug</th><th>Products</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {categories.length === 0 ? (
                  <tr><td colSpan={7} className="py-14 text-center text-slate-500"><TagIcon className="mx-auto mb-2 h-8 w-8 text-slate-300" aria-hidden="true" />No categories match your search or filters.</td></tr>
                ) : categories.map((category) => (
                  <tr key={category._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {category.imageUrl ? <img src={category.imageUrl} alt="" className="h-10 w-10 rounded-lg border border-slate-200 object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600"><TagIcon className="h-5 w-5" aria-hidden="true" /></span>}
                        <Link to={`/categories/${category._id}`} className="font-medium text-slate-800 hover:text-primary-700">{category.name}</Link>
                      </div>
                    </td>
                    <td className="max-w-64 truncate text-slate-500">{category.description || '—'}</td>
                    <td className="font-mono text-xs text-slate-500">{category.slug}</td>
                    <td>{hasPermission('products:read') ? <Link to={`/products?category=${category._id}`} className="font-medium text-primary-600 hover:underline">{Number(category.productCount ?? 0).toLocaleString('en-IN')}</Link> : Number(category.productCount ?? 0).toLocaleString('en-IN')}</td>
                    <td><span className={category.isActive ? 'badge-green' : 'badge-gray'}>{category.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>{category.createdAt ? dateFormat.format(new Date(category.createdAt)) : '—'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={`/categories/${category._id}`} className="btn btn-secondary btn-sm">View</Link>
                        {hasPermission('categories:update') && <Link to={`/categories/${category._id}/edit`} className="btn btn-secondary btn-sm"><PencilIcon className="h-4 w-4" aria-hidden="true" /> Edit</Link>}
                        {hasPermission('categories:delete') && <button type="button" className="btn btn-danger btn-sm" onClick={() => setSelectedCategory(category)}><TrashIcon className="h-4 w-4" aria-hidden="true" /> Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={meta.totalPages ?? 1} onPageChange={goToPage} />
        </div>
      )}

      <Modal open={Boolean(selectedCategory)} onClose={() => !deleting && setSelectedCategory(null)} title="Delete category">
        {selectedCategory && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Delete <strong>{selectedCategory.name}</strong>? This cannot be undone. Associated product history will remain intact.
            </p>
            {selectedCategory.productCount > 0 ? (
              <div>
                <label className="label" htmlFor="reassign-category">Reassign {selectedCategory.productCount} associated products to</label>
                <select id="reassign-category" className="input" value={reassignTo} onChange={(event) => setReassignTo(event.target.value)}>
                  <option value="">Select an active category</option>
                  {activeCategories.filter((category) => category._id !== selectedCategory._id).map((category) => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">Products are reassigned before deletion; their sales and purchase records are not changed.</p>
                {activeCategoriesError && <p className="mt-2 text-sm text-red-700" role="alert">Could not load active categories. <button type="button" className="font-medium underline" onClick={() => refetchActiveCategories()}>Retry</button></p>}
                {!activeCategoriesError && activeCategories.filter((category) => category._id !== selectedCategory._id).length === 0 && (
                  <p className="mt-2 text-sm text-amber-700">Create or activate another category before deleting this one.</p>
                )}
              </div>
            ) : <p className="text-sm text-slate-500">This category has no associated products.</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedCategory(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting || (selectedCategory.productCount > 0 && !reassignTo)}>
                {deleting ? 'Deleting…' : 'Delete category'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CategoriesPage;
