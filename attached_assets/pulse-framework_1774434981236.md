# Pulse Check-In Scoring Framework
## A Methodology for Thematic Team Health, Productivity & Learning Surveys

---

## 1. Research Foundation: Existing Scoring Approaches

Before defining a custom framework, it's worth understanding the landscape of scoring methodologies currently used in pulse survey systems. Based on research across Gallup, Culture Amp, Workleap Officevibe, Satchel Pulse, Ethisphere, and industry literature from 2023–2025, there are five dominant approaches.

### 1.1 Likert Scale Mean Scoring (Most Common)

Respondents rate agreement on a 1–5 scale (Strongly Disagree → Strongly Agree). The question score is the arithmetic mean of all responses. This is the backbone of Gallup's Q12, which reports a "GrandMean" — the average of averages across all 12 items on that 5-point scale. Gallup considers a score shift of ±0.2 as "meaningful change" between survey periods. Culture Amp uses a similar 5-point Likert that rolls up into an Employee Engagement Index scored 5–25 (sum of 5 core items), tracked monthly.

**Strengths:** Simple, interpretable, tracks trends over time, easily benchmarked.
**Weaknesses:** Averages mask polarized distributions; a 3.5 mean could represent uniform neutrality or a split between strong agreement and disagreement.

### 1.2 Favorability / Top-Box Scoring

Instead of the mean, this method calculates the percentage of respondents who selected the top one or two options (e.g., "Agree" + "Strongly Agree" on a 5-point scale). Ethisphere's Culture Quotient uses this: `(favorable responses / total responses) × 100`. Many enterprise platforms (Qualtrics, Peakon) report favorability as their primary metric because it's more intuitive for managers — "72% of the team agrees" is easier to act on than "mean = 3.6."

**Strengths:** Intuitive, action-oriented, resistant to neutral noise.
**Weaknesses:** Loses granularity between mild and strong agreement; can't distinguish "mostly agree" from "strongly agree."

### 1.3 Employee Net Promoter Score (eNPS)

A single 0–10 question ("How likely are you to recommend this company as a place to work?") categorizes respondents into Promoters (9–10), Passives (7–8), and Detractors (0–6). The score = %Promoters − %Detractors, ranging from −100 to +100. Workleap Officevibe integrates eNPS into its pulse cycle, re-asking it every 90 days.

**Strengths:** Single-number health metric, easy to benchmark externally, widely understood.
**Weaknesses:** Too blunt for thematic diagnosis; doesn't explain *why* people feel this way.

### 1.4 Weighted Pillar / Category Scoring

Questions are organized into thematic categories ("Pillars"), and each pillar score is the mean or favorability of its constituent questions. Pillar scores can then be weighted to produce an overall composite. Satchel Pulse rates each question's impact per pillar, and higher-impact questions are weighted more heavily and asked more frequently. Ethisphere assigns canonical weights from 0–10 per question, so the pillar score becomes a weighted mean. Workleap Officevibe groups questions into 10 key metrics, with some metrics carrying more weight (validated by Deloitte) toward the overall engagement score.

**Strengths:** Allows thematic diagnosis, supports prioritization, enables different question frequencies per theme.
**Weaknesses:** Requires expert judgment to set weights; weights must be reviewed periodically.

### 1.5 Rolling Window Aggregation

Instead of point-in-time snapshots, scores aggregate responses over a rolling time window. Workleap Officevibe uses a 90-day rolling average, updated daily, requiring a minimum of 3 responses per metric. Only each respondent's most recent answer counts. Question-level results use a wider 3–6 month window.

**Strengths:** Smooths out noise, compensates for staggered participation in rotating-question systems, always reflects "recent" sentiment.
**Weaknesses:** Slow to reflect sudden shifts; new team members' data blends with stale data.

---

## 2. Assessment of Your Proposed Approach

Your concept has three core elements:

1. **Thematic question bank** organized by categories (design courage, management, wellness, alignment, etc.)
2. **Weekly rotating questions** drawn from the bank
3. **Lead/Director control** over question distribution (e.g., "more wellness questions this week")

### 2.1 What Works Well

**The rotating question bank is a validated pattern.** Both Satchel Pulse and Workleap Officevibe use this exact mechanic — a validated pool of questions mapped to pillars, with a subset served per cycle. Officevibe notes it takes approximately 6 months for a member to cycle through all standard questions, and the same question is never re-asked within 3 months. This approach reduces survey fatigue while maintaining coverage.

**Thematic categories align with best practice.** Gallup's Q12 maps to a four-tier hierarchy (Basic Needs → Individual Contribution → Teamwork → Growth). Culture Amp structures around engagement drivers. Workleap Officevibe uses 10 key metrics. Your categories (design courage, management, wellness, alignment) are domain-appropriate for a design/product organization and fit the established pattern of thematic pillars.

**Weekly cadence is appropriate for fast-paced teams.** Research from Culture Amp (2024–2025) notes that agile teams benefit from weekly insights, while more stable environments suit monthly or quarterly. A weekly pulse with 5–8 questions takes under 2 minutes and maintains a continuous feedback signal.

### 2.2 What Needs Refinement

**Lead/Director distribution override needs guardrails.** Allowing leaders to fully control question distribution introduces two risks:

- **Confirmation bias**: A leader worried about morale might over-index on wellness, missing an alignment problem.
- **Coverage gaps**: If wellness dominates for several weeks, other pillars lose statistical validity (too few recent data points).

The fix is not to remove leader control, but to introduce a minimum-coverage constraint and a core-question anchor (detailed in Section 3).

**Scoring must account for uneven question distribution.** If Week 1 has 5 wellness questions and 1 alignment question, a simple average will misrepresent the team's overall health. Weighted pillar scoring solves this — each pillar score is calculated independently from its own questions, then combined using predetermined weights.

**Role-based visibility matters.** Teammates and leads need different views. A teammate should see their own trends and team aggregates. A lead should see team-level pillar scores, trend lines, and anonymized distributions — but never individual responses.

### 2.3 Verdict

Your concept is sound and aligns with how leading platforms approach pulse surveys. It needs three additions: (1) a scoring engine that handles uneven distribution, (2) guardrails on leader override, and (3) a minimum-coverage rule to maintain pillar validity.

---

## 3. Complete Scoring Framework

### 3.1 Architecture Overview

```
QUESTION BANK (all questions, tagged by pillar)
        ↓
DISTRIBUTION ENGINE (selects weekly questions)
        ↓
WEEKLY PULSE (5–8 questions delivered to teammates)
        ↓
RESPONSE COLLECTION (anonymous, Likert 1–5 + optional open text)
        ↓
SCORING ENGINE (rolling window, pillar scores, composite score)
        ↓
DASHBOARDS (role-based views for teammate, lead, director)
```

### 3.2 Pillars (Thematic Categories)

Define 6–8 pillars appropriate to your organization. Below is a recommended set for a design/product team, drawing from Gallup's engagement hierarchy, Culture Amp's drivers, and domain-specific needs:

| # | Pillar | What It Measures | Example Signals |
|---|--------|-----------------|-----------------|
| 1 | **Wellness** | Physical, mental, emotional health; burnout risk; work-life balance | Energy, stress, recovery, sustainable pace |
| 2 | **Alignment** | Clarity of goals, strategy understanding, role-to-mission connection | Direction, priorities, purpose, strategic clarity |
| 3 | **Management** | Relationship with direct lead, feedback quality, support, trust | 1:1 quality, autonomy, coaching, psychological safety |
| 4 | **Growth & Learning** | Skill development, career progression, challenge level | Learning opportunities, mentorship, stretch assignments |
| 5 | **Design Courage** | Creative risk-taking, quality standards, craft pride, innovation space | Freedom to push boundaries, honest critique, experimentation |
| 6 | **Collaboration** | Team dynamics, cross-functional flow, communication, knowledge sharing | Peer support, conflict resolution, information access |
| 7 | **Recognition & Impact** | Feeling valued, seeing outcomes of work, pride in output | Appreciation, visibility, contribution to outcomes |
| 8 | **Belonging** | Inclusion, psychological safety, cultural fit, voice | Diversity, respect, feeling heard, team identity |

### 3.3 Question Bank Structure

Each question in the bank has the following metadata:

| Field | Description |
|-------|-------------|
| `question_id` | Unique identifier |
| `pillar` | Primary pillar assignment |
| `text` | The question statement |
| `type` | `likert_5` (primary) or `open_text` (supplementary) |
| `impact_weight` | 1.0 (standard) to 2.0 (high-impact), set by organizational psychologist or UX research lead |
| `frequency_class` | `core` (asked every cycle), `high` (every 2–3 weeks), `standard` (every 4–6 weeks), `deep` (monthly+) |
| `last_asked_date` | Per-team tracking to prevent re-asking too soon |
| `min_gap_weeks` | Minimum weeks before re-asking this question (default: 3) |

**Core questions** (1–2 per pulse) are always included and serve as the trend-tracking baseline — analogous to Gallup's GrandMean items or Culture Amp's Engagement Index. Example core questions:

- "I would recommend my team as a great place to work." (eNPS-style, maps to overall health)
- "I have the energy and motivation to do my best work this week." (wellness/productivity signal)

### 3.4 Distribution Engine Logic

Each week, the engine assembles the pulse as follows:

**Step 1: Seat the core.** Always include the 1–2 core questions. These are pillar-agnostic trend trackers.

**Step 2: Apply leader override (with guardrails).**
The lead/director specifies a distribution bias, not absolute control. The system enforces:

- **Maximum concentration**: No single pillar may exceed 50% of the non-core questions in a given week.
- **Minimum coverage**: Every pillar must be asked at least once every 4 weeks (the "freshness constraint"). If a pillar hasn't been asked in 3 weeks, the engine auto-includes one question from it, overriding leader preferences.
- **Leader budget**: The leader gets a "weight dial" per pillar (e.g., Wellness: High, Alignment: Normal, Design Courage: Low this week). "High" doubles the probability of selection; "Low" halves it; "Normal" is baseline.

**Step 3: Fill remaining slots.**
After core + leader-priority + freshness-override questions are seated, fill remaining slots using the frequency_class rotation, prioritizing questions that haven't been asked recently and have higher impact_weight.

**Step 4: Add one open-text question.** Always include one open-ended question, rotating between pillars. ("What's one thing on your mind this week?")

**Result: 6–8 questions per week.** (2 core + 3–5 rotating pillar questions + 1 open-text)

### 3.5 Response Scale

**Primary scale: 5-point Likert, agreement-based**

| Value | Label |
|-------|-------|
| 1 | Strongly Disagree |
| 2 | Disagree |
| 3 | Neutral |
| 4 | Agree |
| 5 | Strongly Agree |

**Why 5-point, not 4-point (forced choice) or 10-point:**
- 5-point is the most validated in engagement research (Gallup Q12, Culture Amp, Officevibe all use it).
- A neutral midpoint is important for pulse surveys because people genuinely have neutral weeks — forcing a binary creates noise.
- 10-point scales add perceived granularity but produce noisier data at small team sizes and slow down completion.

### 3.6 Scoring Engine

#### Level 1: Question Score

For each question in a given week:

```
Question Score = Mean of all responses (1–5 scale)
```

Also calculate:
- **Favorability %** = (count of 4s + 5s) / total responses × 100
- **Distribution** = percentage at each level (for polarization detection)

#### Level 2: Pillar Score (Rolling Window)

Each pillar score uses a **rolling 90-day window** (matching the Officevibe standard), weighted by question impact:

```
Pillar Score = Σ (question_score × impact_weight) / Σ (impact_weight)
```

Where the sum includes all questions belonging to that pillar that were asked within the past 90 days, using only the most recent response per person per question.

**Minimum validity threshold**: A pillar score is only displayed when it has ≥3 unique respondents and ≥2 distinct questions answered within the window. Below this threshold, show "Insufficient data" rather than a misleading number.

#### Level 3: Composite Team Health Score

The overall team health score is a weighted combination of pillar scores:

```
Team Health Score = Σ (pillar_score × pillar_weight) / Σ (pillar_weight)
```

**Default pillar weights** (adjustable by organization, summing to 1.0):

| Pillar | Default Weight | Rationale |
|--------|---------------|-----------|
| Wellness | 0.18 | Foundation — a burnt-out team can't perform on any other dimension |
| Alignment | 0.15 | Strategic clarity is a prerequisite for effective work |
| Management | 0.15 | Gallup finds managers account for ~70% of engagement variance |
| Growth & Learning | 0.13 | Retention and long-term performance driver |
| Design Courage | 0.12 | Domain-specific craft quality signal |
| Collaboration | 0.10 | Enables execution |
| Recognition & Impact | 0.09 | Motivation sustainer |
| Belonging | 0.08 | Cultural health indicator |

These weights are a starting point. The recommendation is to review and adjust them quarterly based on organizational priorities, using the approach Ethisphere describes — canonical weights from 0–10 that get normalized.

#### Level 4: Trend & Alert Logic

- **Trend direction**: Compare current 90-day pillar score to the previous 90-day window. A shift of ≥0.2 (on the 5-point scale) is flagged as "meaningful change" — this threshold comes from Gallup's validated methodology.
- **Alert thresholds**:
  - **Green**: Pillar score ≥ 4.0 or favorability ≥ 75%
  - **Yellow**: Pillar score 3.0–3.9 or favorability 50–74%
  - **Red**: Pillar score < 3.0 or favorability < 50%
- **Polarization alert**: If >20% of responses are at 1–2 AND >20% are at 4–5 on any question, flag it as "polarized" regardless of the mean. A 3.0 mean from uniform neutrality is very different from a 3.0 mean from a split team.

### 3.7 Role-Based Scoring & Visibility

#### Teammate (Individual Contributor)

**What they see:**
- Their own response history and personal trend lines (anonymous to others)
- Team-level pillar scores (aggregated, never individual peers)
- Team composite health score
- Participation rate for their team

**What they do:**
- Complete the weekly pulse (2–3 minutes)
- Optionally add open-text comments (anonymous)
- View team trends to understand collective health

**What they never see:**
- Other individuals' responses
- Lead/Director's override settings
- Alert flags (these are for leaders)

#### Lead (Team Manager / Design Lead)

**What they see:**
- Team-level pillar scores with trend lines (90-day rolling)
- Composite team health score
- Favorability % and response distributions per question
- Polarization alerts
- Trend alerts (meaningful ±0.2 shifts)
- Anonymous open-text feedback
- Participation rate
- Comparison to organizational benchmarks (if available)

**What they do:**
- Set weekly distribution bias via the "weight dial" (pillar emphasis)
- Review alerts and initiate follow-up actions
- Use pillar scores to structure 1:1s and team retrospectives
- Cannot see individual teammate responses (anonymity enforced at ≥3 respondents, matching Officevibe's threshold)

**Scoring context they get:**
- "Your team's Wellness score dropped 0.3 points over the past 4 weeks. This is a meaningful decline. The question 'I have sustainable energy levels throughout the week' moved from 3.8 to 3.2."

#### Director (Department Head / VP)

**What they see:**
- Cross-team comparison of pillar scores and composites
- Organizational heat map (teams × pillars)
- Aggregated trend lines across all teams
- Anomaly detection (teams that deviate significantly from org average)
- Aggregated open-text themes (via keyword/sentiment clustering)

**What they do:**
- Set organizational pillar weights
- Define which pillars are emphasized org-wide (e.g., "Q2 focus: Alignment")
- Override the freshness constraint if a specific pillar needs org-wide deep-dive
- Cannot see team-level anonymous feedback or individual responses

**Scoring context they get:**
- "3 of 7 teams have Alignment scores below 3.0. Org-wide Alignment favorability is 48%, down from 62% last quarter."

---

## 4. Sample Question Bank (Starter Set)

Below is a starter bank of 5 questions per pillar (40 total). In practice, a robust bank should contain 12–20 questions per pillar to support 6-month rotation without repetition.

### Wellness
1. I have sustainable energy levels throughout the work week.
2. I feel I can disconnect from work during non-working hours.
3. My current workload feels manageable.
4. I have been sleeping well and feel rested.
5. I feel emotionally supported in my work environment.

### Alignment
1. I understand how my current work connects to the team's goals.
2. I am clear on what success looks like for my current projects.
3. I feel our team's priorities are well-defined.
4. I understand the strategic direction of the organization.
5. When priorities shift, the reasons are communicated clearly.

### Management
1. My lead provides feedback that helps me improve.
2. I feel comfortable raising concerns with my lead.
3. My lead supports my professional development.
4. I trust my lead to advocate for the team.
5. My 1:1s are valuable and well-structured.

### Growth & Learning
1. I am learning new skills in my current role.
2. I have access to the resources I need to grow professionally.
3. I feel challenged by my work in a healthy way.
4. I have a clear sense of my career path here.
5. I've had opportunities to share or teach what I know.

### Design Courage
1. I feel safe taking creative risks in my work.
2. Our team holds itself to high craft standards.
3. I can push back on requirements when I believe it's right for the user.
4. We make time for exploration and experimentation.
5. Honest design critique is welcomed and practiced on this team.

### Collaboration
1. I can easily get the information I need from other teams.
2. My teammates are responsive and supportive.
3. Cross-functional collaboration is smooth and productive.
4. We resolve disagreements constructively.
5. Knowledge is shared openly within the team.

### Recognition & Impact
1. I feel my contributions are recognized.
2. I can see the impact of my work on real users or outcomes.
3. I feel valued as a member of this team.
4. My work is visible beyond my immediate team.
5. I am proud of what we've shipped recently.

### Belonging
1. I feel I can be myself at work.
2. Diverse perspectives are genuinely valued on this team.
3. I feel included in decisions that affect my work.
4. I feel a sense of connection with my teammates.
5. My voice matters in team discussions.

---

## 5. Clarifying Questions for Implementation

The following questions will sharpen the framework before implementation. They're organized by the underlying methodology they stress-test.

### Health & Burnout Detection
- Should the system include a burnout risk index (composite of specific wellness + workload + energy questions) that triggers an automatic lead alert when a team's score falls below threshold for 2+ consecutive weeks?
- Do you want to integrate the WHO-5 Well-Being Index items (validated 5-item screener) as a periodic deep-dive within the wellness pillar, or keep all questions custom?
- How should the system handle a situation where a team's wellness score is critically low but the lead hasn't taken action within a defined SLA (e.g., 2 weeks)?

### Productivity Signal Integrity
- Should the "productivity" signal be explicit (questions like "I am able to focus on deep work") or inferred from a combination of Alignment + Management + Wellness scores?
- Do you want to track "flow state" or "maker schedule" as a sub-dimension — e.g., "I had sufficient uninterrupted time for focused work this week"?
- How should the scoring handle periods of legitimate low productivity (e.g., team transitioning between projects, post-launch recovery) to avoid false alarms?

### Learning & Growth Calibration
- Should Growth & Learning scores be cross-referenced with actual L&D activity data (courses completed, conference attendance) to validate self-reported perception?
- Do you want a "learning velocity" metric — not just "am I growing" but "is my growth accelerating, plateauing, or declining"?
- Should the system distinguish between technical skill growth (craft mastery) and leadership/soft-skill growth, or keep it unified?

### Leader Override & Governance
- What is the decision authority chain if a director wants an org-wide emphasis that conflicts with a lead's team-level emphasis? (Recommendation: Director sets org-wide floor; lead adjusts within that floor.)
- Should leads see which questions the engine auto-selected vs. which they influenced? (Transparency builds trust in the tool.)
- Is there a "lockout period" after a leader adjusts weights before they can change again — to prevent reactive over-steering?

### Anonymity & Trust
- What is the minimum team size for displaying results? (Industry standard is 3–5 respondents. Officevibe uses 3 for scores, 5 for anonymous feedback.)
- Should open-text responses be reviewed by an AI sentiment classifier before surfacing to the lead, to flag potentially identifying information?
- Do teammates have the option to self-identify their feedback if they choose, or is all feedback strictly anonymous?

### Benchmarking & Maturity
- Do you want internal benchmarking only (team vs. team) or external benchmarking against industry data (requires a platform partner or dataset)?
- Should there be "maturity phases" for the system — e.g., Phase 1 (first 3 months): establish baselines, no alerts; Phase 2: introduce trend alerts; Phase 3: introduce cross-team comparison?
- How will you validate that the pillar weights accurately reflect organizational priorities? (Recommendation: Quarterly calibration workshop with leads and directors.)

### Design Courage (Domain-Specific)
- Is "design courage" defined identically across all teams (product design, brand, UX research), or should sub-questions adapt to discipline?
- Should the Design Courage pillar include a "craft debt" signal — "We are accumulating design shortcuts that will cost us later"?
- How does design courage relate to the organization's risk appetite? Should the target score differ for exploratory vs. execution-phase teams?

---

## 6. Implementation Roadmap

| Phase | Duration | Activities |
|-------|----------|------------|
| **Phase 0: Foundation** | Weeks 1–2 | Finalize pillar definitions, populate question bank (minimum 8 per pillar), set initial pillar weights, define anonymity thresholds. |
| **Phase 1: Baseline** | Weeks 3–14 | Run weekly pulses at default distribution (equal across pillars). No leader override yet. Collect 90 days of baseline data. Establish team norms. |
| **Phase 2: Activate Leader Controls** | Week 15+ | Enable lead weight-dial and distribution bias. Introduce alert system. Begin 1:1 integration. |
| **Phase 3: Cross-Team Intelligence** | Month 6+ | Enable director heat maps, cross-team comparison, organizational trend reports. Calibrate pillar weights based on 6 months of data. |
| **Phase 4: Maturity** | Month 9+ | Introduce external benchmarking (if applicable). Run first annual deep-dive survey to validate pulse findings. Refine question bank based on statistical analysis of question discrimination. |

---

## 7. Sources & References

- Gallup Q12 Meta-Analysis (2024): Validated engagement-to-performance linkage across 50+ industries; 23% profitability increase in high-engagement units; 81% lower absenteeism.
- Culture Amp (2024–2025): Baseline + quarterly pulse structure; 5-point Likert engagement index scored 5–25; recommendation of 50-question baseline + 10–15 question trend pulses.
- Workleap Officevibe: 90-day rolling average methodology; 10 key metrics with Deloitte-validated weighting; 3-respondent minimum threshold; 6-month question rotation cycle.
- Satchel Pulse Survey Methodology: Pillar-based question weighting; impact ratings per question; frequency-based question selection; BRUSO model for question writing; accuracy thresholds for pillar completeness.
- Ethisphere Culture Quotient Scoring: Canonical question weights (0–10 scale); favorability-based scoring; weighted mean calculations for pillars and surveys.
- SHRM (2024): Recommendation of at least two open-ended questions per pulse; 5–10 question ideal length.
- Gallup State of the Global Workforce (2024): 70% increase in well-being (thriving employees) in high-engagement units; 78% decrease in absenteeism.
- Vantage Circle / AON / SHRM Recognition Report (2024–25): Linkage between recognition, engagement, and retention metrics.
