"use client";

import { useId, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { usePwa } from "@/hooks/usePwa";
import styles from "./PwaControls.module.css";

export default function PwaControls() {
  const { content } = useLanguage();
  const {
    online,
    offlineReady,
    canInstall,
    showIosInstall,
    installing,
    installApp,
    updateAvailable,
    updating,
    applyUpdate,
  } = usePwa();
  const [showInstructions, setShowInstructions] = useState(false);
  const instructionsId = useId();
  const status = !online
    ? offlineReady
      ? content.pwa.offlineAvailable
      : content.pwa.offline
    : offlineReady
      ? content.pwa.ready
      : null;

  if (!status && !canInstall && !installing && !showIosInstall && !updateAvailable) return null;

  return (
    <section className={styles.controls} aria-label={content.pwa.label}>
      <div className={styles.row}>
        <div className={styles.status} role="status" aria-live="polite" aria-atomic="true">
          {status && <p>{status}</p>}
          {updateAvailable && <p>{content.pwa.updateAvailable}</p>}
        </div>
        <div className={styles.actions}>
          {(canInstall || installing) && (
            <button
              className={styles.button}
              type="button"
              onClick={installApp}
              disabled={installing}
            >
              {installing ? content.pwa.installing : content.pwa.install}
            </button>
          )}
          {showIosInstall && (
            <button
              className={styles.button}
              type="button"
              aria-expanded={showInstructions}
              aria-controls={instructionsId}
              onClick={() => setShowInstructions((value) => !value)}
            >
              {content.pwa.iosInstall}
            </button>
          )}
          {updateAvailable && (
            <button
              className={styles.button}
              type="button"
              onClick={applyUpdate}
              disabled={updating}
            >
              {updating ? content.pwa.updating : content.pwa.update}
            </button>
          )}
        </div>
      </div>
      {showIosInstall && (
        <p className={styles.instructions} id={instructionsId} hidden={!showInstructions}>
          {content.pwa.iosInstructions}
        </p>
      )}
    </section>
  );
}
