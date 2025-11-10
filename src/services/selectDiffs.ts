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
      ART_IdArticulo,
      LIS_IDListaPrecio,
      WOO_IdProducto,
      PAL_PrecVtaArt,
      ADS_Disponible,
      WOO_PrecVtaArt,
      WOO_Disponible,
      WOO_FecUltActLocal,
      WOO_FecUltActWeb
    FROM sige_woo_woocommer
    WHERE
      (
        WOO_PrecVtaArt IS NULL
        OR PAL_PrecVtaArt IS NULL
        OR ABS(PAL_PrecVtaArt - WOO_PrecVtaArt) > :eps
      )
      OR
      (
        WOO_Disponible IS NULL
        OR CAST(ADS_Disponible AS SIGNED) <> CAST(WOO_Disponible AS SIGNED)
      )
    ORDER BY COALESCE(WOO_FecUltActLocal, '1970-01-01') ASC
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
