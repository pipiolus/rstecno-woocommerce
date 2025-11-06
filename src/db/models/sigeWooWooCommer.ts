import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

export interface SigeWooAttrs {
  ART_IdArticulo: string;
  LIS_IDListaPrecio: number;
  WOO_IdProducto: string;
  PAL_PrecVtaArt: number | null;
  ADS_Disponible: number | null;
  WOO_Activo1: string | null;
  WOO_FecUltActLocal: Date | null;
  WOO_PrecVtaArt: number | null;
  WOO_Disponible: number | null;
  WOO_Activo2: string | null;
  WOO_FecUltActWeb: Date | null;
}

type SigeWooCreation = Optional<
  SigeWooAttrs,
  | "WOO_IdProducto"
  | "PAL_PrecVtaArt"
  | "ADS_Disponible"
  | "WOO_Activo1"
  | "WOO_FecUltActLocal"
  | "WOO_PrecVtaArt"
  | "WOO_Disponible"
  | "WOO_Activo2"
  | "WOO_FecUltActWeb"
>;

export class SigeWooWoocommer
  extends Model<SigeWooAttrs, SigeWooCreation>
  implements SigeWooAttrs
{
  declare ART_IdArticulo: string;
  declare LIS_IDListaPrecio: number;
  declare WOO_IdProducto: string;
  declare PAL_PrecVtaArt: number | null;
  declare ADS_Disponible: number | null;
  declare WOO_Activo1: string | null;
  declare WOO_FecUltActLocal: Date | null;
  declare WOO_PrecVtaArt: number | null;
  declare WOO_Disponible: number | null;
  declare WOO_Activo2: string | null;
  declare WOO_FecUltActWeb: Date | null;
}

SigeWooWoocommer.init(
  {
    ART_IdArticulo: {
      type: DataTypes.STRING(15),
      allowNull: false,
      primaryKey: true,
      defaultValue: "",
    },
    LIS_IDListaPrecio: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      primaryKey: true,
      defaultValue: 0,
    },
    WOO_IdProducto: {
      type: DataTypes.STRING(15),
      allowNull: false,
      defaultValue: "",
    },
    PAL_PrecVtaArt: { type: DataTypes.DOUBLE, allowNull: true },
    ADS_Disponible: { type: DataTypes.DOUBLE, allowNull: true },
    WOO_Activo1: { type: DataTypes.CHAR(1), allowNull: true },
    WOO_FecUltActLocal: { type: DataTypes.DATE, allowNull: true },
    WOO_PrecVtaArt: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    WOO_Disponible: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    WOO_Activo2: { type: DataTypes.CHAR(1), allowNull: true, defaultValue: "" },
    WOO_FecUltActWeb: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: "sige_woo_woocommer",
    timestamps: false,
  }
);
