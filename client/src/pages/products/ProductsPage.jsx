import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  Squares2X2Icon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { deleteProduct, getProductStats, getProducts } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import useApi from '../../hooks/useApi';
import usePagination from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import { useAuth } from '../../context/AuthContext';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const formatCurrency = (value) => currency.format(Number(value) || 0);

const csvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const ProductSkeleton = () => (
  <div className="card space-y-4" aria-label="Loading products" aria-busy="true">
    {Array.from({ length: 6 }, (_value, index) => (
      <div key={index} className="flex animate-pulse gap-4">
        <div className="h-12 w-12 rounded-lg bg-slate-100" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 w-1/3 rounded bg-slate-100" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
    ))}
  </div>
);

const ProductsPage = () => {
  const { hasPermission } = useAuth();
  const [searchParams] = useSearchParams();
  const {
    params,
    page,
    limit,
    search,
    handleSearch,
    goToPage,
    changeLimit,
    setFilter,
  } = usePagination({
    limit: 20,
    filters: searchParams.get('category') ? { category: searchParams.get('category') } : {},
  });
  useEffect(() => {
    const categoryId = searchParams.get('category');
    if (categoryId && params.category !== categoryId) setFilter('category', categoryId);
  }, [searchParams, params.category, setFilter]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const query = useMemo(
    () => ({ ...params, sortBy, order }),
    [params, sortBy, order],
  );
  const {
    data: productResponse,
    loading,
    error,
    refetch: refetchProducts,
  } = useApi(getProducts, query, {
    deps: [JSON.stringify(query), refreshKey],
  });
  const { data: statsResponse, error: statsError, refetch: refetchStats } = useApi(
    getProductStats,
    {},
    { deps: [refreshKey] },
  );
  const { data: categoryResponse } = useApi(getCategories, { page: 1, limit: 100 }, { deps: [] });

  const products = productResponse?.data ?? [];
  const meta = productResponse?.meta ?? {};
  const stats = statsResponse?.data ?? {};
  const categories = categoryResponse?.data?.data ?? [];

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  const handleDelete = async (product) => {
    if (!window.confirm(`Deactivate "${product.name}"? Historical sales, purchases, and inventory records will be retained.`)) return;
    try {
      await deleteProduct(product._id);
      toast.success('Product deactivated');
      refresh();
    } catch {
      // The shared API interceptor displays the request error.
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const rows = [];
      const exportLimit = 100;
      const firstPage = await getProducts({ ...query, page: 1, limit: exportLimit });
      rows.push(...firstPage.data.data);
      const totalPages = firstPage.data.meta?.totalPages ?? 1;
      for (let exportPage = 2; exportPage <= totalPages; exportPage += 1) {
        const response = await getProducts({ ...query, page: exportPage, limit: exportLimit });
        rows.push(...response.data.data);
      }

      const columns = [
        ['Name', (product) => product.name],
        ['SKU', (product) => product.sku],
        ['Barcode', (product) => product.barcode],
        ['Category', (product) => product.category?.name],
        ['Selling price', (product) => product.price],
        ['Purchase cost', (product) => product.cost],
        ['Available stock', (product) => product.stock],
        ['Minimum stock', (product) => product.lowStockThreshold],
        ['Status', (product) => (product.isActive ? 'Active' : 'Inactive')],
      ];
      const csv = [
        columns.map(([heading]) => csvValue(heading)).join(','),
        ...rows.map((product) => columns.map(([, value]) => csvValue(value(product))).join(',')),
      ].join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'products.csv';
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(`${rows.length} products exported`);
    } catch {
      // The shared API interceptor displays the request error.
    } finally {
      setExporting(false);
    }
  };

  const statCards = [
    { label: 'Total products', value: stats.total, icon: CubeIcon, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active products', value: stats.active, icon: Squares2X2Icon, color: 'text-green-600 bg-green-50' },
    { label: 'Low stock', value: stats.lowStock, icon: ExclamationTriangleIcon, color: 'text-amber-600 bg-amber-50' },
    { label: 'Out of stock', value: stats.outOfStock, icon: XCircleIcon, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Products Management</h1>
          <p className="page-subtitle">Search, organize, and manage your product catalog.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary" onClick={refresh} title="Refresh products">
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleExport} disabled={exporting || loading}>
            <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" /> {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          {hasPermission('products:create') && (
            <Link to="/products/new" className="btn btn-primary">
              <PlusIcon className="h-4 w-4" aria-hidden="true" /> Add Product
            </Link>
          )}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Product statistics">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div className="card flex items-center gap-4" key={label}>
            <span className={`rounded-xl p-3 ${color}`}><Icon className="h-6 w-6" aria-hidden="true" /></span>
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{value === undefined ? '—' : Number(value).toLocaleString('en-IN')}</p>
            </div>
          </div>
        ))}
      </section>
      {statsError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" role="alert">
          <span>Product statistics could not be loaded: {statsError}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => refetchStats()}>Retry statistics</button>
        </div>
      )}

      <section className="card space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="relative">
            <span className="sr-only">Search products by name or SKU</span>
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              className="input pl-9"
              placeholder="Search name or SKU…"
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
            />
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select className="input" value={params.category || ''} onChange={(event) => setFilter('category', event.target.value)}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by stock status</span>
            <select className="input" value={params.stockStatus || ''} onChange={(event) => setFilter('stockStatus', event.target.value)}>
              <option value="">All stock levels</option>
              <option value="in_stock">In stock</option>
              <option value="low_stock">Low stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by product status</span>
            <select className="input" value={params.isActive ?? ''} onChange={(event) => setFilter('isActive', event.target.value)}>
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Sort products</span>
            <select
              className="input"
              value={`${sortBy}:${order}`}
              onChange={(event) => {
                const [field, direction] = event.target.value.split(':');
                setSortBy(field);
                setOrder(direction);
              }}
            >
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
              <option value="name:asc">Name A–Z</option>
              <option value="name:desc">Name Z–A</option>
              <option value="price:asc">Price low to high</option>
              <option value="price:desc">Price high to low</option>
              <option value="stock:asc">Quantity low to high</option>
              <option value="stock:desc">Quantity high to low</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>{meta.total ?? 0} products</span>
          <label className="flex items-center gap-2">
            Rows
            <select className="input w-auto py-1.5" value={limit} onChange={(event) => changeLimit(Number(event.target.value))}>
              {[10, 20, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            per page
          </label>
        </div>
      </section>

      {loading ? <ProductSkeleton /> : error ? (
        <div className="card py-10 text-center" role="alert">
          <p className="font-medium text-red-700">Unable to load products</p>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
          <button className="btn btn-primary mt-4" onClick={() => refetchProducts()}>Try again</button>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Image</th><th>Product</th><th>SKU</th><th>Category</th>
                  <th>Selling price</th><th>Purchase cost</th><th>Available stock</th>
                  <th>Minimum stock</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-14 text-center text-slate-500">
                      <CubeIcon className="mx-auto mb-2 h-8 w-8 text-slate-300" aria-hidden="true" />
                      No products match your search or filters.
                    </td>
                  </tr>
                ) : products.map((product) => {
                  const outOfStock = product.stock === 0;
                  const lowStock = product.stock <= product.lowStockThreshold;
                  return (
                    <tr key={product._id}>
                      <td>
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" loading="lazy" className="h-11 w-11 rounded-lg border border-slate-200 object-cover" />
                        ) : (
                          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><CubeIcon className="h-5 w-5" aria-hidden="true" /></span>
                        )}
                      </td>
                      <td className="max-w-48 truncate font-medium text-slate-800">{product.name}</td>
                      <td className="font-mono text-xs text-slate-500">{product.sku}</td>
                      <td>{product.category?.name ?? '—'}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>{formatCurrency(product.cost)}</td>
                      <td className={lowStock ? 'font-semibold text-red-600' : ''}>{Number(product.stock).toLocaleString('en-IN')} {product.unit}</td>
                      <td>{Number(product.lowStockThreshold).toLocaleString('en-IN')} {product.unit}</td>
                      <td>
                        <span className={product.isActive ? 'badge-green' : 'badge-gray'}>{product.isActive ? 'Active' : 'Inactive'}</span>
                        {product.isActive && <span className={`ml-1 ${outOfStock ? 'badge-red' : lowStock ? 'badge-yellow' : 'badge-green'}`}>{outOfStock ? 'Out of stock' : lowStock ? 'Low stock' : 'In stock'}</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link to={`/products/${product._id}`} className="btn btn-secondary btn-sm">View</Link>
                          {hasPermission('products:update') && (
                            <Link to={`/products/${product._id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                          )}
                          {hasPermission('products:delete') && product.isActive && (
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(product)}>Deactivate</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={meta.totalPages ?? 1} onPageChange={goToPage} />
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
