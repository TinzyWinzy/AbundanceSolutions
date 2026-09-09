import { supabase } from '@/lib/supabase/client';

const BUCKET = 'machinery';
const MAX_DIM = 1200;
const MAX_BYTES = 8 * 1024 * 1024;

function uuid(): string {
  return crypto.randomUUID();
}

/**
 * Compress a picked image for low-bandwidth catalogs.
 * Rejects non-images and files over 8MB before touching the network.
 */
export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPEG, PNG or WebP).');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image is too large - please choose one under 8MB.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image processing is not supported on this device.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.78)
  );
  if (!blob) throw new Error('Could not process this image.');
  return blob;
}

/**
 * Uploads to Supabase Storage and returns the public URL.
 * Requires connectivity - binary uploads cannot queue in the offline outbox.
 */
export async function uploadMachineImage(file: File): Promise<string> {
  if (!navigator.onLine) {
    throw new Error('Connect to the internet to upload images. The listing can still be saved without one.');
  }
  const blob = await compressImage(file);
  const path = `uploads/${uuid()}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false
  });
  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
