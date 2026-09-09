import type { PaymentReceipt, ProFormaInvoice } from '@/lib/powersync/AppSchema';
import { formatDate, formatMoney } from '@/utils/format';
import { labelFor } from '@/utils/constants';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export function ReceiptPrintModal({
  receipt,
  invoice,
  onClose
}: {
  receipt: PaymentReceipt;
  invoice: ProFormaInvoice;
  onClose: () => void;
}) {
  return (
    <Modal open title={receipt.receipt_number ?? 'Receipt'} onClose={onClose}>
      <div className="print-doc">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Abundance Solutions</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Payment Receipt</div>
        </div>

        <div style={{ fontSize: '0.9rem', display: 'grid', gap: 6, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Receipt</span>
            <strong>{receipt.receipt_number}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Date</span>
            <span>{formatDate(receipt.created_at)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Received from</span>
            <span>{invoice.customer_name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>For invoice</span>
            <span>{invoice.invoice_number}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Method</span>
            <span>{labelFor(receipt.payment_method ?? '')}</span>
          </div>
          {receipt.reference_number ? (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Reference</span>
              <span>{receipt.reference_number}</span>
            </div>
          ) : null}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.2rem',
              fontWeight: 800,
              borderTop: '1px solid var(--border)',
              paddingTop: 8,
              marginTop: 4
            }}
          >
            <span>Amount</span>
            <span>{formatMoney(receipt.amount_paid, receipt.currency ?? 'USD')}</span>
          </div>
        </div>
      </div>

      <div className="no-print">
        <Button block variant="secondary" onClick={() => window.print()}>
          Print / PDF
        </Button>
      </div>
    </Modal>
  );
}
