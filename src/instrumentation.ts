export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const globalState = globalThis as typeof globalThis & { __shoplinkkMonitoringReady?: boolean };
  if (globalState.__shoplinkkMonitoringReady) return;
  globalState.__shoplinkkMonitoringReady = true;

  const { logError, logInfo } = await import("@/lib/logger");

  logInfo("ShopLinkk server booted", {
    release: process.env.APP_RELEASE || process.env.RENDER_GIT_COMMIT || "local",
  });

  process.on("unhandledRejection", (reason) => {
    logError("Unhandled promise rejection", reason);
  });

  process.on("uncaughtException", (error) => {
    logError("Uncaught server exception", error);
  });
}
