import pidusage from 'pidusage';

export function monitoring(
  label: string,
  interval: number,
  logs?: string[],
  startTime: number = Date.now(),
): () => void {
  let peakMemory = 0;
  let peakCPU = 0;
  let peakHeapUsed = 0;

  const monitorTimer = setInterval(async () => {
    const usage = await pidusage(process.pid);
    const heapUsage = process.memoryUsage();
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const logStr = `📡 ${label} | CPU: ${usage.cpu.toFixed(2)}% | RAM: ${(usage.memory / 1024 / 1024).toFixed(
      2,
    )} MB | Heap: ${(heapUsage.heapUsed / 1024 / 1024).toFixed(2)} MB | Threads: ${
      usage.pid
    } | Elapsed: ${elapsedTime}s`;

    if (!logs) console.log(logStr);
    else logs.push(logStr);

    peakMemory = Math.max(peakMemory, usage.memory);
    peakCPU = Math.max(peakCPU, usage.cpu);
    peakHeapUsed = Math.max(peakHeapUsed, heapUsage.heapUsed);
  }, interval);

  return () => {
    clearInterval(monitorTimer);
  };
}
