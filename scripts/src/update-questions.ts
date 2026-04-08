import { db, questionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function updateQuestions() {
  console.log("=== Updating question bank ===\n");

  const demoteIds = [24, 29, 34, 39, 44];
  for (const id of demoteIds) {
    await db.update(questionsTable)
      .set({ isCore: false, frequencyClass: "high" })
      .where(eq(questionsTable.id, id));
  }
  console.log("Demoted 5 core questions to high frequency (keeping wellness/alignment/belonging as core)");

  const newQuestions = [
    { pillar: "wellness", questionText: "I feel physically well enough to perform at my best.", inputType: "likert_5", frequencyClass: "standard", impactWeight: 0.9, order: 6, source: "research" },
    { pillar: "wellness", questionText: "I rarely feel emotionally drained at the end of the workday.", inputType: "likert_5", frequencyClass: "standard", impactWeight: 0.8, order: 7, source: "research" },
    { pillar: "wellness", questionText: "I get enough sleep to feel rested for work.", inputType: "likert_5", frequencyClass: "deep", impactWeight: 0.7, order: 8, source: "research" },
    { pillar: "wellness", questionText: "I feel supported by my team when I'm going through a tough time.", inputType: "likert_5", frequencyClass: "deep", impactWeight: 0.8, order: 9, source: "research" },

    { pillar: "alignment", questionText: "I can see how my role contributes to the company's mission.", inputType: "likert_5", frequencyClass: "standard", impactWeight: 0.9, order: 6, source: "research" },
    { pillar: "alignment", questionText: "My team's strategy is clearly communicated.", inputType: "likert_5", frequencyClass: "high", impactWeight: 1.0, order: 7, source: "research" },
    { pillar: "alignment", questionText: "I understand how my performance is evaluated.", inputType: "likert_5", frequencyClass: "standard", impactWeight: 0.8, order: 8, source: "research" },
    { pillar: "alignment", questionText: "Our team's goals are realistic and achievable.", inputType: "likert_5", frequencyClass: "deep", impactWeight: 0.7, order: 9, source: "research" },

    { pillar: "management", questionText: "My lead checks in on my wellbeing, not just my output.", inputType: "likert_5", frequencyClass: "standard", impactWeight: 1.0, order: 6, source: "research" },
    { pillar: "management", questionText: "I receive recognition from my lead for good work.", inputType: "likert_5", frequencyClass: "high", impactWeight: 0.9, order: 7, source: "research" },
    { pillar: "management", questionText: "My lead creates a safe space for honest conversation.", inputType: "likert_5", frequencyClass: "standard", impactWeight: 1.0, order: 8, source: "research" },
    { pillar: "management", questionText: "My lead removes blockers so I can focus on my work.", inputType: "likert_5", frequencyClass: "deep", impactWeight: 0.8, order: 9, source: "research" },

    { pillar: "growth", questionText: "I receive mentorship or coaching that accelerates my development.", inputType: "likert_5", frequencyClass: "standard", impactWeight: 0.9, order: 6, source: "research" },
    { pillar: "growth", questionText: "I have had meaningful feedback in the last two weeks.", inputType: "likert_5", frequencyClass: "high", impactWeight: 1.0, order: 7, source: "research" },
    { pillar: "growth", questionText: "I see a future for myself at this organization.", inputType: "likert_5", frequencyClass: "standard", impactWeight: 0.9, order: 8, source: "research" },
    { pillar: "growth", questionText: "I am encouraged to try new approaches even if they might fail.", inputType: "likert_5", frequencyClass: "deep", impactWeight: 0.7, order: 9, source: "research" },

    { pillar: "design_courage", questionText: "I feel empowered to challenge the status quo.", inputType: "likert_5", frequencyClass: "standard", impactWeight: 1.0, order: 6, source: "research" },
    { pillar: "design_courage", questionText: "Our team values quality over speed when it matters.", inputType: "likert_5", frequencyClass: "high", impactWeight: 0.9, order: 7, source: "research" },
    { pillar: "design_courage", questionText: "I have the autonomy to make design decisions within my scope.", inputType: "likert_5", frequencyClass: "standard", impactWeight: 0.9, order: 8, source: "research" },
    { pillar: "design_courage", questionText: "Our team allocates time for creative exploration and R&D.", inputType: "likert_5", frequencyClass: "deep", impactWeight: 0.8, order: 9, source: "research" },

    { pillar: "collaboration", questionText: "Our team communicates effectively across different time zones or locations.", inputType: "likert_5", frequencyClass: "standard", impactWeight: 0.8, order: 6, source: "research" },
    { pillar: "collaboration", questionText: "I trust my teammates to deliver on their commitments.", inputType: "likert_5", frequencyClass: "high", impactWeight: 1.0, order: 7, source: "research" },
    { pillar: "collaboration", questionText: "Our team celebrates wins together.", inputType: "likert_5", frequencyClass: "standard", impactWeight: 0.7, order: 8, source: "research" },
    { pillar: "collaboration", questionText: "I feel comfortable asking for help when I need it.", inputType: "likert_5", frequencyClass: "deep", impactWeight: 0.9, order: 9, source: "research" },

    { pillar: "recognition", questionText: "The way recognition happens on this team feels genuine and fair.", inputType: "likert_5", frequencyClass: "standard", impactWeight: 0.9, order: 6, source: "research" },
    { pillar: "recognition", questionText: "I know when my work has made a difference.", inputType: "likert_5", frequencyClass: "high", impactWeight: 1.0, order: 7, source: "research" },
    { pillar: "recognition", questionText: "My unique skills and strengths are utilized well.", inputType: "likert_5", frequencyClass: "standard", impactWeight: 0.8, order: 8, source: "research" },
    { pillar: "recognition", questionText: "I feel that credit is given where it's due on this team.", inputType: "likert_5", frequencyClass: "deep", impactWeight: 0.7, order: 9, source: "research" },

    { pillar: "belonging", questionText: "I feel psychologically safe to express dissent.", inputType: "likert_5", frequencyClass: "standard", impactWeight: 1.0, order: 6, source: "research" },
    { pillar: "belonging", questionText: "I feel that my personal identity is respected here.", inputType: "likert_5", frequencyClass: "high", impactWeight: 1.0, order: 7, source: "research" },
    { pillar: "belonging", questionText: "I would recommend this team as a great place to work.", inputType: "likert_5", frequencyClass: "standard", impactWeight: 0.9, order: 8, source: "research" },
    { pillar: "belonging", questionText: "I feel a genuine sense of belonging on this team.", inputType: "likert_5", frequencyClass: "deep", impactWeight: 0.8, order: 9, source: "research" },
  ];

  let added = 0;
  for (const q of newQuestions) {
    await db.insert(questionsTable).values({
      pillar: q.pillar,
      questionText: q.questionText,
      inputType: q.inputType,
      options: null,
      order: q.order,
      impactWeight: q.impactWeight,
      frequencyClass: q.frequencyClass,
      isCore: false,
      isRequired: true,
      source: q.source,
      followUpLogic: null,
    });
    added++;
  }
  console.log(`Added ${added} new research-backed questions`);

  const all = await db.select().from(questionsTable);
  const cores = all.filter(q => q.isCore);
  console.log(`\nFinal: ${all.length} total questions, ${cores.length} core`);

  const byPillar: Record<string, number> = {};
  all.forEach(q => { byPillar[q.pillar] = (byPillar[q.pillar] || 0) + 1; });
  Object.entries(byPillar).sort().forEach(([p, c]) => console.log(`  ${p}: ${c} questions`));
}

updateQuestions().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
