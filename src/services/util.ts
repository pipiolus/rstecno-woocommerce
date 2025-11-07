/**
 * Woo Expects prices as strings with 2 decimals
 */
export const toPriceString = (n: number | null | undefined) =>
  Number(n ?? 0).toFixed(2);

// Just in case we validate stock here
export const toStockInt = (n: number | null | undefined) =>
  Math.max(0, Math.trunc(Number(n ?? 0)));
