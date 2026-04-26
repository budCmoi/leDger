import { startTransition, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { Button } from '../components/common/Button';
import { PageTransition } from '../components/common/PageTransition';
import { formatCurrency } from '../lib/utils';
import { bootstrapApi, purchaseInvoiceApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';

const DEFAULT_VAT_RATE = 5.5;
const BEER_VAT_RATE = 20;
const BEER_KEYWORDS = ['biere', 'beer'];

type EntryLine = {
  id: string;
  code: string;
  name: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  productId: string;
};

type EditableColumn = 'code' | 'name' | 'quantity' | 'unitPrice' | 'vatRate';

const editableColumns: EditableColumn[] = ['code', 'name', 'quantity', 'unitPrice', 'vatRate'];

const createLine = (id: string): EntryLine => ({
  id,
  code: '',
  name: '',
  quantity: '1',
  unitPrice: '0',
  vatRate: String(DEFAULT_VAT_RATE),
  productId: '',
});

const toNumber = (value: string) => {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const isBeerProduct = (name: string) => BEER_KEYWORDS.some((keyword) => name.toLowerCase().includes(keyword));

const getDefaultVatRate = (productName: string) => (isBeerProduct(productName) ? BEER_VAT_RATE : DEFAULT_VAT_RATE);

const lineTotals = (line: EntryLine) => {
  const quantity = toNumber(line.quantity);
  const unitPrice = toNumber(line.unitPrice);
  const vatRate = toNumber(line.vatRate);

  const totalHt = quantity * unitPrice;
  const vatAmount = totalHt * (vatRate / 100);
  const totalTtc = totalHt + vatAmount;

  return {
    totalHt,
    totalTtc,
  };
};

export default function InvoicesPage() {
  const products = useAppStore((state) => state.products);
  const setRestaurantBootstrap = useAppStore((state) => state.setRestaurantBootstrap);

  const lineCounterRef = useRef(1);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState('');
  const [supplier, setSupplier] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [targetTotal, setTargetTotal] = useState('0');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lines, setLines] = useState<EntryLine[]>([createLine('1')]);

  const refreshWorkspace = async () => {
    startTransition(() => {
      void bootstrapApi.loadRestaurantWorkspace().then((payload) => {
        setRestaurantBootstrap(payload);
      });
    });
  };

  const appendLine = () => {
    lineCounterRef.current += 1;
    setLines((current) => [...current, createLine(String(lineCounterRef.current))]);
    return lines.length;
  };

  const focusCell = (rowIndex: number, column: EditableColumn) => {
    window.requestAnimationFrame(() => {
      const refKey = `${rowIndex}-${column}`;
      inputRefs.current[refKey]?.focus();
      inputRefs.current[refKey]?.select();
    });
  };

  const findProductMatch = (line: EntryLine) => {
    const normalizedCode = line.code.trim().toLowerCase();
    const normalizedName = line.name.trim().toLowerCase();

    const byProductId = line.productId ? products.find((product) => product.id === line.productId) : null;
    if (byProductId) {
      return byProductId;
    }

    const byCode = normalizedCode
      ? products.find((product) => {
          const productCode = product.id.toLowerCase();
          return productCode === normalizedCode || productCode.startsWith(normalizedCode);
        })
      : null;

    if (byCode) {
      return byCode;
    }

    if (!normalizedName) {
      return null;
    }

    return products.find((product) => product.name.trim().toLowerCase() === normalizedName) ?? null;
  };

  const patchLine = (lineIndex: number, patch: Partial<EntryLine>) => {
    setLines((current) =>
      current.map((line, index) => {
        if (index !== lineIndex) {
          return line;
        }

        const nextLine = { ...line, ...patch };
        const matchedProduct = findProductMatch(nextLine);

        if (matchedProduct) {
          return {
            ...nextLine,
            productId: matchedProduct.id,
            code: nextLine.code || matchedProduct.id,
            name: nextLine.name || matchedProduct.name,
            vatRate: patch.vatRate !== undefined ? nextLine.vatRate : String(getDefaultVatRate(nextLine.name || matchedProduct.name)),
          };
        }

        return {
          ...nextLine,
          productId: '',
          vatRate: patch.vatRate !== undefined ? nextLine.vatRate : String(getDefaultVatRate(nextLine.name)),
        };
      }),
    );
  };

  const isLineFilled = (line: EntryLine) => {
    const hasIdentifier = line.code.trim() || line.name.trim();
    return Boolean(hasIdentifier && toNumber(line.quantity) > 0 && toNumber(line.unitPrice) >= 0);
  };

  const handleEnterNavigation = (event: KeyboardEvent<HTMLInputElement>, rowIndex: number, column: EditableColumn) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();

    const columnIndex = editableColumns.indexOf(column);
    const isLastColumn = columnIndex === editableColumns.length - 1;
    const isLastRow = rowIndex === lines.length - 1;
    const rowIsFilled = isLineFilled(lines[rowIndex]);

    if (isLastRow && rowIsFilled) {
      appendLine();
    }

    if (isLastColumn && isLastRow && rowIsFilled) {
      const nextRowIndex = lines.length;
      focusCell(nextRowIndex, 'code');
      return;
    }

    const nextColumn = editableColumns[(columnIndex + 1) % editableColumns.length];
    const nextRowIndex = isLastColumn ? Math.min(rowIndex + 1, lines.length - 1) : rowIndex;
    focusCell(nextRowIndex, nextColumn);
  };

  const totals = useMemo(
    () =>
      lines.reduce(
        (summary, line) => {
          if (!isLineFilled(line)) {
            return summary;
          }

          const computed = lineTotals(line);

          return {
            totalHt: summary.totalHt + computed.totalHt,
            totalTtc: summary.totalTtc + computed.totalTtc,
          };
        },
        { totalHt: 0, totalTtc: 0 },
      ),
    [lines],
  );

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!reference.trim() || !supplier.trim()) {
      setErrorMessage('Reference et fournisseur sont obligatoires.');
      return;
    }

    const meaningfulLines = lines.filter((line) => isLineFilled(line));

    if (meaningfulLines.length === 0) {
      setErrorMessage('Ajoute au moins une ligne produit.');
      return;
    }

    const unresolvedLineIndex = meaningfulLines.findIndex((line) => !findProductMatch(line));

    if (unresolvedLineIndex >= 0) {
      setErrorMessage(`Produit introuvable sur la ligne ${unresolvedLineIndex + 1}.`);
      return;
    }

    setBusy(true);

    try {
      await purchaseInvoiceApi.create({
        reference: reference.trim(),
        supplier: supplier.trim(),
        invoiceDate,
        items: meaningfulLines.map((line) => {
          const product = findProductMatch(line)!;

          return {
            productId: product.id,
            quantity: toNumber(line.quantity),
            unitPrice: toNumber(line.unitPrice),
          };
        }),
      });

      await refreshWorkspace();
      setReference('');
      setSupplier('');
      setInvoiceDate(new Date().toISOString().slice(0, 10));
      setTargetTotal('0');
      lineCounterRef.current = 1;
      setLines([createLine('1')]);
      focusCell(0, 'code');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageTransition>
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <header className="border border-white/10 bg-white/[0.03] px-3 py-3">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="h-10 min-w-[180px] border border-white/12 bg-black/30 px-3 text-xs text-white outline-none"
                onChange={(event) => setReference(event.target.value)}
                placeholder="Reference facture"
                value={reference}
              />
              <input
                className="h-10 min-w-[220px] border border-white/12 bg-black/30 px-3 text-xs text-white outline-none"
                onChange={(event) => setSupplier(event.target.value)}
                placeholder="Fournisseur"
                value={supplier}
              />
              <input
                className="h-10 min-w-[160px] border border-white/12 bg-black/30 px-3 text-xs text-white outline-none"
                onChange={(event) => setInvoiceDate(event.target.value)}
                type="date"
                value={invoiceDate}
              />
            </div>

            <div className="flex min-w-[190px] flex-col items-stretch gap-2">
              <Button disabled={busy} type="submit">
                Enregistrer la facture
              </Button>
              <Button onClick={handlePrint} type="button" variant="ghost">
                Imprimer la facture
              </Button>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              className="h-10 border border-white/12 bg-black/30 px-3 text-xs text-white outline-none"
              min="0"
              onChange={(event) => setTargetTotal(event.target.value)}
              placeholder="Montant total facture"
              step="0.01"
              type="number"
              value={targetTotal}
            />
            <input
              className="h-10 border border-white/12 bg-black/20 px-3 text-xs text-white outline-none"
              readOnly
              tabIndex={-1}
              value={formatCurrency(totals.totalTtc)}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-white/65">
            <span>Total actuel produits</span>
            <span>
              Ecart: {formatCurrency(Math.abs(toNumber(targetTotal) - totals.totalTtc))}
            </span>
          </div>
        </header>

        {errorMessage ? <p className="text-xs uppercase tracking-[0.15em] text-[#ff9077]">{errorMessage}</p> : null}

        <div className="w-full border border-white/10 bg-white/[0.02]">
            <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,2.2fr)_minmax(0,0.8fr)_minmax(0,0.95fr)_minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,1fr)] gap-0 border-b border-white/10 text-[10px] uppercase tracking-[0.16em] text-white/45">
              <span className="border-r border-white/10 px-2 py-2">Code produit</span>
              <span className="border-r border-white/10 px-2 py-2">Nom produit</span>
              <span className="border-r border-white/10 px-2 py-2">Quantite</span>
              <span className="border-r border-white/10 px-2 py-2">Prix unitaire</span>
              <span className="border-r border-white/10 px-2 py-2">TVA %</span>
              <span className="border-r border-white/10 px-2 py-2">Total HT</span>
              <span className="px-2 py-2">Total TTC</span>
            </div>

            {lines.map((line, rowIndex) => {
              const computed = lineTotals(line);

              return (
                <div
                  className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,2.2fr)_minmax(0,0.8fr)_minmax(0,0.95fr)_minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-0 border-b border-white/8"
                  key={line.id}
                >
                  <input
                    className="h-9 w-full border-0 border-r border-white/10 bg-black/25 px-2 text-xs text-white outline-none"
                    onChange={(event) => patchLine(rowIndex, { code: event.target.value })}
                    onKeyDown={(event) => handleEnterNavigation(event, rowIndex, 'code')}
                    placeholder="Code"
                    ref={(element) => {
                      inputRefs.current[`${rowIndex}-code`] = element;
                    }}
                    value={line.code}
                  />

                  <input
                    className="h-9 w-full border-0 border-r border-white/10 bg-black/25 px-2 text-xs text-white outline-none"
                    onChange={(event) => patchLine(rowIndex, { name: event.target.value })}
                    onKeyDown={(event) => handleEnterNavigation(event, rowIndex, 'name')}
                    placeholder="Nom produit"
                    ref={(element) => {
                      inputRefs.current[`${rowIndex}-name`] = element;
                    }}
                    value={line.name}
                  />

                  <input
                    className="h-9 w-full border-0 border-r border-white/10 bg-black/25 px-2 text-xs text-white outline-none"
                    min="0"
                    onChange={(event) => patchLine(rowIndex, { quantity: event.target.value })}
                    onKeyDown={(event) => handleEnterNavigation(event, rowIndex, 'quantity')}
                    placeholder="0"
                    ref={(element) => {
                      inputRefs.current[`${rowIndex}-quantity`] = element;
                    }}
                    step="0.01"
                    type="number"
                    value={line.quantity}
                  />

                  <input
                    className="h-9 w-full border-0 border-r border-white/10 bg-black/25 px-2 text-xs text-white outline-none"
                    min="0"
                    onChange={(event) => patchLine(rowIndex, { unitPrice: event.target.value })}
                    onKeyDown={(event) => handleEnterNavigation(event, rowIndex, 'unitPrice')}
                    placeholder="0"
                    ref={(element) => {
                      inputRefs.current[`${rowIndex}-unitPrice`] = element;
                    }}
                    step="0.01"
                    type="number"
                    value={line.unitPrice}
                  />

                  <input
                    className="h-9 w-full border-0 border-r border-white/10 bg-black/25 px-2 text-xs text-white outline-none"
                    min="0"
                    onChange={(event) => patchLine(rowIndex, { vatRate: event.target.value })}
                    onKeyDown={(event) => handleEnterNavigation(event, rowIndex, 'vatRate')}
                    placeholder="5.5"
                    ref={(element) => {
                      inputRefs.current[`${rowIndex}-vatRate`] = element;
                    }}
                    step="0.1"
                    type="number"
                    value={line.vatRate}
                  />

                  <input
                    className="h-9 w-full border-0 border-r border-white/10 bg-black/20 px-2 text-xs text-white/80 outline-none"
                    readOnly
                    tabIndex={-1}
                    value={formatCurrency(computed.totalHt)}
                  />
                  <input
                    className="h-9 w-full border-0 bg-black/20 px-2 text-xs text-white outline-none"
                    readOnly
                    tabIndex={-1}
                    value={formatCurrency(computed.totalTtc)}
                  />
                </div>
              );
            })}
        </div>

        <div className="flex items-center justify-end gap-4 border border-white/10 bg-white/[0.02] px-3 py-2 text-xs uppercase tracking-[0.14em] text-white/70">
          <span>Total HT: {formatCurrency(totals.totalHt)}</span>
          <span>Total TTC: {formatCurrency(totals.totalTtc)}</span>
        </div>
      </form>
    </PageTransition>
  );
}
