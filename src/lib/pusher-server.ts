import Pusher from "pusher";

const {
  PUSHER_APP_ID,
  PUSHER_KEY,
  PUSHER_SECRET,
  PUSHER_CLUSTER
} = process.env;

let pusher: Pusher | null = null;

if (PUSHER_APP_ID && PUSHER_KEY && PUSHER_SECRET && PUSHER_CLUSTER) {
  pusher = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true
  });
}

export async function notifyGroupsUpdatedViaPusher(): Promise<void> {
  if (!pusher) return;
  try {
    await pusher.trigger("groups", "updated", {});
  } catch (err) {
    console.error("Pusher trigger failed", err);
  }
}

