const MAX_CONCURRENT_REQUESTS = 4

let activeRequests = 0
const waiters: (() => void)[] = []

export async function withRequestPermit<T>(operation: () => Promise<T>) {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => waiters.push(resolve))
  }

  activeRequests += 1

  try {
    return await operation()
  } finally {
    activeRequests -= 1
    waiters.shift()?.()
  }
}
