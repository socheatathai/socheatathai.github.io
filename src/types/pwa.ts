export type InstallPromptChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

export interface PwaInstallPromptEvent extends Event {
  prompt: () => Promise<InstallPromptChoice | void>;
  userChoice: Promise<InstallPromptChoice>;
}

export type PwaWorkerStatus = {
  type: "PWA_STATUS";
  ready: boolean;
  version: string;
};

export type PwaWorkerMessage = PwaWorkerStatus | { type: "PWA_READY" };
