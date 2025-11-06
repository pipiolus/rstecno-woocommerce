import { Sequelize } from "sequelize";
import { ENV } from "../config/env";

export const sequelize = new Sequelize(
  ENV.DB_NAME,
  ENV.DB_USER,
  ENV.DB_PASSWORD,
  {
    host: ENV.DB_HOST,
    port: ENV.DB_PORT,
    dialect: "mysql",
    logging: false,
    pool: { max: 10, min: 0, idle: 10000, acquire: 30000 },
  }
);
