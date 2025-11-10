import { selectDiffs } from "../services/selectDiffs";
import { updateWooAndStampDB } from "../services/updateOne";

// tiny semaphore to cap concurrency without extra deps
function semaphore(max: number) {
  let running = 0;
  const queue: Array<() => void> = [];
  const acquire = () =>
    new Promise<void>((resolve) => {
      const tryRun = () => {
        if (running < max) {
          running++;
          resolve();
        } else {
          queue.push(tryRun);
        }
      };
      tryRun();
    });
  const release = () => {
    running--;
    const next = queue.shift();
    if (next) next();
  };
  return { acquire, release };
}

export async function syncDiffsOnce(opts?: {
  limit?: number;
  concurrency?: number;
}) {
  const limit = opts?.limit ?? 100;
  const concurrency = opts?.concurrency ?? 5;

  const diffs = await selectDiffs(limit);
  if (!diffs.length) {
    console.log("no diffs to sync");
    return { scanned: 0, updated: 0, errors: 0 };
  }

  console.log(
    `found ${diffs.length} diffs → syncing with concurrency=${concurrency}`
  );

  let updated = 0;
  let errors = 0;

  const sem = semaphore(concurrency);
  const tasks = diffs.map((row) =>
    (async () => {
      await sem.acquire();
      try {
        const sku = row.ART_IdArticulo;
        const rsTecnoPrice = row.PAL_PrecVtaArt ?? 0;
        const rsTecnoStock = Math.max(
          0,
          Math.trunc(Number(row.ADS_Disponible ?? 0))
        );

        await updateWooAndStampDB(sku, rsTecnoPrice, rsTecnoStock);
        updated++;
        if (updated % 10 === 0) {
          console.log(`progress: ${updated}/${diffs.length} updated`);
        }
      } catch (err: any) {
        errors++;
        const msg = err?.response?.data || err?.message || String(err);
        console.error("update failed:", msg);
      } finally {
        sem.release();
      }
    })()
  );

  await Promise.all(tasks);

  console.log(`sync finished → updated=${updated}, errors=${errors}`);
  return { scanned: diffs.length, updated, errors };
}

// allow running as a script
if (require.main === module) {
  syncDiffsOnce({ limit: 100, concurrency: 5 })
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
