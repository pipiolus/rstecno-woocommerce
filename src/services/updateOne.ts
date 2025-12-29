// src/services/updateOne.ts
import axios from "axios";
import { sequelize } from "../db/sequelize";
import { toPriceString, toStockInt, withRetry } from "./util";
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

const ivaPercentToRate = (ivaPercent: number | null | undefined): number => {
  const n = Number(ivaPercent ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  // IVA is 10.5 or 21 → convert to 0.105 / 0.21
  return n / 100;
};

function computeNetPriceFromGross(
  gross: number | null | undefined,
  ivaPercent: number | null | undefined
): number {
  const g = Number(gross ?? 0);
  if (!Number.isFinite(g) || g <= 0) return 0;

  const rate = ivaPercentToRate(ivaPercent);
  if (rate <= 0) return g;

  return g / (1 + rate);
}

function normalizeWarrantyMonths(w: number | null | undefined): number {
  const n = Math.trunc(Number(w ?? 0));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n;
}

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
  antStock: number | null | undefined,
  ivaPercent: number | null | undefined,
  warrantyMonths: number | null | undefined
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

  const net = computeNetPriceFromGross(antPrice, ivaPercent);
  const netStr = toPriceString(net);

  const warranty = normalizeWarrantyMonths(warrantyMonths);

  const payload = {
    regular_price: priceStr,
    manage_stock: true,
    stock_quantity: qty,
    meta_data: [
      { key: "_warranty_months", value: warranty },
      { key: "_price_no_taxes", value: netStr },
    ],
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

  if (!DRY) {
    await sequelize.transaction(async (t) => {
      if (!row.WOO_IdProducto || String(row.WOO_IdProducto) !== String(wooId)) {
        row.WOO_IdProducto = String(wooId);
      }
      row.WOO_PrecVtaArt = Number(priceStr);
      row.WOO_Disponible = qty;
      row.WOO_Activo2 = row.WOO_Activo2 ?? "S";
      row.WOO_FecUltActWeb = new Date();
      await row.save({ transaction: t });
    });
  } else {
    console.log(`[DRY_RUN] skipping DB stamp for ${sku}`);
  }

  return { sku, wooId, updated: true };
}
