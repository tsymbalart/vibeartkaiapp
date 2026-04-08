import { db, responsesTable, checkInsTable } from "@workspace/db";

async function resetData() {
  console.log("Clearing all check-in and response data...");

  const deletedResponses = await db.delete(responsesTable).returning();
  console.log(`Deleted ${deletedResponses.length} responses`);

  const deletedCheckIns = await db.delete(checkInsTable).returning();
  console.log(`Deleted ${deletedCheckIns.length} check-ins`);

  console.log("\nDone! Dashboard, My Journey, and Team Summary are now empty.");
  console.log("Users, team, and questions are preserved.");
}

resetData().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
