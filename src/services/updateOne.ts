import axios from "axios";
import { sequelize } from "../db/sequelize";
import { SigeWooWoocommer } from "../db/models/sigeWooWooCommer";
import { ENV } from "../config/env";
import { toPriceString, toStockInt } from "./util";

// Woo client
const wc: Axios.AxiosInstance = axios.create({
  baseURL: process.env.WC_BASE, // e.g., https://store.com/wp-json/wc/v3
  params: {
    consumer_key: process.env.WC_CK,
    consumer_secret: process.env.WC_CS,
  },
  timeout: 20000,
});

async function resolveWooIdBySku(sku: string): Promise<number | null> {
  const { data } = await wc.get("/products", { params: { sku } });
  if (Array.isArray(data) && data[0]?.id) return Number(data[0].id);
  return null;
}

/**
 * Updates Woo for one (sku, listId) using Antártida price/stock,
 * then stamps the DB if Woo returned OK.
 *
 * @param sku ART_IdArticulo
 * @param rsTecnoPrice PAL_PrecVtaArt (Antártida)
 * @param rsTecnoStock ADS_Disponible (Antártida)
 */
export async function updateWooAndStampDB(
  sku: string,
  rsTecnoPrice: number | null | undefined,
  rsTecnoStock: number | null | undefined
): Promise<{ sku: string; wooId: number; updated: boolean }> {
  // 1) load current row
  const row = await SigeWooWoocommer.findOne({
    where: { ART_IdArticulo: sku },
    lock: undefined,
  });
  if (!row) {
    throw new Error(`Row not found for sku=${sku}`);
  }

  // 2) ensure we have a Woo product ID
  let wooId: number | null =
    row.WOO_IdProducto && !Number.isNaN(Number(row.WOO_IdProducto))
      ? Number(row.WOO_IdProducto)
      : null;

  if (!wooId) {
    wooId = await resolveWooIdBySku(sku);
    if (!wooId) {
      throw new Error(`Woo product not found by SKU: ${sku}`);
    }
  }

  // 3) build Woo payload
  const quantity = toStockInt(rsTecnoStock);
  const priceString = toPriceString(rsTecnoPrice);

  const payload = {
    regular_price: priceString,
    manage_stock: true,
    stock_quantity: quantity,
  };

  // 4) PUT to Woo
  await wc.put(`/products/${wooId}`, payload);

  // 5) stamp DB (wrap in a small txn for consistency)
  await sequelize.transaction(async (transacton) => {
    // Write back Woo ID if we just discovered it
    if (!row.WOO_IdProducto || String(row.WOO_IdProducto) !== String(wooId)) {
      row.WOO_IdProducto = String(wooId);
    }
    row.WOO_PrecVtaArt = Number(priceString);
    row.WOO_Disponible = quantity;
    row.WOO_FecUltActWeb = new Date();

    await row.save({ transaction: transacton });
  });

  return { sku, wooId, updated: true };
}
