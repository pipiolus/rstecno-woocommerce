import { sequelize } from "./sequelize";
import { SigeWooWoocommer } from "./models/sigeWooWooCommer";

async function main() {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected");

    const count = await SigeWooWoocommer.count();
    console.log("Rows in table:", count);

    const rows = await SigeWooWoocommer.findAll({ limit: 5 });
    console.log(
      "Sample rows:",
      rows.map((r) => r.toJSON())
    );

    process.exit(0);
  } catch (err) {
    console.error("DB check failed:", err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
