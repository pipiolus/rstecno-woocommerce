import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const ENV = {
  DB_HOST: required("DB_HOST"),
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_NAME: required("DB_NAME"),
  DB_USER: required("DB_USER"),
  DB_PASSWORD: required("DB_PASSWORD"),
  WC_BASE: required("WC_BASE"),
  WC_CK: required("WC_CK"),
  WC_CS: required("WC_CS"),
};
