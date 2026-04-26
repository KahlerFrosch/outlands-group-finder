"use client";

import { useCallback, useEffect, useState } from "react";
import Pusher from "pusher-js";
import type { Group } from "@/lib/groups-shared";

function loadGroups(): Promise<Group[]> {
  return fetch("/api/groups").then((res) => {
    if (!res.ok) throw new Error("Failed to load groups");
    return res.json();
  });
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    loadGroups()
      .then((data) => {
        setGroups(data);
        setError(null);
      })
      .catch(() => setError("Could not load groups. Please try again later."));
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadGroups()
      .then((data) => {
        if (isMounted) setGroups(data);
      })
      .catch(() => {
        if (isMounted) setError("Could not load groups. Please try again later.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    let pusher: Pusher | null = null;
    let channel: ReturnType<Pusher["subscribe"]> | null = null;

    if (pusherKey && pusherCluster) {
      pusher = new Pusher(pusherKey, { cluster: pusherCluster });
      channel = pusher.subscribe("groups");
      channel.bind("updated", () => {
        refresh();
      });
    }

    return () => {
      if (channel && pusher) {
        channel.unbind_all();
        pusher.unsubscribe("groups");
        pusher.disconnect();
      }
    };
  }, [refresh]);

  return { groups, loading, error, setError, refresh };
}
