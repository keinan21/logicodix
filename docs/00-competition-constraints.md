# 00 — Competition Constraints: LOGICODIX 2026 Hackathon

> Source: official LOGICODIX 2026 Guidebook (cleaned and distilled by hand from the PDF).
> Section A = facts from the guidebook. Section B = our interpretation. Do not treat B as official rules.
> Theme: "NextGen Digital Innovation: Crafting Creative Solutions for a Better Society"

## A. Official rules (from guidebook)

### A1. Format and eligibility
- Online hackathon: Hacking Week -> Submission & Finalist selection -> offline Grand Final.
- Open to high school students (SMA/SMK/MA or equivalent) and university students across Indonesia.
- Team: max 4 people. Members may come from different institutions and levels.
- Integrated Mentoring is mandatory before the build period (online; sessions: Ideation & Problem Mapping, Technical & AI Integration).
- Participants must follow the official Instagram account and complete registration on the official website.
- Violations can lead to disqualification.

### A2. Timeline (2026)
| Date | Event |
|---|---|
| Mon 7 Sep - Tue 6 Oct | Registration Batch 1 |
| Wed 7 Oct - Fri 6 Nov | Registration Batch 2 |
| Sat 7 Nov | Mentoring & Technical Meeting (qualifying round) |
| Sat 7 Nov - Sat 14 Nov | Hackathon build period (1 week) |
| Sat 14 Nov | **Last submission** |
| Sat 21 Nov | Finalist announcement (Top 8) |
| Sun 22 Nov | Technical Meeting for finalists |
| Sun 29 Nov | Grand Final (offline) & National Tech Seminar |

### A3. Work requirements
- Deliverable: a working **MVP**, **Web or Mobile**.
- Must apply **exactly one of the five subthemes** (listed in A4).
- Must solve a **real problem** using digital technology.
- AI is allowed, both in the development process and as an app feature. AI APIs or open-source models are allowed.
- Work must be original, not plagiarized, and the team must be able to account for it (code, data, assets).
- **The idea and work must not have been used or entered in any previous competition.**
- Development must consider **AI ethics, data protection, and resource efficiency**.
- The work must be runnable and demonstrable at the Grand Final.
- Build period officially starts after mentoring and the Hacking Kick-off.

### A4. Subthemes (choose one)
1. Smart & Fun Education: interactive, accessible, fun teaching/learning; AI as personal tutor or visualization aid.
2. Green Environment & Sustainability: eco-friendly lifestyle, carbon footprint tracking, waste management, natural resource conservation.
3. Local MSME & Creative Economy: digitalization, market access, business management for local MSMEs.
4. Inclusive Health & Well-being: health information access, mental well-being, support for people with disabilities.
5. Civic Tech & Community Service: connect citizens with public services, community issue reporting, local mutual aid.

### A5. Submission
- Source code on the designated **GitHub repository**.
- **Demo video, 3-5 minutes**, showing real features and usage flow, **including the AI integration feature**. The video is a demonstration only, **without voice narration or presentation** from participants.
- Submitted via the mechanism set by the committee, before the deadline (14 Nov).
- **No changes to source code after the submission deadline.** The last version submitted before the deadline is the one judged.

### A6. Grand Final (Top 8 teams, offline)
- Teams must prepare the app to **run on localhost on the laptop used at the Final**.
- Presentation + Live Demo in front of an industry jury panel.
- 15 minutes per team: 1 min laptop setup and localhost verification, 7 min presentation and live demo, 3 min Q&A, 4 min jury assessment and transition.
- Q&A: jury asks about the solution and the app built.
- Prizes: 1st/2nd/3rd place receive prize money + trophy.

### A7. Judging rubric
| Criterion | What is assessed | Weight |
|---|---|---|
| Problem-Solution Fit | Sharpness of problem identification; fit of solution to user needs | 25% |
| Technology Innovation | Creativity and effectiveness of tech use; **AI usage should be added value** | 25% |
| Software Engineering | MVP functionality, code quality, system architecture, **documentation** | 25% |
| UI/UX Design | Interface quality, ease of use, user flow | 15% |
| Special Principles (Green IT & Ethics) | Resource efficiency, data privacy protection, **transparency of AI usage** | 10% |

## B. Our interpretation (not official)

- The demo video has no voice, so the UI must be **self-explanatory** and visibly show the AI feature.
- Docs, architecture, and README are directly scored under Software Engineering. Keep them in the repo.
- The team must be able to explain every part of the code in Q&A, even if AI-assisted.
- Green IT: cache AI outputs, avoid redundant LLM calls, keep assets lightweight.
- Ethics: label AI-generated content, minimize collected personal data, validate factual content.
- Scope for one week: vertical slices, cut anything not needed for the demo flow.

## C. Open questions to confirm with the committee
- May design and documentation be prepared before the 7 Nov kick-off? (Coding should wait until the build period starts unless confirmed.)
- Exact submission mechanism (which GitHub repo/organization, upload format for the video).
- Whether an idea may be reused if only prototyped (not entered) elsewhere.
