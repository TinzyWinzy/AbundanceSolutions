import { useUI } from '@/stores/ui';

export function BandwidthToggle() {
  const { bandwidthSaver, toggleBandwidthSaver } = useUI();

  return (
    <button
      className="btn btn-secondary"
      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
      onClick={toggleBandwidthSaver}
      title="Disable high-definition images to save data"
      aria-pressed={bandwidthSaver}
    >
      {bandwidthSaver ? '📶 Data saver: ON' : '📶 Data saver: OFF'}
    </button>
  );
}
