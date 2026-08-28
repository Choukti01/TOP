import type { ServerResponse } from "node:http";

export interface LiveSignal {
  type?: string;
  href?: string | null;
}

class NotificationHub {
  private readonly subscribers = new Map<string, Set<ServerResponse>>();

  public subscribe(userId: string, response: ServerResponse): () => void {
    const group = this.subscribers.get(userId) ?? new Set<ServerResponse>();
    group.add(response);
    this.subscribers.set(userId, group);
    response.write("event: ready\ndata: {}\n\n");
    return () => {
      group.delete(response);
      if (group.size === 0) this.subscribers.delete(userId);
    };
  }

  public publish(userId: string, signal: LiveSignal = {}): void {
    const group = this.subscribers.get(userId);
    if (!group) return;
    for (const response of group) {
      if (!response.writableEnded) response.write(`event: signal\ndata: ${JSON.stringify(signal)}\n\n`);
    }
  }
}

export const notificationHub = new NotificationHub();
