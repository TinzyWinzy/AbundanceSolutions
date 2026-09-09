import { useUI } from '@/stores/ui';

export function BandwidthToggle() {
  const { bandwidthSaver, toggleBandwidthSaver } = useUI();

  return (
    <button
      className={`icon-btn${bandwidthSaver ? ' on' : ''}`}
      onClick={toggleBandwidthSaver}
      title={bandwidthSaver ? 'Data saver on — tap for full images' : 'Save mobile data — tap to hide heavy images'}
      aria-pressed={bandwidthSaver}
      aria-label="Toggle data saver"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 19a9 9 0 1 1 14 0"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 13l4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="13" r="1.6" fill="currentColor" />
      </svg>
    </button>
  );
}
