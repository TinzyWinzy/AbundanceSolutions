import { useStatus } from '@powersync/react';
import { useState } from 'react';
import { useInventory, useSites, useCategories, useLowStock } from '@/hooks/useInventory';
import { useFinancialLogs, useFinancialSummary } from '@/hooks/useFinancialLogs';
import { formatMoney } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/States';
import { InventoryTable } from './InventoryTable';
import { InventoryForm } from './InventoryForm';
import { Customers } from './Customers';
import { FinancialLogTable } from './FinancialLogTable';
import { FinancialLogForm } from './FinancialLogForm';
import { InventoryEditForm } from './InventoryEditForm';
import { Invoices } from './Invoices';
import { Orders } from './Orders';
import { Overview, type AdminTab } from './Overview';
import { Settings } from './Settings';
import { Team } from './Team';
import type { InventoryAsset } from '@/lib/powersync/AppSchema';

export function Dashboard() {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [inventoryModal, setInventoryModal] = useState(false);
  const [logModal, setLogModal] = useState(false);
  const [editing, setEditing] = useState<InventoryAsset | null>(null);

  const status = useStatus();
  const { assets, isLoading } = useInventory();
  const { lowStock } = useLowStock();
  const { sites } = useSites();
  const { categories } = useCategories();
  const { logs } = useFinancialLogs(200);
  const { summary } = useFinancialSummary();

  const syncLabel = status?.connected
    ? 'Online · synced'
    : status?.hasSynced === false
      ? 'Pending sync'
      : 'Syncing…';

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {summary.map((row) => (
          <div className="card" style={{ padding: 16 }} key={row.currency}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {row.currency} revenue
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              {formatMoney(row.total, row.currency)}
            </div>
          </div>
        ))}

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Low stock
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{lowStock.length} items</div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Sync status
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{syncLabel}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`btn ${tab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('overview')}
          >
            Overview
          </button>
          <button
            className={`btn ${tab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('inventory')}
          >
            Equipment
          </button>
          <button
            className={`btn ${tab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('logs')}
          >
            Transactions
          </button>
          <button
            className={`btn ${tab === 'invoices' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('invoices')}
          >
            Invoices
          </button>
          <button
            className={`btn ${tab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('orders')}
          >
            Orders
          </button>
          <button
            className={`btn ${tab === 'customers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('customers')}
          >
            Customers
          </button>
          <button
            className={`btn ${tab === 'team' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('team')}
          >
            Team
          </button>
          <button
            className={`btn ${tab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('settings')}
          >
            Settings
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'inventory' ? (
            <Button onClick={() => setInventoryModal(true)}>Add equipment</Button>
          ) : tab === 'logs' ? (
            <Button onClick={() => setLogModal(true)}>Log transaction</Button>
          ) : null}
        </div>
      </div>

      {tab === 'overview' ? (
        <Overview onNavigate={setTab} />
      ) : isLoading ? (
        <Spinner />
      ) : tab === 'inventory' ? (
        <InventoryTable assets={assets} onEdit={setEditing} />
      ) : tab === 'logs' ? (
        <FinancialLogTable logs={logs} />
      ) : tab === 'invoices' ? (
        <Invoices assets={assets} />
      ) : tab === 'orders' ? (
        <Orders assets={assets} onInvoiced={() => setTab('invoices')} />
      ) : tab === 'customers' ? (
        <Customers />
      ) : tab === 'team' ? (
        <Team />
      ) : (
        <Settings />
      )}

      <Modal open={inventoryModal} title="Add equipment" onClose={() => setInventoryModal(false)}>
        <InventoryForm
          categories={categories}
          sites={sites}
          onDone={() => setInventoryModal(false)}
        />
      </Modal>

      <Modal open={logModal} title="Log transaction" onClose={() => setLogModal(false)}>
        <FinancialLogForm assets={assets} sites={sites} onDone={() => setLogModal(false)} />
      </Modal>

      <Modal
        open={editing !== null}
        title={editing ? `Edit ${editing.name}` : 'Edit equipment'}
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <InventoryEditForm
            key={editing.id}
            asset={editing}
            categories={categories}
            sites={sites}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Modal>
    </div>
  );
}
