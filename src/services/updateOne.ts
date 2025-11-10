// src/services/updateOne.ts
import axios from "axios";
import { sequelize } from "../db/sequelize";
import { withRetry } from "./util";
import { SigeWooWoocommer } from "../db/models/sigeWooWooCommer";

const wc = axios.create({
  baseURL: process.env.WC_BASE,
  params: {
    consumer_key: process.env.WC_CK,
    consumer_secret: process.env.WC_CS,
  },
  timeout: 20000,
});

// optional DRY_RUN toggle
const DRY = String(process.env.DRY_RUN || "").toLowerCase() === "true";

const toPriceString = (n: number | null | undefined) =>
  Number(n ?? 0).toFixed(2);
const toStockInt = (n: number | null | undefined) =>
  Math.max(0, Math.trunc(Number(n ?? 0)));

async function resolveWooIdBySku(sku: string): Promise<number | null> {
  const { data } = await withRetry(
    () => wc.get("/products", { params: { sku } }),
    {
      tries: Number(process.env.MAX_RETRIES || 3),
      baseDelayMs: Number(process.env.INIT_BACKOFF_MS || 500),
      onRetry: ({ attempt, delay, err }) => {
        console.warn(
          `[woo GET /products?sku=${sku}] retry ${attempt} in ${delay}ms`,
          err?.message || err
        );
      },
    }
  );
  if (Array.isArray(data) && data[0]?.id) return Number(data[0].id);
  return null;
}

export async function updateWooAndStampDB(
  sku: string,
  antPrice: number | null | undefined,
  antStock: number | null | undefined
): Promise<{ sku: string; wooId: number; updated: boolean }> {
  const row = await SigeWooWoocommer.findOne({
    where: { ART_IdArticulo: sku },
  });
  if (!row) throw new Error(`Row not found for sku=${sku}`);

  let wooId: number | null =
    row.WOO_IdProducto && !Number.isNaN(Number(row.WOO_IdProducto))
      ? Number(row.WOO_IdProducto)
      : null;

  if (!wooId) {
    wooId = await resolveWooIdBySku(sku);
    if (!wooId) throw new Error(`Woo product not found by SKU: ${sku}`);
  }

  const qty = toStockInt(antStock);
  const priceStr = toPriceString(antPrice);
  const payload = {
    regular_price: priceStr,
    manage_stock: true,
    stock_quantity: qty,
  };

  if (!DRY) {
    await withRetry(() => wc.put(`/products/${wooId}`, payload), {
      tries: Number(process.env.MAX_RETRIES || 3),
      baseDelayMs: Number(process.env.INIT_BACKOFF_MS || 500),
      onRetry: ({ attempt, delay, err }) => {
        const status = err?.response?.status;
        console.warn(
          `[woo PUT /products/${wooId}] retry ${attempt} in ${delay}ms (status=${status})`
        );
      },
    });
  } else {
    console.log(`[DRY_RUN] would PUT /products/${wooId}`, payload);
  }

  await sequelize.transaction(async (t) => {
    if (!row.WOO_IdProducto || String(row.WOO_IdProducto) !== String(wooId)) {
      row.WOO_IdProducto = String(wooId);
    }
    row.WOO_PrecVtaArt = Number(priceStr);
    row.WOO_Disponible = qty;
    row.WOO_Activo2 = row.WOO_Activo2 ?? "S"; // or set 'S' explicitly if agreed
    row.WOO_FecUltActWeb = new Date();
    await row.save({ transaction: t });
  });

  return { sku, wooId, updated: true };
}
