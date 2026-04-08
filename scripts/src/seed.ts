import { db, teamsTable, usersTable, questionsTable, checkInsTable, responsesTable } from "@workspace/db";

async function seed() {
  console.log("Seeding database...");

  const [team] = await db.insert(teamsTable).values({
    name: "Design Studio Alpha",
  }).returning();
  console.log("Created team:", team.name);

  const users = await db.insert(usersTable).values([
    { name: "Kai Chen", role: "lead", teamId: team.id },
    { name: "Maya Rodriguez", role: "member", teamId: team.id },
    { name: "Alex Kim", role: "member", teamId: team.id },
    { name: "Jordan Taylor", role: "member", teamId: team.id },
    { name: "Sam Patel", role: "member", teamId: team.id },
  ]).returning();
  console.log("Created", users.length, "users");

  const questions = await db.insert(questionsTable).values([
    { dimension: "mood", questionText: "Hey! How are you feeling today?", inputType: "emoji", options: ["😊", "😌", "😐", "😔", "😫"], order: 1, cadence: "daily", isRequired: true },
    { dimension: "mood", questionText: "What's your energy level right now?", inputType: "slider", options: null, order: 2, cadence: "daily", isRequired: true },
    { dimension: "mood", questionText: "What's one thing that's on your mind?", inputType: "text", options: null, order: 3, cadence: "daily", isRequired: false },

    { dimension: "mood", questionText: "How are you feeling this week overall?", inputType: "emoji", options: ["😊", "😌", "😐", "😔", "😫"], order: 1, cadence: "weekly", isRequired: true },
    { dimension: "mood", questionText: "What's your energy level been like?", inputType: "slider", options: null, order: 2, cadence: "weekly", isRequired: true },
    { dimension: "mood", questionText: "What's one thing that gave you energy this week?", inputType: "text", options: null, order: 3, cadence: "weekly", isRequired: false },

    { dimension: "productivity", questionText: "How would you rate your productivity flow this week?", inputType: "slider", options: null, order: 4, cadence: "weekly", isRequired: true },
    { dimension: "productivity", questionText: "What's slowing you down?", inputType: "text", options: null, order: 5, cadence: "weekly", isRequired: false },

    { dimension: "courage", questionText: "Did you do something courageous this week?", inputType: "traffic_light", options: ["Yes, big leap", "Small step", "Not really"], order: 6, cadence: "weekly", isRequired: true },
    { dimension: "courage", questionText: "Tell us about it — what felt bold or risky?", inputType: "text", options: null, order: 7, cadence: "weekly", isRequired: false },

    { dimension: "learning", questionText: "What did you learn recently?", inputType: "checklist", options: ["Tried a new tool or technique", "Shared knowledge with a teammate", "Read/watched something inspiring", "Got feedback that shifted my thinking", "Other"], order: 8, cadence: "weekly", isRequired: true },
    { dimension: "learning", questionText: "What did you learn that surprised you?", inputType: "text", options: null, order: 9, cadence: "weekly", isRequired: false },

    { dimension: "mood", questionText: "What could make next week better?", inputType: "text", options: null, order: 10, cadence: "weekly", isRequired: false },
  ]).returning();
  console.log("Created", questions.length, "questions");

  const emojiToNumeric: Record<string, number> = { "😊": 5, "😌": 4, "😐": 3, "😔": 2, "😫": 1 };
  const trafficLightToNumeric: Record<string, number> = { "green": 5, "yellow": 3, "red": 1 };

  for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
    for (const user of users) {
      if (Math.random() < 0.3) continue;

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - dayOffset);
      createdAt.setHours(9 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));

      const cadence = dayOffset % 7 === 0 ? "weekly" : "daily";

      const [checkIn] = await db.insert(checkInsTable).values({
        userId: user.id,
        cadence,
        status: "completed",
        completedAt: createdAt,
      }).returning();

      await db.update(checkInsTable).set({ createdAt }).where(
        (await import("drizzle-orm")).eq(checkInsTable.id, checkIn.id)
      );

      const cadenceQuestions = questions.filter((q) => q.cadence === cadence);

      for (const q of cadenceQuestions) {
        let numericValue: number | null = null;
        let textValue: string | null = null;
        let emojiValue: string | null = null;
        let selectedOptions: string[] | null = null;
        let trafficLight: string | null = null;

        switch (q.inputType) {
          case "emoji":
            const emojis = ["😊", "😌", "😐", "😔", "😫"];
            const weights = [0.3, 0.3, 0.2, 0.15, 0.05];
            const rand = Math.random();
            let cumWeight = 0;
            for (let i = 0; i < emojis.length; i++) {
              cumWeight += weights[i];
              if (rand < cumWeight) {
                emojiValue = emojis[i];
                numericValue = emojiToNumeric[emojis[i]];
                break;
              }
            }
            break;
          case "slider":
            numericValue = Math.round((2.5 + Math.random() * 2.5) * 10) / 10;
            break;
          case "text":
            if (Math.random() > 0.4) {
              const texts = [
                "Feeling great about the new design direction",
                "Need more time for deep work",
                "Team collaboration has been excellent",
                "Learning a lot from the new project",
                "Would love more feedback opportunities",
                "The sprint went well overall",
                "Excited about the upcoming launch",
                "Could use more clarity on priorities",
              ];
              textValue = texts[Math.floor(Math.random() * texts.length)];
            }
            break;
          case "traffic_light":
            const lights = ["green", "yellow", "red"];
            const lightWeights = [0.4, 0.4, 0.2];
            const lightRand = Math.random();
            let lightCum = 0;
            for (let i = 0; i < lights.length; i++) {
              lightCum += lightWeights[i];
              if (lightRand < lightCum) {
                trafficLight = lights[i];
                numericValue = trafficLightToNumeric[lights[i]];
                break;
              }
            }
            break;
          case "checklist":
            const allOpts = q.options ?? [];
            selectedOptions = allOpts.filter(() => Math.random() > 0.5);
            if (selectedOptions.length === 0) selectedOptions = [allOpts[0]];
            numericValue = selectedOptions.length;
            break;
        }

        await db.insert(responsesTable).values({
          checkInId: checkIn.id,
          questionId: q.id,
          numericValue,
          textValue,
          emojiValue,
          selectedOptions,
          trafficLight,
        });
      }
    }
  }

  console.log("Seed data created successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
