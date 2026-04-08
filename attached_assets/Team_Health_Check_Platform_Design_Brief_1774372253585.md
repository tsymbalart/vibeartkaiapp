# Design Brief: Team Vibe & Growth Check-in Platform

**Status:** Active reference document for the build process
**Last Updated:** March 2026
**Based on:** UX Research Document (`Team_Health_Check_Platform_UX_Research.md`)

---

## Product Vision

A question-based check-in platform where each teammate answers **one question per screen**, building a gradual, low-friction rhythm of self-reflection across mood, productivity, design courage, and learning growth. The platform analyzes results over time, surfacing individual growth trajectories and team-wide health patterns.

---

## Core Design Decisions

### 1. One Question Per Screen

Every check-in presents a single question on a full screen. This enforces:
- **Focus:** No distractions, no scrolling, no cognitive overload
- **Intentionality:** Each response gets the teammate's full attention
- **Speed:** Tap/slide/type and move on — the flow feels like a conversation, not a form
- **Progress clarity:** A minimal progress indicator shows how far along the check-in is

### 2. Question-Based Architecture with Open-Ended Depth

The check-in is primarily question-driven, mixing:
- **Closed questions** (emoji selector, slider, traffic light) for quantitative tracking
- **Open-ended questions** woven in strategically to overcome the limitations of simple scales

Open-ended prompts are designed to unlock complex feelings and reflections that scales can't capture:
- "What's one thing that gave you energy this week?"
- "What felt risky or courageous in your work recently?"
- "What did you learn that surprised you?"
- "If you could change one thing about how the team works, what would it be?"

The ratio target: roughly **60% closed / 40% open-ended** to balance data richness with completion rates.

### 3. Five Check-in Dimensions

| Dimension | What It Tracks | Input Types |
|---|---|---|
| **Mood & Vibe** | Emotional state, energy, team connection | Emoji selector, open-ended ("What's on your mind?") |
| **Productivity Pulse** | Flow state, blockers, sense of progress | Slider, open-ended ("What's slowing you down?") |
| **Design Courage** | Risk-taking, challenging norms, creative confidence | Traffic light + behavioral checklist, open-ended ("What bold move did you make or avoid?") |
| **Learning & Growth** | New skills, knowledge sharing, curiosity | Behavioral checklist, open-ended ("What did you learn this week?") |
| **Soft & Hard Skill Trajectory** | Self-assessed skill development over time | Slider scale per skill, open-ended reflection on growth areas |

### 4. Input Patterns (from Research)

| Pattern | Used For | Interaction |
|---|---|---|
| **Emoji/Icon Selector** | Daily mood, energy, vibe | Single tap on 3–5 options |
| **Continuous Slider** | Productivity, confidence, skill self-assessment | Drag or tap to position |
| **Traffic Light Cards** | Design courage, team health dimensions | Tap green/yellow/red + optional annotation |
| **Written Reflection Prompt** | Weekly deep reflection, qualitative insight | Open text field with guiding question |
| **Behavioral Checkbox** | Design courage actions, learning behaviors | Tap to check applicable items from a curated list |

---

## Reference Products

### Officevibe (Workleap)
- Clean, approachable, lighthearted interface
- "Good Vibes" recognition cards
- 122 science-backed pulse survey questions
- Slack bot integration for in-flow check-ins
- Manager response via text, video, or voice

### Lattice
- Structured sidebar navigation (1:1s, Growth, OKRs, Reviews)
- AI writing assistance for feedback
- Analytics Explorer with visual dashboards
- Strong integration ecosystem

### 15Five
- Weekly written check-in format that encourages thoughtful self-reflection
- Manager review workflow creating a feedback loop
- Combined performance reviews, 1:1s, and engagement
- "High Five" peer recognition

**Key takeaways from all three:**
- Clean, minimal interfaces that don't overwhelm
- Tight feedback loops between individual input and visible outcomes
- Integration with daily tools (Slack, Teams, Calendar)
- Balance between quantitative data and qualitative reflection

---

## Unique Differentiators

### Design Courage Mood Check
Measuring creative confidence and risk-taking as a trackable dimension:
- **4Cs Framework:** Curiosity, Courage, Collaboration, Connection
- **Behavioral indicators:** "I proposed something bold," "I challenged an existing pattern," "I defended quality under pressure"
- **Mood overlay:** How does emotional state correlate with creative risk-taking?

### Learning Capability Tracking
Five-factor model for team learning health:
1. Team creative efficacy (collective confidence in innovation)
2. Facilitating processes (feedback loops, knowledge sharing)
3. Communication quality (clarity, coordination)
4. Error communication (openness about failures)
5. Co-construction (collaborative knowledge building)

### Soft & Hard Skill Growth Trajectory
- Individual skill radar that evolves over time
- Self-assessment + optional peer assessment per skill
- Categories: Technical Craft, Communication, Leadership, Problem Solving, Domain Knowledge, Creative Thinking
- Quarterly milestone markers showing growth

---

## Information Architecture

```
├── Home / Dashboard (team pulse overview)
├── Check-in (one-question-per-screen flow)
│   ├── Quick Pulse (daily, 2–3 questions, < 30 seconds)
│   └── Weekly Reflection (8–12 questions, 3–5 minutes)
├── My Journey (personal longitudinal view)
│   ├── Mood & Energy Timeline
│   ├── Courage & Creativity Tracker
│   ├── Learning Log
│   └── Skill Growth Radar
├── Team Insights (aggregated analytics)
│   ├── Mood & Wellbeing Heatmap
│   ├── Productivity Trends
│   ├── Design Courage Index
│   └── Learning & Growth Patterns
├── Actions & Follow-ups
│   ├── Team Actions Board
│   └── Personal Growth Goals
└── Settings
    ├── Check-in Schedule & Cadence
    ├── Dimensions & Questions
    ├── Privacy & Anonymity Controls
    └── Integrations (Slack, Teams, Calendar)
```

---

## Check-in Flow: One Question Per Screen

```
[Screen 1]  "Hey Kai, how are you feeling today?"
            → Emoji selector: 😊 😌 😐 😔 😫

[Screen 2]  "What's your energy level right now?"
            → Slider: Low ————————————— High

[Screen 3]  "What's one thing that's on your mind?"
            → Open text field (optional, skip allowed)

[Screen 4]  "Did you do something courageous this week?"
            → Traffic light: Yes, big leap / Small step / Not really
            
[Screen 5]  "Tell us about it — what felt bold or risky?"
            → Open text field (conditional, shown if green/yellow)

[Screen 6]  "What did you learn recently?"
            → Behavioral checklist:
              □ Tried a new tool or technique
              □ Shared knowledge with a teammate
              □ Read/watched something inspiring
              □ Got feedback that shifted my thinking
              □ Other: ___________

[Screen 7]  "How would you rate your productivity flow this week?"
            → Slider with anchors: Stuck ——— Steady ——— In the zone

[Screen 8]  "What could make next week better?"
            → Open text field

[Done]      "Thanks! Your check-in is saved. 
             See your journey →"
```

---

## Visual Design Direction

- **Tone:** Warm, human, approachable — not corporate
- **Typography:** Humanist sans-serif (Inter, Plus Jakarta Sans, DM Sans)
- **Colors:** Calming palette with semantic meaning, color-blind safe
- **Motion:** Subtle transitions between question screens, confirmation animations
- **Dark mode:** Supported from launch
- **Accessibility:** WCAG 2.1 AA minimum, large touch targets, screen reader optimized

---

## Cadence Model

| Cadence | Questions | Time | Dimensions Covered |
|---|---|---|---|
| **Daily pulse** | 2–3 closed | < 30 seconds | Mood, energy |
| **Weekly reflection** | 8–12 mixed (closed + open) | 3–5 minutes | All five dimensions |
| **Bi-weekly deep dive** | 15–20 comprehensive | 7–10 minutes | Full assessment + skill trajectory |
| **Monthly retrospective** | Team discussion facilitated by data | 30–60 minutes | Review trends, set actions |

---

## Privacy & Trust Principles

- Anonymous by default for sentiment data
- Individual journey data is private and controlled by the owner
- Team aggregates require minimum 5 responses before display
- Clear, contextual privacy indicators on every input screen
- Data retention policies visible and configurable
- "Your response is anonymous" shown on each relevant question screen

---

## Key Metrics for Platform Success

| Metric | Target |
|---|---|
| Check-in completion rate | > 75% weekly |
| Time to complete weekly check-in | < 5 minutes |
| 30-day retention (active check-in users) | > 60% |
| Open-ended question response rate | > 50% |
| Actions created from insights | 1+ per team per month |
| User-reported value ("This helps me reflect") | > 4/5 satisfaction |

---

## Methodologies Integrated

1. **Spotify Squad Health Check** — Traffic light + trend arrows for team dimensions
2. **Niko-Niko Calendar** — Daily mood logging, calendar heatmap visualization
3. **Edmondson Psychological Safety** — 7 core dimensions informing team trust questions
4. **eNPS** — Single-question promoter score for team satisfaction benchmarking
5. **4Cs Creative Leadership** — Curiosity, Courage, Collaboration, Connection for design teams
6. **Five-Factor Team Learning** — Creative efficacy, processes, communication, error openness, co-construction

---

*This document serves as the active reference during the build process. See `Team_Health_Check_Platform_UX_Research.md` for the full foundational research.*
