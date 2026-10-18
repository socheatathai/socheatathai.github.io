"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PwaInstallPromptEvent, PwaWorkerMessage, PwaWorkerStatus } from "@/types/pwa";

export function usePwa() {
  const [online, setOnline] = useState(true);
  const [offlineReady, setOfflineReady] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updating, setUpdating] = useState(false);
  const installPromptRef = useRef<PwaInstallPromptEvent | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !window.isSecureContext ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    mountedRef.current = true;
    let disposed = false;
    let currentController = navigator.serviceWorker.controller;
    let previouslyControlled = Boolean(currentController);
    let reloading = false;
    let registering = false;
    let lastUpdateCheck = Date.now();
    let statusChannel: MessageChannel | null = null;
    let statusTimeout: ReturnType<typeof setTimeout> | undefined;
    let removeUpdateListener: (() => void) | undefined;
    const workerListeners = new Map<ServiceWorker, () => void>();
    const serviceWorkers = navigator.serviceWorker;
    const standalone = window.matchMedia("(display-mode: standalone)");
    const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;

    setOnline(navigator.onLine);
    setInstalled(standalone.matches || iosStandalone);
    setIos(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );

    function closeStatusChannel() {
      clearTimeout(statusTimeout);
      statusChannel?.port1.close();
      statusChannel?.port2.close();
      statusChannel = null;
    }

    function requestStatus(worker = serviceWorkers.controller) {
      closeStatusChannel();
      if (!worker || worker.state !== "activated" || typeof MessageChannel === "undefined") return;

      const channel = new MessageChannel();
      statusChannel = channel;
      channel.port1.onmessage = (event: MessageEvent<PwaWorkerStatus>) => {
        if (disposed || statusChannel !== channel || serviceWorkers.controller !== worker) return;
        if (event.data?.type === "PWA_STATUS") {
          setOfflineReady(event.data.ready === true);
          closeStatusChannel();
        }
      };
      statusTimeout = setTimeout(closeStatusChannel, 4000);
      try {
        worker.postMessage({ type: "GET_STATUS" }, [channel.port2]);
      } catch {
        closeStatusChannel();
      }
    }

    function syncUpdateAvailability() {
      setUpdateAvailable(Boolean(registrationRef.current?.waiting && serviceWorkers.controller));
    }

    function watchInstallingWorker(worker: ServiceWorker | null) {
      if (!worker || workerListeners.has(worker)) return;
      function onStateChange() {
        syncUpdateAvailability();
        if (worker?.state === "activated") requestStatus();
        if (worker?.state === "activated" || worker?.state === "redundant") {
          worker.removeEventListener("statechange", onStateChange);
          workerListeners.delete(worker);
        }
      }
      workerListeners.set(worker, onStateChange);
      worker.addEventListener("statechange", onStateChange);
      onStateChange();
    }

    function onControllerChange() {
      const controller = serviceWorkers.controller;
      setOfflineReady(false);
      syncUpdateAvailability();
      if (!controller) {
        currentController = null;
        return;
      }

      // Claiming a first installation must not interrupt the page being read.
      const changedExistingController = previouslyControlled && controller !== currentController;
      currentController = controller;
      previouslyControlled = true;
      if (changedExistingController && !reloading) {
        reloading = true;
        window.location.reload();
        return;
      }
      requestStatus(controller);
    }

    function onWorkerMessage(event: MessageEvent<PwaWorkerMessage>) {
      const controller = serviceWorkers.controller;
      if (
        event.data?.type === "PWA_READY" &&
        controller?.state === "activated" &&
        event.source === controller
      ) {
        setOfflineReady(true);
      }
    }

    function checkForUpdates() {
      requestStatus();
      const registration = registrationRef.current;
      if (!registration || !navigator.onLine || Date.now() - lastUpdateCheck < 60_000) return;
      lastUpdateCheck = Date.now();
      void registration.update().catch(() => {
        // The active offline version remains usable when an update check fails.
      });
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") checkForUpdates();
    }

    function onOnline() {
      setOnline(true);
      if (document.readyState === "complete" && !registrationRef.current) registerWorker();
      checkForUpdates();
    }

    function onOffline() {
      setOnline(false);
    }

    function onBeforeInstallPrompt(event: Event) {
      if (!("prompt" in event) || typeof event.prompt !== "function") return;
      event.preventDefault();
      installPromptRef.current = event as PwaInstallPromptEvent;
      setCanInstall(true);
    }

    function onInstalled() {
      installPromptRef.current = null;
      setCanInstall(false);
      setInstalled(true);
    }

    function onDisplayModeChange(event: MediaQueryListEvent) {
      setInstalled(event.matches || iosStandalone);
    }

    serviceWorkers.addEventListener("controllerchange", onControllerChange);
    serviceWorkers.addEventListener("message", onWorkerMessage);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("focus", checkForUpdates);
    document.addEventListener("visibilitychange", onVisibilityChange);
    standalone.addEventListener("change", onDisplayModeChange);
    requestStatus();

    function registerWorker() {
      if (disposed || registering || registrationRef.current) return;
      registering = true;
      void serviceWorkers
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((registration) => {
          if (disposed) return;
          registrationRef.current = registration;
          syncUpdateAvailability();
          const onUpdateFound = () => watchInstallingWorker(registration.installing);
          registration.addEventListener("updatefound", onUpdateFound);
          removeUpdateListener = () =>
            registration.removeEventListener("updatefound", onUpdateFound);
          watchInstallingWorker(registration.installing);
          requestStatus();
        })
        .catch(() => {
          // The website still works normally when registration is unavailable.
        })
        .finally(() => {
          registering = false;
        });
    }

    if (document.readyState === "complete") registerWorker();
    else window.addEventListener("load", registerWorker, { once: true });

    return () => {
      disposed = true;
      mountedRef.current = false;
      closeStatusChannel();
      clearTimeout(updateTimeoutRef.current);
      removeUpdateListener?.();
      for (const [worker, listener] of workerListeners) {
        worker.removeEventListener("statechange", listener);
      }
      serviceWorkers.removeEventListener("controllerchange", onControllerChange);
      serviceWorkers.removeEventListener("message", onWorkerMessage);
      window.removeEventListener("load", registerWorker);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("focus", checkForUpdates);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      standalone.removeEventListener("change", onDisplayModeChange);
      registrationRef.current = null;
      installPromptRef.current = null;
    };
  }, []);

  const installApp = useCallback(async () => {
    const prompt = installPromptRef.current;
    if (!prompt) return;
    installPromptRef.current = null;
    setCanInstall(false);
    setInstalling(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (mountedRef.current && choice.outcome === "accepted") setInstalled(true);
    } catch {
      // A dismissed or unavailable browser prompt needs no error banner.
    } finally {
      if (mountedRef.current) setInstalling(false);
    }
  }, []);

  const applyUpdate = useCallback(() => {
    const waiting = registrationRef.current?.waiting;
    if (!waiting) {
      setUpdateAvailable(false);
      return;
    }
    setUpdating(true);
    clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) setUpdating(false);
    }, 15_000);
    try {
      waiting.postMessage({ type: "SKIP_WAITING" });
    } catch {
      clearTimeout(updateTimeoutRef.current);
      setUpdating(false);
    }
  }, []);

  return {
    online,
    offlineReady,
    canInstall: canInstall && !installed,
    showIosInstall: ios && !installed && !canInstall,
    installing,
    installApp,
    updateAvailable,
    updating,
    applyUpdate,
  };
}
