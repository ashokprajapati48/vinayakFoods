'use client';

/**
 * ThermalReceiptModal
 * ─────────────────────────────────────────────────────────────────
 * Displays a photorealistic on-screen preview of an 80 mm thermal
 * receipt (or a KOT slip) and lets the cashier:
 *   • Print to an ESC/POS / thermal printer via window.print()
 *   • Save as PDF via the browser's print-to-PDF option
 *   • Print a KOT (Kitchen Order Ticket) — prices stripped out
 *
 * The component is fully self-contained: no extra deps required.
 * ─────────────────────────────────────────────────────────────────
 */

import { useRef } from 'react';
import { X, Printer, FileText, ChefHat } from 'lucide-react';
import type { Order } from '@/types';
import { formatMoney, toNum } from '@/lib/utils';

// ── Constants ────────────────────────────────────────────────────

const RESTAURANT_NAME = 'VINAYAK FOODS';
const RESTAURANT_ADDRESS = 'Main Road, Badwani, M.P. - 451551';
const RESTAURANT_PHONE = '+91 XXXXX XXXXX';
const RESTAURANT_GSTIN = 'GSTIN: 23XXXXX1234X1ZX';
const THANK_YOU_MSG = 'Thank you! Visit Again  🙏';
const GST_RATE = 0.05; // 5% GST — adjust as needed

// ── Helpers ──────────────────────────────────────────────────────

function dashedLine(char = '─') {
  return char.repeat(32);
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function methodLabel(m?: string) {
  if (!m) return '—';
  const map: Record<string, string> = {
    CASH: 'Cash',
    ONLINE: 'UPI / Online',
    CREDIT: 'Credit Account',
  };
  return map[m] ?? m;
}

// ── Main component ───────────────────────────────────────────────

interface Props {
  order: Order;
  cashierName?: string;
  onClose: () => void;
}

export default function ThermalReceiptModal({ order, cashierName, onClose }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Financial breakdown
  const subtotal = toNum(order.subtotal ?? order.total);
  const gstAmount = Math.round(subtotal * GST_RATE * 100) / 100;
  const netTotal = toNum(order.total);

  // ── Print helpers ──────────────────────────────────────────────

  /** Opens the browser print dialog scoped to just the receipt area. */
  const printDocument = (kotMode: boolean) => {
    const content = receiptRef.current?.innerHTML ?? '';
    const printWindow = window.open('', '_blank', 'width=400,height=700');
    if (!printWindow) return;

    const kotStyle = kotMode
      ? '.receipt-prices { display: none !important; } .receipt-totals { display: none !important; } .receipt-payment { display: none !important; }'
      : '';

    printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${kotMode ? 'KOT' : 'Receipt'} — ${RESTAURANT_NAME}</title>
  <style>
    /* ── Reset ── */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    /* ── 80 mm thermal paper ── */
    @page {
      size: 80mm auto;
      margin: 4mm 3mm;
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.45;
      color: #000;
      background: #fff;
      width: 72mm;
    }

    /* ── Layout helpers ── */
    .center { text-align: center; }
    .right  { text-align: right; }
    .bold   { font-weight: bold; }
    .small  { font-size: 9px; }
    .large  { font-size: 15px; }
    .xl     { font-size: 18px; }

    /* ── Dividers ── */
    .dashed { border-top: 1px dashed #000; margin: 3px 0; }
    .solid  { border-top: 1px solid  #000; margin: 3px 0; }

    /* ── Row helpers ── */
    .row    { display: flex; justify-content: space-between; }
    .row-start { display: flex; gap: 6px; }
    .flex-1 { flex: 1; min-width: 0; }
    .nowrap { white-space: nowrap; }

    /* ── KOT overrides ── */
    ${kotStyle}
  </style>
</head>
<body>
${content}
</body>
</html>
`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    // printWindow.close(); — leave open so user can Save as PDF
  };

  // ── JSX ────────────────────────────────────────────────────────

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* ── Modal shell ── */}
      <div
        className="relative w-full max-w-lg flex flex-col"
        style={{ maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header bar ── */}
        <div
          className="flex items-center justify-between px-5 py-3 rounded-t-2xl"
          style={{ background: '#1e293b', borderBottom: '1px solid rgba(148,163,184,0.15)' }}
        >
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-orange-400" />
            <span className="font-bold text-white">Bill Preview</span>
            <span className="text-xs text-slate-400 ml-1">#{order.orderNumber}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable receipt preview ── */}
        <div
          className="overflow-y-auto flex-1"
          style={{
            background: '#0f172a',
            padding: '24px 20px',
            scrollbarWidth: 'thin',
          }}
        >
          {/* ── Thermal paper simulation ── */}
          <div
            className="mx-auto"
            style={{
              width: '288px',       /* ≈ 72mm at 96 dpi */
              background: '#fffef9',
              boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
              borderRadius: '3px',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '11px',
              color: '#000',
              lineHeight: '1.5',
              padding: '14px 12px',
            }}
            ref={receiptRef}
          >
            {/* ── Header ── */}
            <div className="center">
              <div className="xl bold">{RESTAURANT_NAME}</div>
              <div className="small" style={{ marginTop: 2 }}>{RESTAURANT_ADDRESS}</div>
              <div className="small">Ph: {RESTAURANT_PHONE}</div>
              <div className="small">{RESTAURANT_GSTIN}</div>
            </div>

            <div className="dashed" style={{ margin: '6px 0' }} />

            {/* ── Invoice / Order info ── */}
            <div>
              <div className="row">
                <span>Invoice #:</span>
                <span className="bold">{order.orderNumber}</span>
              </div>
              <div className="row">
                <span>Date:</span>
                <span>{fmtDateTime(order.createdAt)}</span>
              </div>
              <div className="row">
                <span>Type:</span>
                <span className="bold">
                  {order.type === 'DINE_IN'
                    ? `Dine-In — Table ${order.table?.number ?? '—'}`
                    : 'Delivery'}
                </span>
              </div>
              {order.customer && (
                <div className="row">
                  <span>Customer:</span>
                  <span>{order.customer.name}</span>
                </div>
              )}
              {order.customer?.mobile && (
                <div className="row">
                  <span>Phone:</span>
                  <span>{order.customer.mobile}</span>
                </div>
              )}
              {order.deliveryInfo?.address && (
                <div style={{ marginTop: 2 }}>
                  <span>Addr: </span>
                  <span style={{ wordBreak: 'break-word' }}>{order.deliveryInfo.address}</span>
                </div>
              )}
              {cashierName && (
                <div className="row">
                  <span>Cashier:</span>
                  <span>{cashierName}</span>
                </div>
              )}
            </div>

            <div className="dashed" style={{ margin: '6px 0' }} />

            {/* ── Items ── */}
            <div>
              {/* Column header */}
              <div className="row bold small" style={{ marginBottom: 3 }}>
                <span style={{ flex: 1 }}>Item</span>
                <span style={{ width: 24, textAlign: 'center' }}>Qty</span>
                <span className="receipt-prices" style={{ width: 44, textAlign: 'right' }}>Rate</span>
                <span className="receipt-prices" style={{ width: 44, textAlign: 'right' }}>Amt</span>
              </div>

              {order.orderItems.map((item) => (
                <div key={item.id} style={{ marginBottom: 4 }}>
                  <div className="row">
                    <span style={{ flex: 1, wordBreak: 'break-word', paddingRight: 4 }}>
                      {item.menuItem?.name ?? 'Item'}
                    </span>
                    <span style={{ width: 24, textAlign: 'center' }}>{item.quantity}</span>
                    <span className="receipt-prices" style={{ width: 44, textAlign: 'right' }}>
                      {formatMoney(item.unitPrice)}
                    </span>
                    <span className="receipt-prices" style={{ width: 44, textAlign: 'right' }}>
                      {formatMoney(item.totalPrice)}
                    </span>
                  </div>
                  {item.notes && (
                    <div style={{ fontSize: 9, color: '#555', paddingLeft: 4 }}>
                      * {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── Totals ── */}
            <div className="receipt-totals">
              <div className="dashed" style={{ margin: '6px 0' }} />

              <div className="row">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="row">
                <span>GST (5%)</span>
                <span>{formatMoney(gstAmount)}</span>
              </div>

              <div className="solid" style={{ margin: '4px 0' }} />

              <div className="row bold large">
                <span>NET TOTAL</span>
                <span>₹ {formatMoney(netTotal)}</span>
              </div>
            </div>

            {/* ── Payment ── */}
            {order.payment && (
              <div className="receipt-payment">
                <div className="dashed" style={{ margin: '6px 0' }} />
                <div className="row">
                  <span>Payment</span>
                  <span className="bold">{methodLabel(order.payment.method)}</span>
                </div>
                <div className="row">
                  <span>Status</span>
                  <span className="bold" style={{ color: '#16a34a' }}>✔ PAID</span>
                </div>
                {order.payment.transactionId && (
                  <div className="row small">
                    <span>Ref#</span>
                    <span>{order.payment.transactionId}</span>
                  </div>
                )}
              </div>
            )}

            <div className="dashed" style={{ margin: '8px 0' }} />

            {/* ── Footer ── */}
            <div className="center small" style={{ lineHeight: 1.6 }}>
              <div>{THANK_YOU_MSG}</div>
              <div style={{ marginTop: 4 }}>
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              </div>
              <div style={{ fontSize: 8, marginTop: 2 }}>
                Powered by Vinayak Foods POS
              </div>
            </div>
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div
          className="flex flex-wrap gap-2 px-5 py-4 rounded-b-2xl"
          style={{ background: '#1e293b', borderTop: '1px solid rgba(148,163,184,0.12)' }}
        >
          {/* Print Bill */}
          <button
            onClick={() => printDocument(false)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'rgba(249,115,22,0.15)',
              border: '1px solid rgba(249,115,22,0.4)',
              color: '#fb923c',
            }}
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>

          {/* Print KOT */}
          <button
            onClick={() => printDocument(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'rgba(168,85,247,0.12)',
              border: '1px solid rgba(168,85,247,0.35)',
              color: '#c084fc',
            }}
          >
            <ChefHat className="w-4 h-4" />
            Print KOT
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'rgba(148,163,184,0.08)',
              border: '1px solid rgba(148,163,184,0.2)',
              color: '#94a3b8',
            }}
          >
            <FileText className="w-4 h-4" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
