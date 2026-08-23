export type WorkerTask<TPayload = unknown> = {
  type: string;
  payload: TPayload;
};

/**
 * Central worker gateway.
 *
 * Heavy document operations (PDF processing, OCR, conversions, large exports)
 * should be routed through this layer instead of being coupled to UI code.
 */
export class WorkerManager {
  async run<TPayload, TResult = TPayload>(task: WorkerTask<TPayload>): Promise<TResult> {
    // Initial implementation keeps the API stable while preserving type safety.
    // Dedicated Web Workers can be connected here as processing engines grow.
    return task.payload as unknown as TResult;
  }
}

export const workerManager = new WorkerManager();
