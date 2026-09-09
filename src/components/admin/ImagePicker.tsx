import { useEffect, useState } from 'react';

interface ImagePickerProps {
  currentUrl: string | null;
  onFile: (file: File | null) => void;
}

/**
 * Image picker with instant local preview. Upload happens at save time
 * (see uploadMachineImage) so offline listing creation still works.
 */
export function ImagePicker({ currentUrl, onFile }: ImagePickerProps) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const shown = preview ?? currentUrl;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (preview) URL.revokeObjectURL(preview);
    if (file) {
      setPreview(URL.createObjectURL(file));
      onFile(file);
    } else {
      setPreview(null);
      onFile(null);
    }
  };

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onFile(null);
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
        Photo
      </div>
      {shown ? (
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <img
            src={shown}
            alt="Equipment preview"
            style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8 }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: 8 }}
            onClick={clear}
          >
            Remove photo
          </button>
        </div>
      ) : null}
      <input type="file" accept="image/*" onChange={handleChange} aria-label="Choose equipment photo" />
      {!navigator.onLine ? (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
          Offline: the listing saves without a photo. Add one when reconnected.
        </p>
      ) : null}
    </div>
  );
}
