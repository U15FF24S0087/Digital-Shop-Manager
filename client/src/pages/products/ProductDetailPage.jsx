import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CubeIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { getProductById } from '../../services/productService';
import { getProductMovements } from '../../services/inventoryService';
import useApi from '../../hooks/useApi';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const dateTime = (value) => (value ? format(new Date(value), 'dd MMM yyyy, hh:mm a') : '—');

const ProductDetailPage = () => {
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const { data: response, loading, error, refetch } = useApi(getProductById, id, { deps: [id] });
  const canViewInventory = hasPermission('inventory:read');
  const {
    data: movementResponse,
    loading: movementsLoading,
    error: movementsError,
  } = useApi(
    (productId) => getProductMovements(productId, { page: 1, limit: 8 }),
    id,
    { deps: [id, canViewInventory], immediate: canViewInventory },
  );
  const product = response?.data;
  const movements = movementResponse?.data?.data ?? [];

  if (loading) return <PageSpinner />;

  if (error || !product) {
    return (
      <div className="card max-w-xl py-10" role="alert">
        <h1 className="font-semibold text-slate-800">Unable to load product</h1>
        <p className="mt-2 text-sm text-slate-500">{error || 'Product not found.'}</p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => refetch(id)} className="btn btn-primary">
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Retry
          </button>
          <Link to="/products" className="btn btn-secondary">Back to products</Link>
        </div>
      </div>
    );
  }

  const lowStock = product.stock <= product.lowStockThreshold;
  const movementBadge = {
    sale: 'badge-red',
    purchase: 'badge-green',
    adjustment: 'badge-blue',
    return_in: 'badge-green',
    return_out: 'badge-yellow',
    damage: 'badge-red',
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" /> Back to Products
        </Link>
        {hasPermission('products:update') && (
          <Link to={`/products/${id}/edit`} className="btn btn-primary">
            <PencilSquareIcon className="h-4 w-4" aria-hidden="true" /> Edit Product
          </Link>
        )}
      </div>

      <section className="card">
        <div className="flex flex-col gap-6 sm:flex-row">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-48 w-full rounded-xl border border-slate-200 object-cover sm:w-48" />
          ) : (
            <div className="flex h-48 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400 sm:w-48">
              <CubeIcon className="h-16 w-16" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{product.name}</h1>
                <p className="mt-1 font-mono text-sm text-slate-500">{product.sku}</p>
              </div>
              <div className="flex gap-2">
                <span className={product.isActive ? 'badge-green' : 'badge-gray'}>{product.isActive ? 'Active' : 'Inactive'}</span>
                <span className={product.stock === 0 ? 'badge-red' : lowStock ? 'badge-yellow' : 'badge-green'}>
                  {product.stock === 0 ? 'Out of stock' : lowStock ? 'Low stock' : 'In stock'}
                </span>
              </div>
            </div>
            {product.description && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{product.description}</p>}
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <div><dt className="text-xs font-medium uppercase text-slate-400">Category</dt><dd className="mt-1 font-medium text-slate-700">{product.category?.name ?? '—'}</dd></div>
              <div><dt className="text-xs font-medium uppercase text-slate-400">Barcode</dt><dd className="mt-1 font-medium text-slate-700">{product.barcode || '—'}</dd></div>
              <div><dt className="text-xs font-medium uppercase text-slate-400">Preferred supplier</dt><dd className="mt-1 font-medium text-slate-700">{product.supplier?.name ?? '—'}</dd></div>
              <div><dt className="text-xs font-medium uppercase text-slate-400">Selling price</dt><dd className="mt-1 font-semibold text-slate-800">{currency.format(product.price)}</dd></div>
              <div><dt className="text-xs font-medium uppercase text-slate-400">Purchase cost</dt><dd className="mt-1 font-semibold text-slate-800">{currency.format(product.cost)}</dd></div>
              <div><dt className="text-xs font-medium uppercase text-slate-400">Available stock</dt><dd className="mt-1 font-semibold text-slate-800">{Number(product.stock).toLocaleString('en-IN')} {product.unit}</dd></div>
              <div><dt className="text-xs font-medium uppercase text-slate-400">Minimum stock level</dt><dd className="mt-1 font-medium text-slate-700">{Number(product.lowStockThreshold).toLocaleString('en-IN')} {product.unit}</dd></div>
              <div><dt className="text-xs font-medium uppercase text-slate-400">Created</dt><dd className="mt-1 text-sm text-slate-700">{dateTime(product.createdAt)}</dd></div>
              <div><dt className="text-xs font-medium uppercase text-slate-400">Last updated</dt><dd className="mt-1 text-sm text-slate-700">{dateTime(product.updatedAt)}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      {canViewInventory && (
        <section className="card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-800">Recent inventory movements</h2>
              <p className="mt-1 text-sm text-slate-500">Stock change history for this product</p>
            </div>
            <Link to="/inventory" className="text-sm font-medium text-primary-600 hover:underline">Open Inventory</Link>
          </div>
          {movementsLoading ? (
            <div className="space-y-3" aria-label="Loading inventory history" aria-busy="true">
              {[1, 2, 3].map((item) => <div key={item} className="h-10 animate-pulse rounded bg-slate-100" />)}
            </div>
          ) : movementsError ? (
            <p className="text-sm text-amber-700" role="alert">Inventory history could not be loaded: {movementsError}</p>
          ) : movements.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No inventory movements recorded yet.</p>
          ) : (
            <div className="table-wrapper border-0">
              <table className="table">
                <thead><tr><th>Type</th><th>Quantity change</th><th>Stock after</th><th>Date</th><th>Reference</th><th>Notes</th></tr></thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {movements.map((movement) => (
                    <tr key={movement._id}>
                      <td><span className={movementBadge[movement.type] || 'badge-gray'}>{movement.type.replace('_', ' ')}</span></td>
                      <td className={movement.quantityChange < 0 ? 'font-medium text-red-600' : 'font-medium text-green-700'}>
                        {movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange} {product.unit}
                      </td>
                      <td>{movement.quantityAfter} {product.unit}</td>
                      <td>{dateTime(movement.createdAt)}</td>
                      <td className="font-mono text-xs">
                        {movement.reference && movement.referenceModel === 'Sale' && hasPermission('sales:read') ? (
                          <Link to={`/sales/${movement.reference}`} className="text-primary-600 hover:underline">Sale · {movement.reference}</Link>
                        ) : movement.reference && movement.referenceModel === 'Purchase' && hasPermission('purchases:read') ? (
                          <Link to={`/purchases/${movement.reference}`} className="text-primary-600 hover:underline">Purchase · {movement.reference}</Link>
                        ) : movement.reference ? `${movement.referenceModel || 'Transaction'} · ${movement.reference}` : '—'}
                      </td>
                      <td className="max-w-48 truncate">{movement.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
