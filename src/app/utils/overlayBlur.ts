const overlayCountKey = 'autocareOverlayCount';

export function acquireOverlayBlur() {
  if (typeof document === 'undefined') return () => {};

  const currentCount = Number(document.body.dataset[overlayCountKey] || 0);
  const nextCount = currentCount + 1;
  document.body.dataset[overlayCountKey] = String(nextCount);
  document.body.classList.add('app-overlay-open');

  return () => {
    const activeCount = Number(document.body.dataset[overlayCountKey] || 1);
    const remainingCount = Math.max(0, activeCount - 1);

    if (remainingCount === 0) {
      delete document.body.dataset[overlayCountKey];
      document.body.classList.remove('app-overlay-open');
      return;
    }

    document.body.dataset[overlayCountKey] = String(remainingCount);
  };
}
