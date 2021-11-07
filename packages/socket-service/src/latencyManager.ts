const latencyMap = new Map<string, number>();

let latencyCounter = 0;

// FIXME: Use Redis or something to allow multiple service instances
// Or, use a way to ensure all sockets instances have the same timestamp
export function recordLatency(latency: number) {
  const key = `latency:${latencyCounter++}`;
  latencyMap.set(key, Date.now() - latency);
  return key;
}

export function getLatency(code: string) {
  const lat = latencyMap.get(code);
  latencyMap.delete(code);
  return Date.now() - lat;
}
