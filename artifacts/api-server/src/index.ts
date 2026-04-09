import app from "./app";
import { logger } from "./lib/logger";
import { db, teamsTable, usersTable, allowedEmailsTable } from "@workspace/db";
import { runMigrations } from "@workspace/db/migrator";
import { startSessionGC } from "./lib/sessionGC";
import { startReminderCron } from "./lib/reminderCron";
import { eq } from "drizzle-orm";

async function seedDefaults() {
  // Never run the development seed in production — it hardcodes an Artkai
  // team, director emails, and an allowlist that must not be auto-created
  // against real customer data.
  if (process.env.NODE_ENV === "production") {
    logger.info("Skipping seedDefaults in production");
    return;
  }
  try {
    const existingTeams = await db.select().from(teamsTable);
    let teamId: number;

    if (existingTeams.length === 0) {
      const [team] = await db.insert(teamsTable).values({ name: "Artkai" }).returning();
      teamId = team.id;
      logger.info("Created default Artkai team");
    } else {
      teamId = existingTeams[0].id;
    }

    // Bootstrap design-ops directors and leads. They will be tracked in the
    // Design Team list as soon as their `roleTitle` is set.
    const presetUsers = [
      {
        name: "Art Tsymbal",
        email: "a.tsymbal@artk.ai",
        role: "director" as const,
        roleTitle: "Design Director",
      },
      {
        name: "Kseniia Tatsii",
        email: "k.tatsii@artk.ai",
        role: "lead" as const,
        roleTitle: "Design Lead",
      },
      {
        name: "Valeriia Didkivska",
        email: "v.didkivska@artk.ai",
        role: "lead" as const,
        roleTitle: "Design Lead",
      },
    ];

    for (const preset of presetUsers) {
      const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, preset.email));
      if (existing) {
        if (!existing.teamId || !existing.roleTitle) {
          await db
            .update(usersTable)
            .set({
              teamId,
              role: preset.role,
              name: preset.name,
              roleTitle: existing.roleTitle ?? preset.roleTitle,
              employmentStatus: "active",
              updatedAt: new Date(),
            })
            .where(eq(usersTable.id, existing.id));
          logger.info({ email: preset.email }, "Updated preset user with team and design-ops fields");
        }
      } else {
        await db.insert(usersTable).values({
          name: preset.name,
          email: preset.email,
          role: preset.role,
          teamId,
          roleTitle: preset.roleTitle,
          employmentStatus: "active",
        });
        logger.info({ email: preset.email }, "Created preset user");
      }
    }

    // Seed the design-ops allowlist on first run (matches Check's bootstrap list).
    const seedEmails = [
      "a.tsymbal@artk.ai",
      "k.tatsii@artk.ai",
      "v.didkivska@artk.ai",
      "tsymbal.artem@gmail.com",
    ];
    for (const email of seedEmails) {
      const [existing] = await db
        .select()
        .from(allowedEmailsTable)
        .where(eq(allowedEmailsTable.email, email));
      if (!existing) {
        await db.insert(allowedEmailsTable).values({ email, teamId }).onConflictDoNothing();
        logger.info({ email }, "Seeded allowed email");
      }
    }
  } catch (err) {
    logger.error({ err }, "Seed defaults failed");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function bootstrap() {
  try {
    await runMigrations();
    logger.info("Database migrations are up to date");
  } catch (err) {
    logger.error({ err }, "Failed to run database migrations — aborting startup");
    process.exit(1);
  }

  await seedDefaults();
  startSessionGC();
  startReminderCron();

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

bootstrap();
