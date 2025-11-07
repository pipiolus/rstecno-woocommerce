import { updateWooAndStampDB } from "../services/updateOne";

(async () => {
  try {
    const result = await updateWooAndStampDB("ABC123", 500500, 7);
    console.log("✅ Updated:", result);
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) console.error(`Error: ${error.message}`);

    console.error("Unknown error:", error);
    process.exit(1);
  }
})();
