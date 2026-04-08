import { db, questionsTable, usersTable, teamsTable, checkInsTable, responsesTable, intentMessagesTable, intentThreadsTable, kudosTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const PILLARS = {
  wellness: "wellness",
  alignment: "alignment",
  management: "management",
  growth: "growth",
  design_courage: "design_courage",
  collaboration: "collaboration",
  recognition: "recognition",
  belonging: "belonging",
} as const;

interface QuestionSeed {
  pillar: string;
  questionText: string;
  inputType: string;
  options?: string[];
  impactWeight: number;
  frequencyClass: string;
  isCore: boolean;
  isRequired: boolean;
  source?: string;
  followUpLogic?: object;
}

const questionBank: QuestionSeed[] = [
  // WELLNESS (5 questions, core sentinel: energy)
  {
    pillar: PILLARS.wellness,
    questionText: "I have sustainable energy levels throughout the work week.",
    inputType: "likert_5",
    impactWeight: 1.2,
    frequencyClass: "core",
    isCore: true,
    isRequired: true,
    source: "WHO-5 adapted",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What's draining your energy the most?", type: "multi_select", options: ["Workload", "Sleep", "Personal issues", "Unclear priorities", "Team conflict", "Other"] },
  },
  {
    pillar: PILLARS.wellness,
    questionText: "I am able to maintain a healthy work-life balance.",
    inputType: "likert_5",
    impactWeight: 1.0,
    frequencyClass: "high",
    isCore: false,
    isRequired: true,
    source: "HeartCount Pulse",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What is the main factor affecting your balance?", type: "open_text" },
  },
  {
    pillar: PILLARS.wellness,
    questionText: "I feel I can take time off when I need it without guilt.",
    inputType: "likert_5",
    impactWeight: 0.8,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "Burnout research / APA",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What makes it hard for you to take time off?", type: "open_text" },
  },
  {
    pillar: PILLARS.wellness,
    questionText: "I have been feeling stressed or overwhelmed in the past two weeks.",
    inputType: "frequency_5",
    options: ["Not at all", "Rarely", "Sometimes", "Often", "Almost always"],
    impactWeight: 1.2,
    frequencyClass: "high",
    isCore: false,
    isRequired: true,
    source: "MBI / WHO Burnout",
    followUpLogic: { trigger: "gte", threshold: 4, question: "Would you like to connect with support resources?", type: "yes_no" },
  },
  {
    pillar: PILLARS.wellness,
    questionText: "My current workload feels manageable.",
    inputType: "traffic_light",
    options: ["Just right", "Slightly too much or too little", "Unmanageable"],
    impactWeight: 1.0,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "WHO Burnout adapted",
  },

  // ALIGNMENT (5 questions, core sentinel: expectations)
  {
    pillar: PILLARS.alignment,
    questionText: "I understand how my current work connects to the team's goals.",
    inputType: "likert_5",
    impactWeight: 1.2,
    frequencyClass: "core",
    isCore: true,
    isRequired: true,
    source: "Gallup Q01",
    followUpLogic: { trigger: "lte", threshold: 3, question: "What feels unclear right now?", type: "multi_select", options: ["My role", "Team goals", "Company priorities", "Success metrics", "Who to ask"] },
  },
  {
    pillar: PILLARS.alignment,
    questionText: "I am clear on what success looks like for my current projects.",
    inputType: "likert_5",
    impactWeight: 1.0,
    frequencyClass: "high",
    isCore: false,
    isRequired: true,
    source: "Spotify Mission",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What's making success criteria unclear for you right now?", type: "open_text" },
  },
  {
    pillar: PILLARS.alignment,
    questionText: "I feel our team's priorities are well-defined.",
    inputType: "likert_5",
    impactWeight: 1.0,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "Atlassian Health Monitor",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What feels most unclear or competing right now?", type: "open_text" },
  },
  {
    pillar: PILLARS.alignment,
    questionText: "I feel my opinions count when decisions are made.",
    inputType: "likert_5",
    impactWeight: 0.8,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "Gallup Q07",
    followUpLogic: { trigger: "lte", threshold: 2, question: "In what area do you wish you had more input?", type: "open_text" },
  },
  {
    pillar: PILLARS.alignment,
    questionText: "I have the materials and resources I need to do my work right.",
    inputType: "likert_5",
    impactWeight: 0.8,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "Gallup Q02",
    followUpLogic: { trigger: "lte", threshold: 3, question: "What are you missing?", type: "multi_select", options: ["Hardware", "Software/tools", "Access/permissions", "Documentation", "Budget"] },
  },

  // MANAGEMENT (5 questions, core sentinel: feedback)
  {
    pillar: PILLARS.management,
    questionText: "My lead provides feedback that helps me improve.",
    inputType: "likert_5",
    impactWeight: 1.2,
    frequencyClass: "core",
    isCore: true,
    isRequired: true,
    source: "Gallup Q05 adapted",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What would make feedback more useful?", type: "multi_select", options: ["More specific examples", "Written follow-up", "Tied to goals", "More timely"] },
  },
  {
    pillar: PILLARS.management,
    questionText: "I feel comfortable raising concerns with my lead.",
    inputType: "likert_5",
    impactWeight: 1.0,
    frequencyClass: "high",
    isCore: false,
    isRequired: true,
    source: "Google re:Work",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What would help you feel safer raising concerns?", type: "open_text" },
  },
  {
    pillar: PILLARS.management,
    questionText: "My lead supports my professional development.",
    inputType: "likert_5",
    impactWeight: 1.0,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "15Five",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What kind of development support would be most helpful?", type: "multi_select", options: ["Mentorship", "Training budget", "Stretch projects", "Career conversations", "Conference attendance"] },
  },
  {
    pillar: PILLARS.management,
    questionText: "I trust my lead to advocate for the team.",
    inputType: "likert_5",
    impactWeight: 0.8,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "Officevibe",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What's making it hard to trust in advocacy right now?", type: "open_text" },
  },
  {
    pillar: PILLARS.management,
    questionText: "My 1:1s are valuable and well-structured.",
    inputType: "likert_5",
    impactWeight: 0.8,
    frequencyClass: "deep",
    isCore: false,
    isRequired: true,
    source: "Lattice",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What would make your 1:1s more valuable?", type: "multi_select", options: ["Clear agenda", "More frequent", "More actionable", "Better follow-through", "More coaching"] },
  },

  // GROWTH & LEARNING (5 questions, core sentinel: learning opportunities)
  {
    pillar: PILLARS.growth,
    questionText: "I am learning new skills in my current role.",
    inputType: "likert_5",
    impactWeight: 1.0,
    frequencyClass: "core",
    isCore: true,
    isRequired: true,
    source: "Gallup Q12 adapted",
    followUpLogic: { trigger: "lte", threshold: 3, question: "What type of growth would be most valuable to you?", type: "multi_select", options: ["Technical skills", "Leadership", "Cross-functional", "Mentorship", "Conferences", "Other"] },
  },
  {
    pillar: PILLARS.growth,
    questionText: "I have access to the resources I need to grow professionally.",
    inputType: "likert_5",
    impactWeight: 1.0,
    frequencyClass: "high",
    isCore: false,
    isRequired: true,
    source: "Leapsome",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What resources are you missing?", type: "multi_select", options: ["Learning platform access", "Budget for courses", "Time for learning", "Mentorship", "Internal knowledge sharing"] },
  },
  {
    pillar: PILLARS.growth,
    questionText: "I feel challenged by my work in a healthy way.",
    inputType: "traffic_light",
    options: ["Just right", "Under-challenged or Over-challenged", "Completely misaligned"],
    impactWeight: 0.8,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "Leapsome",
  },
  {
    pillar: PILLARS.growth,
    questionText: "I have a clear sense of my career path here.",
    inputType: "likert_5",
    impactWeight: 1.0,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "Lattice / Culture Amp",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What would help you see a clearer path?", type: "multi_select", options: ["Career framework", "Manager 1:1s", "Internal job board", "Skill assessments"] },
  },
  {
    pillar: PILLARS.growth,
    questionText: "I've had opportunities to share or teach what I know.",
    inputType: "yes_no",
    impactWeight: 0.6,
    frequencyClass: "deep",
    isCore: false,
    isRequired: true,
    source: "Gallup Q03",
    followUpLogic: { trigger: "lte", threshold: 0, question: "What knowledge would you like to share with the team?", type: "open_text" },
  },

  // DESIGN COURAGE (5 questions, core sentinel: creative risks)
  {
    pillar: PILLARS.design_courage,
    questionText: "I feel safe taking creative risks in my work.",
    inputType: "likert_5",
    impactWeight: 1.2,
    frequencyClass: "core",
    isCore: true,
    isRequired: true,
    source: "Google re:Work Psych. Safety",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What's holding you back from taking creative risks?", type: "multi_select", options: ["Fear of judgment", "Tight deadlines", "Unclear expectations", "Past negative experience", "Lack of support"] },
  },
  {
    pillar: PILLARS.design_courage,
    questionText: "Our team holds itself to high craft standards.",
    inputType: "likert_5",
    impactWeight: 1.0,
    frequencyClass: "high",
    isCore: false,
    isRequired: true,
    source: "Artkai internal",
    followUpLogic: { trigger: "lte", threshold: 2, question: "Where do you see craft standards slipping?", type: "open_text" },
  },
  {
    pillar: PILLARS.design_courage,
    questionText: "I can push back on requirements when I believe it's right for the user.",
    inputType: "likert_5",
    impactWeight: 1.0,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "NNGroup UX Research",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What makes it difficult to advocate for user needs?", type: "open_text" },
  },
  {
    pillar: PILLARS.design_courage,
    questionText: "We make time for exploration and experimentation.",
    inputType: "likert_5",
    impactWeight: 0.8,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "Spotify Squad Health",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What's preventing exploration time?", type: "multi_select", options: ["Too many deliverables", "No allocated time", "Client pressure", "Unclear value of exploration", "Lack of tools"] },
  },
  {
    pillar: PILLARS.design_courage,
    questionText: "Honest design critique is welcomed and practiced on this team.",
    inputType: "likert_5",
    impactWeight: 0.8,
    frequencyClass: "deep",
    isCore: false,
    isRequired: true,
    source: "Artkai internal",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What would make design critique feel safer or more productive?", type: "open_text" },
  },

  // COLLABORATION (5 questions, core sentinel: responsiveness)
  {
    pillar: PILLARS.collaboration,
    questionText: "My teammates are responsive and supportive.",
    inputType: "likert_5",
    impactWeight: 1.2,
    frequencyClass: "core",
    isCore: true,
    isRequired: true,
    source: "Gallup Q10 adapted",
    followUpLogic: { trigger: "lte", threshold: 2, question: "Where do you feel support is lacking?", type: "open_text" },
  },
  {
    pillar: PILLARS.collaboration,
    questionText: "I can easily get the information I need from other teams.",
    inputType: "likert_5",
    impactWeight: 1.0,
    frequencyClass: "high",
    isCore: false,
    isRequired: true,
    source: "Atlassian",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What information is hardest to get, and from where?", type: "open_text" },
  },
  {
    pillar: PILLARS.collaboration,
    questionText: "Cross-functional collaboration is smooth and productive.",
    inputType: "likert_5",
    impactWeight: 1.0,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "Spotify Squad Health",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What's causing friction in cross-functional work?", type: "multi_select", options: ["Misaligned priorities", "Communication gaps", "Tool differences", "Unclear ownership", "Scheduling conflicts"] },
  },
  {
    pillar: PILLARS.collaboration,
    questionText: "We resolve disagreements constructively.",
    inputType: "likert_5",
    impactWeight: 0.8,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "Atlassian",
    followUpLogic: { trigger: "lte", threshold: 2, question: "Is there an unresolved conflict affecting your work right now?", type: "yes_no" },
  },
  {
    pillar: PILLARS.collaboration,
    questionText: "Knowledge is shared openly within the team.",
    inputType: "likert_5",
    impactWeight: 0.6,
    frequencyClass: "deep",
    isCore: false,
    isRequired: true,
    source: "Culture Amp",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What knowledge do you wish was shared more openly?", type: "open_text" },
  },

  // RECOGNITION & IMPACT (5 questions, core sentinel: contributions recognized)
  {
    pillar: PILLARS.recognition,
    questionText: "I feel my contributions are recognized.",
    inputType: "likert_5",
    impactWeight: 1.2,
    frequencyClass: "core",
    isCore: true,
    isRequired: true,
    source: "Gallup Q04",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What kind of recognition would feel most meaningful?", type: "multi_select", options: ["Public shout-out", "Private message", "Bonus/reward", "Peer recognition", "Manager praise"] },
  },
  {
    pillar: PILLARS.recognition,
    questionText: "I can see the impact of my work on real users or outcomes.",
    inputType: "likert_5",
    impactWeight: 1.0,
    frequencyClass: "high",
    isCore: false,
    isRequired: true,
    source: "15Five / Officevibe",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What would help you see the impact of your work?", type: "multi_select", options: ["User feedback sessions", "Analytics dashboards", "Post-launch reviews", "Client testimonials", "Impact reports"] },
  },
  {
    pillar: PILLARS.recognition,
    questionText: "I feel valued as a member of this team.",
    inputType: "likert_5",
    impactWeight: 1.0,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "Culture Amp",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What would help you feel more valued?", type: "open_text" },
  },
  {
    pillar: PILLARS.recognition,
    questionText: "My work is visible beyond my immediate team.",
    inputType: "likert_5",
    impactWeight: 0.8,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "Officevibe",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What would help make your work more visible?", type: "multi_select", options: ["Showcase presentations", "Cross-team demos", "Internal newsletter", "Leadership exposure", "Portfolio sharing"] },
  },
  {
    pillar: PILLARS.recognition,
    questionText: "I am proud of what we've shipped recently.",
    inputType: "likert_5",
    impactWeight: 0.6,
    frequencyClass: "deep",
    isCore: false,
    isRequired: true,
    source: "Artkai internal",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What's dampening your pride in recent work?", type: "open_text" },
  },

  // BELONGING (5 questions, core sentinel: be myself)
  {
    pillar: PILLARS.belonging,
    questionText: "I feel I can be myself at work.",
    inputType: "likert_5",
    impactWeight: 1.2,
    frequencyClass: "core",
    isCore: true,
    isRequired: true,
    source: "DEIB / Officevibe",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What makes it hard to be yourself at work?", type: "open_text" },
  },
  {
    pillar: PILLARS.belonging,
    questionText: "Diverse perspectives are genuinely valued on this team.",
    inputType: "likert_5",
    impactWeight: 1.0,
    frequencyClass: "high",
    isCore: false,
    isRequired: true,
    source: "Culture Amp",
    followUpLogic: { trigger: "lte", threshold: 2, question: "Where do you see diversity of thought being undervalued?", type: "open_text" },
  },
  {
    pillar: PILLARS.belonging,
    questionText: "I feel included in decisions that affect my work.",
    inputType: "likert_5",
    impactWeight: 1.0,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "Gallup Q07",
    followUpLogic: { trigger: "lte", threshold: 2, question: "Which decisions do you feel left out of?", type: "open_text" },
  },
  {
    pillar: PILLARS.belonging,
    questionText: "I feel a sense of connection with my teammates.",
    inputType: "likert_5",
    impactWeight: 0.8,
    frequencyClass: "standard",
    isCore: false,
    isRequired: true,
    source: "Gallup Q10",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What would help you feel more connected?", type: "multi_select", options: ["Team socials", "Pair work", "Shared rituals", "Smaller group chats", "More 1:1s"] },
  },
  {
    pillar: PILLARS.belonging,
    questionText: "My voice matters in team discussions.",
    inputType: "likert_5",
    impactWeight: 0.6,
    frequencyClass: "deep",
    isCore: false,
    isRequired: true,
    source: "Officevibe",
    followUpLogic: { trigger: "lte", threshold: 2, question: "What would help your voice be heard more?", type: "multi_select", options: ["Smaller group settings", "Async input channels", "Structured turn-taking", "Anonymous feedback", "More facilitated discussions"] },
  },
];

function normalizeScore(inputType: string, opts: { numericValue?: number | null; emojiValue?: string | null; trafficLight?: string | null; selectedOptions?: string[] | null }): number | null {
  if (inputType === "likert_5") {
    if (opts.numericValue == null) return null;
    return ((opts.numericValue - 1) / 4) * 100;
  }
  if (inputType === "frequency_5") {
    if (opts.numericValue == null) return null;
    return ((opts.numericValue - 1) / 4) * 100;
  }
  if (inputType === "traffic_light") {
    if (!opts.trafficLight) return null;
    if (opts.trafficLight === "green") return 100;
    if (opts.trafficLight === "yellow") return 50;
    return 0;
  }
  if (inputType === "emoji_5") {
    if (opts.numericValue == null) return null;
    return ((opts.numericValue - 1) / 4) * 100;
  }
  if (inputType === "yes_no") {
    if (opts.numericValue == null) return null;
    return opts.numericValue === 1 ? 100 : 0;
  }
  if (inputType === "numeric_10") {
    if (opts.numericValue == null) return null;
    return ((opts.numericValue - 1) / 9) * 100;
  }
  return null;
}

async function seed() {
  console.log("Clearing existing data...");
  await db.delete(kudosTable);
  await db.delete(intentMessagesTable);
  await db.delete(intentThreadsTable);
  await db.delete(responsesTable);
  await db.delete(checkInsTable);
  await db.delete(questionsTable);
  await db.execute(sql`DELETE FROM user_sub_teams`);
  await db.execute(sql`DELETE FROM sub_teams`);
  await db.delete(usersTable);
  await db.delete(teamsTable);

  await db.execute(sql`ALTER SEQUENCE teams_id_seq RESTART WITH 2`);
  await db.execute(sql`ALTER SEQUENCE users_id_seq RESTART WITH 6`);
  await db.execute(sql`ALTER SEQUENCE questions_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE check_ins_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE responses_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE intent_threads_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE intent_messages_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE sub_teams_id_seq RESTART WITH 10`);
  await db.execute(sql`ALTER SEQUENCE kudos_id_seq RESTART WITH 1`);

  console.log("Seeding team...");
  const [team] = await db.insert(teamsTable).values({ name: "Design Studio Alpha" }).returning();

  console.log("Seeding users...");
  const userSeeds = [
    { name: "Elena Marchetti", role: "lead", teamId: team.id },
    { name: "Kai Nguyen", role: "member", teamId: team.id },
    { name: "Jordan Rivera", role: "member", teamId: team.id },
    { name: "Sam Okafor", role: "member", teamId: team.id },
    { name: "Priya Sharma", role: "member", teamId: team.id },
  ];
  const users = await db.insert(usersTable).values(userSeeds).returning();
  console.log(`Seeded ${users.length} users`);

  console.log("Seeding questions...");
  const questionsToInsert = questionBank.map((q, idx) => ({
    pillar: q.pillar,
    questionText: q.questionText,
    inputType: q.inputType,
    options: q.options ?? null,
    order: idx + 1,
    impactWeight: q.impactWeight,
    frequencyClass: q.frequencyClass,
    isCore: q.isCore,
    isRequired: q.isRequired,
    source: q.source ?? null,
    followUpLogic: q.followUpLogic ?? null,
  }));
  const questions = await db.insert(questionsTable).values(questionsToInsert).returning();
  console.log(`Seeded ${questions.length} questions across 8 pillars`);

  console.log("Seeding 14 days of realistic check-in data...");
  const coreQuestions = questions.filter((q) => q.isCore);
  const nonCoreByPillar: Record<string, typeof questions> = {};
  for (const q of questions) {
    if (!q.isCore) {
      if (!nonCoreByPillar[q.pillar]) nonCoreByPillar[q.pillar] = [];
      nonCoreByPillar[q.pillar].push(q);
    }
  }

  const memberUsers = users.filter((u) => u.role === "member");
  const allUsers = users;

  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    if (dayOffset % 2 !== 0 && dayOffset > 2) continue;

    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() - dayOffset);
    checkInDate.setHours(10, 0, 0, 0);

    const respondingUsers = dayOffset > 7 ? memberUsers.slice(0, 3) : allUsers;

    for (const user of respondingUsers) {
      const [checkIn] = await db
        .insert(checkInsTable)
        .values({
          userId: user.id,
          cadence: "weekly",
          status: "completed",
          createdAt: checkInDate,
          completedAt: new Date(checkInDate.getTime() + 3 * 60 * 1000),
        })
        .returning();

      const sessionQuestions = [...coreQuestions];
      const pillarKeys = Object.keys(nonCoreByPillar);
      const selectedPillars = pillarKeys.sort(() => Math.random() - 0.5).slice(0, 3);
      for (const p of selectedPillars) {
        const pool = nonCoreByPillar[p];
        if (pool && pool.length > 0) {
          sessionQuestions.push(pool[Math.floor(Math.random() * pool.length)]);
        }
      }

      for (const q of sessionQuestions) {
        let numVal: number | null = null;
        let textVal: string | null = null;
        let emojiVal: string | null = null;
        let trafficVal: string | null = null;

        const baseScore = 2.5 + Math.random() * 2.5;
        const trendBonus = (14 - dayOffset) * 0.02;
        const userVariance = (user.id % 3) * 0.3 - 0.3;

        if (q.inputType === "likert_5") {
          numVal = Math.max(1, Math.min(5, Math.round(baseScore + trendBonus + userVariance)));
        } else if (q.inputType === "frequency_5") {
          numVal = Math.max(1, Math.min(5, Math.round(3 - trendBonus + userVariance * 0.5)));
        } else if (q.inputType === "traffic_light") {
          const score = baseScore + trendBonus;
          trafficVal = score > 4 ? "green" : score > 2.5 ? "yellow" : "red";
        } else if (q.inputType === "yes_no") {
          numVal = Math.random() > 0.4 ? 1 : 0;
        }

        const norm = normalizeScore(q.inputType, { numericValue: numVal, trafficLight: trafficVal });

        await db.insert(responsesTable).values({
          checkInId: checkIn.id,
          questionId: q.id,
          numericValue: numVal,
          textValue: textVal,
          emojiValue: emojiVal,
          trafficLight: trafficVal,
          normalizedScore: norm,
        });
      }
    }
  }

  console.log("Seeding sub-teams...");
  await db.execute(sql`INSERT INTO sub_teams (name, color, team_id) VALUES ('Design #1', '#6366f1', ${team.id}), ('Project #2', '#ec4899', ${team.id})`);

  console.log("Seeding intent threads...");
  const followUpQuestions = questions.filter((q) => q.followUpLogic != null);

  type ThreadConvo = {
    pillar: string;
    topic: string;
    memberId: number;
    messages: { role: "anonymous_member" | "lead"; content: string }[];
  };

  const threadConvos: ThreadConvo[] = [
    {
      pillar: "wellness",
      topic: "What's draining your energy the most?",
      memberId: 7,
      messages: [
        { role: "anonymous_member", content: "[Selected: Too many meetings, Context switching] [Other: Slack notifications breaking flow] [Comment: By Friday I feel completely drained, especially after back-to-back project handoffs]" },
        { role: "lead", content: "I hear you. Would it help if we blocked focus time on your calendar? I'm thinking 2-hour no-meeting blocks." },
        { role: "anonymous_member", content: "That would be amazing actually. Mornings work best for deep work." },
      ],
    },
    {
      pillar: "wellness",
      topic: "What's draining your energy the most?",
      memberId: 8,
      messages: [
        { role: "anonymous_member", content: "Workload, Unclear priorities" },
      ],
    },
    {
      pillar: "management",
      topic: "What would help you feel safer raising concerns?",
      memberId: 7,
      messages: [
        { role: "anonymous_member", content: "Regular anonymous feedback channels would help — sometimes I have things to say but worry about being identified" },
        { role: "lead", content: "That's exactly why we built this channel! Feel free to use it anytime. I'll also look into adding anonymous retro formats." },
      ],
    },
    {
      pillar: "design_courage",
      topic: "What's holding you back from taking creative risks?",
      memberId: 7,
      messages: [
        { role: "anonymous_member", content: "Tight deadlines make it feel impossible to experiment. When we have 3 days for a feature, there's no room to try something unconventional." },
        { role: "lead", content: "Valid point. What if we carved out a 'creative sprint' — one day per sprint purely for exploration?" },
        { role: "anonymous_member", content: "I love that idea. Even half a day would make a difference. Could we pitch it to the team?" },
        { role: "lead", content: "Absolutely. Let me draft a proposal and we can discuss in the next team meeting." },
      ],
    },
    {
      pillar: "design_courage",
      topic: "What's holding you back from taking creative risks?",
      memberId: 9,
      messages: [
        { role: "anonymous_member", content: "Fear of judgment, Past negative experience" },
        { role: "lead", content: "I'm sorry to hear that. Creating a safe space for experimentation is really important to me. Would it help to have a 'no-judgment' design review format?" },
      ],
    },
    {
      pillar: "collaboration",
      topic: "Where do you feel support is lacking?",
      memberId: 7,
      messages: [
        { role: "anonymous_member", content: "Getting timely code reviews and design feedback — sometimes PRs sit for days" },
        { role: "lead", content: "I'll set up a review rotation so nothing sits more than 24 hours. Would that help?" },
        { role: "anonymous_member", content: "Yes, that would be a huge improvement!" },
      ],
    },
    {
      pillar: "recognition",
      topic: "What would help you feel more valued?",
      memberId: 7,
      messages: [
        { role: "anonymous_member", content: "More recognition in team-wide settings, not just private messages" },
      ],
    },
    {
      pillar: "growth",
      topic: "What type of growth would be most valuable to you?",
      memberId: 7,
      messages: [
        { role: "anonymous_member", content: "Would love more mentorship from senior designers and opportunities to lead small projects" },
        { role: "lead", content: "Great to hear you're interested in growing! I'll pair you with a senior mentor starting next sprint. Any specific area?" },
        { role: "anonymous_member", content: "Motion design and interaction patterns — that's where I want to level up" },
      ],
    },
    {
      pillar: "alignment",
      topic: "What feels most unclear or competing right now?",
      memberId: 10,
      messages: [
        { role: "anonymous_member", content: "Not sure which stakeholder feedback to prioritize when they contradict each other" },
      ],
    },
  ];

  for (const convo of threadConvos) {
    const matchingQ = followUpQuestions.find((q) => {
      const fl = q.followUpLogic as { question?: string };
      return fl.question === convo.topic || q.pillar === convo.pillar;
    });

    const [thread] = await db
      .insert(intentThreadsTable)
      .values({
        teamId: team.id,
        questionId: matchingQ?.id ?? null,
        userId: convo.memberId,
        pillar: convo.pillar,
        topic: convo.topic,
      })
      .returning();

    for (const msg of convo.messages) {
      await db.insert(intentMessagesTable).values({
        threadId: thread.id,
        content: msg.content,
        authorRole: msg.role,
        userId: msg.role === "lead" ? 6 : null,
      });
    }
  }

  console.log("Seeding kudos...");
  const kudosSeeds = [
    { from: 8, to: 7, content: "Your design system work has been incredible — it's made everyone's workflow so much smoother!", category: "recognition", emoji: "🌟" },
    { from: 9, to: 7, content: "Thanks for always being patient when explaining things. You're an amazing teammate.", category: "compliment", emoji: "💛" },
    { from: 10, to: 7, content: "The animation you added to the onboarding flow was chef's kiss. Really elevated the whole experience!", category: "recognition", emoji: "🔥" },
    { from: 7, to: 8, content: "Your attention to detail in code reviews catches things nobody else sees. Truly appreciated!", category: "recognition", emoji: "🦎" },
    { from: 7, to: 9, content: "You brought such great energy to the brainstorm session last week. Keep being you!", category: "encouragement", emoji: "✨" },
    { from: 8, to: 9, content: "Your presentation skills have really leveled up — the client loved your delivery!", category: "recognition", emoji: "🎯" },
    { from: 9, to: 10, content: "Thanks for jumping in to help when we were behind. That kind of teamwork matters.", category: "compliment", emoji: "🤝" },
    { from: 10, to: 8, content: "Your UX research insights completely changed our approach — brilliant work!", category: "recognition", emoji: "💡" },
    { from: 8, to: 10, content: "Keep pushing creative boundaries — your ideas are what make this team special.", category: "encouragement", emoji: "🚀" },
    { from: 6, to: 7, content: "You've grown so much this quarter. Really proud of the initiative you're showing!", category: "encouragement", emoji: "🌱" },
  ];

  for (const kudo of kudosSeeds) {
    await db.insert(kudosTable).values({
      teamId: team.id,
      fromUserId: kudo.from,
      toUserId: kudo.to,
      content: kudo.content,
      category: kudo.category,
      emoji: kudo.emoji,
    });
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
