import webpush from "web-push";

// Initialised lazily so that missing env vars only throw at call time, not at import
let initialised = false;

function init() {
  if (initialised) return;
  if (!process.env.VAPID_EMAIL || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    throw new Error("Missing VAPID environment variables");
  }
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  initialised = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth_key: string },
  payload: PushPayload
): Promise<"ok" | "gone"> {
  init();
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth_key }
      },
      JSON.stringify(payload)
    );
    return "ok";
  } catch (err: unknown) {
    // 410 Gone = subscription expired / user revoked permission → delete it
    if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
      return "gone";
    }
    throw err;
  }
}
