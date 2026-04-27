import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { LoaderCircle, Plus, Search, Trash2 } from 'lucide-react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import { useNavigate } from 'react-router-dom';

import { Button } from '../components/common/Button';
import { PageTransition } from '../components/common/PageTransition';
import { SectionHeading } from '../components/common/SectionHeading';
import { cn, formatCurrency } from '../lib/utils';
import { productApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import type { InventoryProduct, ProductCategory, ProductInventoryType } from '../types';

const PAGE_SIZE = 120;
const ROW_HEIGHT = 48;

const categoryLabels: Record<ProductCategory, string> = {
  fresh: 'Frais',
  frozen: 'Surgeles',
  dry: 'Sec',
};

const typeLabels: Record<ProductInventoryType, string> = {
  fresh: 'Frais',
  frozen: 'Surgeles',
  dry: 'Sec',
  bio: 'Bio',
};

type EditableField = 'price' | 'quantity';

type ActiveCell = {
  productId: string;
  field: EditableField;
} | null;

type InventoryRowData = {
  products: InventoryProduct[];
  activeCell: ActiveCell;
  draftValue: string;
  savingCell: ActiveCell;
  deletingId: string | null;
  onActivateCell: (product: InventoryProduct, field: EditableField) => void;
  onDraftChange: (value: string) => void;
  onCommitCell: (product: InventoryProduct, field: EditableField) => Promise<void>;
  onCancelCell: () => void;
  onDelete: (product: InventoryProduct) => void;
};

const useDebouncedValue = <T,>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delay, value]);

  return debouncedValue;
};

const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return viewportHeight;
};

const formatQuantity = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
  }).format(value);

const InventoryRow = ({ data, index, style }: ListChildComponentProps<InventoryRowData>) => {
  const product = data.products[index];

  if (!product) {
    return (
      <div className="flex items-center justify-center border-b border-white/6 px-4 text-xs uppercase tracking-[0.22em] text-white/38" style={style}>
        <span className="inline-flex items-center gap-2">
          <LoaderCircle className="animate-spin" size={14} />
          Chargement de la page suivante
        </span>
      </div>
    );
  }

  const isEditingPrice = data.activeCell?.productId === product.id && data.activeCell.field === 'price';
  const isEditingQuantity = data.activeCell?.productId === product.id && data.activeCell.field === 'quantity';
  const isSavingPrice = data.savingCell?.productId === product.id && data.savingCell.field === 'price';
  const isSavingQuantity = data.savingCell?.productId === product.id && data.savingCell.field === 'quantity';
  const isDeleting = data.deletingId === product.id;

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, field: EditableField) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void data.onCommitCell(product, field);
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      data.onCancelCell();
    }
  };

  return (
    <div
      className={cn(
        'border-b border-white/6 text-[13px] text-white/78',
        index % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent',
        product.isLowStock && 'bg-[#331d17]/40',
      )}
      style={style}
    >
      <div className="grid h-full grid-cols-[minmax(0,2.4fr)_130px_112px_112px_112px_88px] items-center gap-3 px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium uppercase tracking-[0.12em] text-white" title={product.description ?? product.name}>
            {product.name}
          </p>
        </div>

        <div className="truncate text-xs uppercase tracking-[0.18em] text-white/52">{categoryLabels[product.category]}</div>

        <div>
          {isEditingQuantity ? (
            <input
              autoFocus
              className="h-8 w-full rounded-lg border border-accent/35 bg-black/45 px-2 text-sm text-white outline-none"
              disabled={isSavingQuantity}
              min="0"
              onBlur={() => void data.onCommitCell(product, 'quantity')}
              onChange={(event) => data.onDraftChange(event.target.value)}
              onKeyDown={(event) => handleKeyDown(event, 'quantity')}
              step="0.01"
              type="number"
              value={data.draftValue}
            />
          ) : (
            <button
              className="inline-flex h-8 items-center gap-2 rounded-lg px-2 text-left text-sm text-white transition hover:bg-white/[0.06]"
              disabled={isDeleting}
              onClick={() => data.onActivateCell(product, 'quantity')}
              type="button"
            >
              {isSavingQuantity ? <LoaderCircle className="animate-spin text-accent" size={14} /> : null}
              <span className="truncate">
                {formatQuantity(product.quantity)} {product.unit}
              </span>
            </button>
          )}
        </div>

        <div>
          {isEditingPrice ? (
            <input
              autoFocus
              className="h-8 w-full rounded-lg border border-accent/35 bg-black/45 px-2 text-sm text-white outline-none"
              disabled={isSavingPrice}
              min="0"
              onBlur={() => void data.onCommitCell(product, 'price')}
              onChange={(event) => data.onDraftChange(event.target.value)}
              onKeyDown={(event) => handleKeyDown(event, 'price')}
              step="0.01"
              type="number"
              value={data.draftValue}
            />
          ) : (
            <button
              className="inline-flex h-8 items-center gap-2 rounded-lg px-2 text-left text-sm text-white transition hover:bg-white/[0.06]"
              disabled={isDeleting}
              onClick={() => data.onActivateCell(product, 'price')}
              type="button"
            >
              {isSavingPrice ? <LoaderCircle className="animate-spin text-accent" size={14} /> : null}
              <span className="truncate">{formatCurrency(product.price)}</span>
            </button>
          )}
        </div>

        <div className="truncate text-xs uppercase tracking-[0.18em] text-white/58">{typeLabels[product.type]}</div>

        <div className="truncate text-xs uppercase tracking-[0.18em] text-white/42">
          {product.isLowStock ? 'Stock faible' : 'Stable'}
        </div>

        <div className="flex justify-end">
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/45 transition hover:bg-[#6e2b1f] hover:text-white"
            disabled={isDeleting || isSavingPrice || isSavingQuantity}
            onClick={() => data.onDelete(product)}
            title="Supprimer le produit"
            type="button"
          >
            {isDeleting ? <LoaderCircle className="animate-spin" size={14} /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProductsPage() {
  const navigate = useNavigate();
  const setProducts = useAppStore((state) => state.setProducts);
  const viewportHeight = useViewportHeight();
  const listRef = useRef<FixedSizeList | null>(null);

  const [products, setProductsState] = useState<InventoryProduct[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | ProductCategory>('all');
  const [type, setType] = useState<'all' | ProductInventoryType>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [activeCell, setActiveCell] = useState<ActiveCell>(null);
  const [draftValue, setDraftValue] = useState('');
  const [savingCell, setSavingCell] = useState<ActiveCell>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(search);
  const debouncedSearch = useDebouncedValue(deferredSearch, 250);
  const requestIdRef = useRef(0);

  const listHeight = Math.max(360, viewportHeight - 330);

  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      category: category === 'all' ? undefined : category,
      type: type === 'all' ? undefined : type,
      lowStock: lowStockOnly || undefined,
    }),
    [category, debouncedSearch, lowStockOnly, type],
  );

  const syncProductInStore = (nextProduct: InventoryProduct) => {
    const currentProducts = useAppStore.getState().products;
    setProducts(
      currentProducts.some((product) => product.id === nextProduct.id)
        ? currentProducts.map((product) => (product.id === nextProduct.id ? nextProduct : product))
        : [nextProduct, ...currentProducts],
    );
  };

  const removeProductFromStore = (productId: string) => {
    const currentProducts = useAppStore.getState().products;
    setProducts(currentProducts.filter((product) => product.id !== productId));
  };

  const loadProducts = async (nextPage: number, mode: 'replace' | 'append') => {
    const requestId = ++requestIdRef.current;

    if (mode === 'replace') {
      setLoadingState('loading');
      setErrorMessage(null);
      setLoadingMore(false);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await productApi.list({
        page: nextPage,
        pageSize: PAGE_SIZE,
        ...filters,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      startTransition(() => {
        setProductsState((current) => (mode === 'replace' ? response.items : [...current, ...response.items]));
        setPage(response.page);
        setTotal(response.total);
        setHasMore(response.hasMore);
        setLoadingState('ready');
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error(error);
      setLoadingState('error');
      setErrorMessage('Impossible de charger l inventaire pour le moment.');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    listRef.current?.scrollTo(0);
    void loadProducts(1, 'replace');
  }, [filters]);

  const handleItemsRendered = ({ visibleStopIndex }: { visibleStopIndex: number }) => {
    if (loadingState !== 'ready' || loadingMore || !hasMore) {
      return;
    }

    if (visibleStopIndex >= products.length - 12) {
      void loadProducts(page + 1, 'append');
    }
  };

  const updateVisibleProduct = (nextProduct: InventoryProduct) => {
    startTransition(() => {
      setProductsState((current) => current.map((product) => (product.id === nextProduct.id ? nextProduct : product)));
    });
    syncProductInStore(nextProduct);
  };

  const handleActivateCell = (product: InventoryProduct, field: EditableField) => {
    setActiveCell({ productId: product.id, field });
    setDraftValue(field === 'price' ? String(product.price) : String(product.quantity));
  };

  const handleCancelCell = () => {
    setActiveCell(null);
    setDraftValue('');
  };

  const handleCommitCell = async (product: InventoryProduct, field: EditableField) => {
    if (activeCell?.productId !== product.id || activeCell.field !== field) {
      return;
    }

    const nextValue = Number(draftValue.replace(',', '.'));

    if (!Number.isFinite(nextValue) || nextValue < 0) {
      handleCancelCell();
      return;
    }

    const previousValue = field === 'price' ? product.price : product.quantity;

    if (nextValue === previousValue) {
      handleCancelCell();
      return;
    }

    setSavingCell({ productId: product.id, field });

    try {
      const updatedProduct = await productApi.update(
        product.id,
        field === 'price' ? { price: nextValue } : { quantity: nextValue },
      );
      updateVisibleProduct(updatedProduct);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingCell(null);
      handleCancelCell();
    }
  };

  const handleDelete = async (product: InventoryProduct) => {
    const confirmed = window.confirm(`Supprimer ${product.name} ?`);

    if (!confirmed) {
      return;
    }

    setDeletingId(product.id);

    try {
      await productApi.remove(product.id);
      startTransition(() => {
        setProductsState((current) => current.filter((item) => item.id !== product.id));
        setTotal((current) => Math.max(current - 1, 0));
      });
      removeProductFromStore(product.id);
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const rowData = useMemo<InventoryRowData>(
    () => ({
      products,
      activeCell,
      draftValue,
      savingCell,
      deletingId,
      onActivateCell: handleActivateCell,
      onDraftChange: setDraftValue,
      onCommitCell: handleCommitCell,
      onCancelCell: handleCancelCell,
      onDelete: handleDelete,
    }),
    [activeCell, deletingId, draftValue, products, savingCell],
  );

  const itemCount = products.length + (hasMore || loadingMore ? 1 : 0);

  return (
    <PageTransition>
      <div className="space-y-6">
        <SectionHeading
          action={
            <Button onClick={() => navigate('/products/new')}>
              <Plus size={16} />
              Ajouter un produit
            </Button>
          }
          description="Gestion des produits existants uniquement : liste, filtres, edition du stock/prix et suppression. La creation se fait sur la page Nouveau produit."
          eyebrow="Inventaire"
          title="Inventaire"
        />

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.8fr)_180px_180px_140px]">
          <label className="flex h-12 items-center gap-3 rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 text-sm text-white/72">
            <Search size={15} />
            <input
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/32"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un produit"
              value={search}
            />
          </label>

          <select
            className="h-12 rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 text-sm text-white outline-none"
            onChange={(event) => setCategory(event.target.value as 'all' | ProductCategory)}
            value={category}
          >
            <option value="all">Toutes categories</option>
            <option value="fresh">Frais</option>
            <option value="frozen">Surgeles</option>
            <option value="dry">Sec</option>
          </select>

          <select
            className="h-12 rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 text-sm text-white outline-none"
            onChange={(event) => setType(event.target.value as 'all' | ProductInventoryType)}
            value={type}
          >
            <option value="all">Tous types</option>
            <option value="fresh">Frais</option>
            <option value="frozen">Surgeles</option>
            <option value="dry">Sec</option>
            <option value="bio">Bio</option>
          </select>

          <button
            className={cn(
              'h-12 rounded-[1.1rem] border px-4 text-sm uppercase tracking-[0.18em] transition',
              lowStockOnly
                ? 'border-accent/40 bg-accent/12 text-accent'
                : 'border-white/8 bg-white/[0.03] text-white/58 hover:text-white',
            )}
            onClick={() => setLowStockOnly((current) => !current)}
            type="button"
          >
            Stock faible
          </button>
        </div>

        <div className="rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_28px_60px_rgba(0,0,0,0.22)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/36">
            <span>
              {products.length.toLocaleString('fr-FR')} affiches / {total.toLocaleString('fr-FR')} references
            </span>
            <span>Pagination backend active · liste virtualisee react-window</span>
          </div>

          <div className="grid grid-cols-[minmax(0,2.4fr)_130px_112px_112px_112px_88px] gap-3 border-b border-white/8 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-white/34">
            <span>Nom</span>
            <span>Categorie</span>
            <span>Stock</span>
            <span>Prix</span>
            <span>Type</span>
            <span className="text-right">Actions</span>
          </div>

          {loadingState === 'loading' && products.length === 0 ? (
            <div className="flex h-[420px] items-center justify-center text-sm uppercase tracking-[0.22em] text-white/42">
              <span className="inline-flex items-center gap-2">
                <LoaderCircle className="animate-spin" size={16} />
                Chargement inventaire
              </span>
            </div>
          ) : null}

          {loadingState === 'error' ? (
            <div className="flex h-[420px] items-center justify-center px-6 text-center text-sm text-white/60">{errorMessage}</div>
          ) : null}

          {loadingState === 'ready' && products.length === 0 ? (
            <div className="flex h-[420px] items-center justify-center px-6 text-center text-sm text-white/60">
              Aucun produit ne correspond aux filtres en cours.
            </div>
          ) : null}

          {products.length > 0 ? (
            <FixedSizeList
              height={listHeight}
              itemCount={itemCount}
              itemData={rowData}
              itemSize={ROW_HEIGHT}
              onItemsRendered={handleItemsRendered}
              overscanCount={10}
              ref={listRef}
              width="100%"
            >
              {InventoryRow}
            </FixedSizeList>
          ) : null}
        </div>
      </div>
    </PageTransition>
  );
}