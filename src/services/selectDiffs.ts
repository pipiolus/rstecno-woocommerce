import { sequelize } from "../db/sequelize";

export type DiffRow = {
  ART_IdArticulo: string;
  LIS_IDListaPrecio: number;
  WOO_IdProducto: string | null;
  PAL_PrecVtaArt: number | null;
  ADS_Disponible: number | null;
  WOO_PrecVtaArt: number | null;
  WOO_Disponible: number | null;
  WOO_FecUltActLocal: Date | null;
  WOO_FecUltActWeb: Date | null;
  ART_PorcIVARI: number | null;
  ART_Garantia: number | null;
};

/**
 * Selects up to `limit` rows where Antártida != Woo for price or stock.
 * - Price diff uses an epsilon to avoid floating point noise.
 * - Stock compares integers.
 */
export async function selectDiffs(
  limit = 100,
  epsilon = 0.0001
): Promise<DiffRow[]> {
  const rows = await sequelize.query<DiffRow>(
    `
    SELECT
      sww.ART_IdArticulo,
      sww.LIS_IDListaPrecio,
      sww.WOO_IdProducto,
      sww.PAL_PrecVtaArt,
      sww.ADS_Disponible,
      sww.WOO_PrecVtaArt,
      sww.WOO_Disponible,
      sww.WOO_FecUltActLocal,
      sww.WOO_FecUltActWeb,

     
      art.ART_PorcIVARI,
      art.ART_Garantia

    FROM sige_woo_woocommer sww
    LEFT JOIN sige_art_articulo art
      ON art.ART_IDArticulo = sww.ART_IdArticulo

    WHERE
      (
        sww.WOO_PrecVtaArt IS NULL
        OR sww.PAL_PrecVtaArt IS NULL
        OR ABS(sww.PAL_PrecVtaArt - sww.WOO_PrecVtaArt) > :eps
      )
      OR
      (
        sww.WOO_Disponible IS NULL
        OR CAST(sww.ADS_Disponible AS SIGNED) <> CAST(sww.WOO_Disponible AS SIGNED)
      )
    ORDER BY COALESCE(sww.WOO_FecUltActLocal, '1970-01-01') ASC
    LIMIT :limit
    `,
    {
      replacements: { eps: epsilon, limit },
      type: "SELECT" as any,
      // raw is implied; we’re not mapping to a model here
    }
  );

  return rows;
}
