/**
 * Woo Expects prices as strings with 2 decimals
 */
export const toPriceString = (n: number | null | undefined) =>
  Number(n ?? 0).toFixed(2);

// Just in case we validate stock here
export const toStockInt = (n: number | null | undefined) =>
  Math.max(0, Math.trunc(Number(n ?? 0)));

// Simple retry with exponential backoff + jitter
export type RetryOpts = {
  tries?: number; // max attempts (default 3)
  baseDelayMs?: number; // initial backoff (default 500)
  factor?: number; // backoff multiplier (default 2)
  jitterMs?: number; // +/- random jitter (default 250)
  onRetry?: (info: { attempt: number; delay: number; err: any }) => void;
};

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOpts = {}
): Promise<T> {
  const tries = opts.tries ?? 3;
  const base = opts.baseDelayMs ?? 500;
  const factor = opts.factor ?? 2;
  const jitterMs = opts.jitterMs ?? 250;

  let attempt = 0;
  let lastErr: any;

  while (attempt < tries) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;

      // Determine if it’s retryable
      const status = err?.response?.status as number | undefined;
      const code = (err?.code as string | undefined)?.toUpperCase();
      const retryableHttp =
        status === 429 || (status !== undefined && status >= 500);
      const retryableNet =
        code &&
        ["ECONNABORTED", "ETIMEDOUT", "ECONNRESET", "EAI_AGAIN"].includes(code);

      if (!(retryableHttp || retryableNet)) break; // not retryable
      if (attempt >= tries - 1) break; // no more attempts

      // exponential backoff with jitter
      const delay = Math.round(
        base * Math.pow(factor, attempt) + Math.random() * jitterMs
      );
      opts.onRetry?.({ attempt: attempt + 1, delay, err });
      await sleep(delay);
      attempt++;
    }
  }
  throw lastErr;
}
