# Confirmed decisions

Status: Draft  
Version: 0.3  
Depends on: docs/00-competition-constraints.md  
Last updated: 2026-11-04

Recorded from the product interview and workflow discussion. Confirmed choices are not validated findings. Recommendations without explicit acceptance remain open below. This log is not a PRD or task tracker; use GitHub Issues for implementation tasks.

Sections 01–13 retain their legacy identifiers. New decisions use D-xx; earlier history is preserved.

## 01 — Audience and problem hypothesis

- Target Indonesian junior-high students.
- Problem hypothesis: students struggle to evaluate environmental misinformation, rather than simply lacking environmental knowledge. No validated evidence yet; the founder's observations are motivation, not findings.
- Broad green-ecosystem knowledge, including climate, flora, and fauna, remains the long-term vision.

## 02 — Discovery and learning validation

- Before the 7 Nov build period, test 5–8 real viral environmental claims, mixing true and false, with 3–5 students and one teacher. Record errors and cues used. Gather secondary evidence from fact-checking organizations and digital-literacy surveys.
- The eventual PRD must explicitly label assumptions, describe validation, define a pivot criterion for the learning focus, and list open questions.
- Run a small qualitative pilot with 3–5 students comparing fixed versus AI feedback, using unseen claims for transfer assessment. Do not claim statistical effectiveness or population prevalence.
- Self-grade approximately 20 sample justifications for flaw accuracy, groundedness, and answer leakage. Record self-grading bias and pilot limitations.
- Retain first/final justifications where revision occurs; use changes as an immediate-correction metric, distinct from transfer. Assess written quality with a predefined human rubric, separately from scoring.

## 03 — Evidence-first racing loop

- Prefer evidence checking over speed-based guessing.
- Checkpoint stages: inspect one of three clues with a limited budget; judge; select supporting evidence, then receive a sourced explanation.
- Optional final action remains share / don't share / report; inclusion and rationale are unresolved, not core scope.
- Bots advance steadily. Correct reasoning drives rewards; speed contributes only a small bonus.
- Three judgments—supported / contradicted / insufficient evidence—are a hypothesis to test with students. Define a two-option fallback before testing; exact wording and trigger are not yet confirmed.

## 04 — Human-controlled content

- Target 15–20 original claims written and human-verified by C/the team, with cited official sources and a human-written evidence pack per claim.
- No real social accounts, screenshots, or politically contested topics in the shipped claim set. Real viral claims belong to discovery, not copied game content.
- AI never decides claim truth. Human answer keys are authoritative.

## 05 — AI's bounded role

- Click-based checkpoints receive fixed, instant feedback. AI is reserved for selected checkpoints requiring a one-sentence written justification.
- AI classifies reasoning using a fixed taxonomy and returns `{flaw_type, hint, evidence_id}`. Hints must stay grounded in the current human-written evidence pack, refuse unsupported material, and never reveal correctness or the answer.
- Always provide one hint on a successful response, including a probing question for sound reasoning, so hint presence does not reveal correctness.
- Adaptive next-claim selection is rule-based. AI never selects the claim or awards points.
- Cache AI outputs and ship pre-generated demo fallback content. Exact caching/privacy mechanics remain open.
- Evaluate AI's added value against fixed feedback; unique educational value remains unvalidated.

## 06 — Revision, reveal, and failure behavior

- Written checkpoints withhold correctness until final submission. Allow one optional revision before revealing verdict and sourced explanation; skipping revision takes one tap.
- Limit written checkpoints to 2–3 per race. Click checkpoints remain fast.
- Store first/final justifications where applicable, subject to the unresolved privacy/storage policy.
- On AI failure, timeout, or missing/invalid pack evidence, skip revision and show the fixed sourced explanation. Never block the race. This supersedes the earlier proposed fallback-hint path.
- The hint → revise → reveal flow must be understandable in a silent demo.
- Optional revision is lower priority than core justification → hint → verdict. Track priority in a GitHub Issue; the later workflow decision supersedes the earlier request to put it in `PLAN.md`.

## 07 — Deterministic scoring

- Human-authored judgment and evidence answer keys determine boosts.
- First-attempt judgment/evidence earns the main reward. A smaller improvement bonus applies when revision corrects judgment or selected evidence.
- No bonus merely for rewriting. AI classifications and human evaluation of written reasoning do not award points.
- Exact points, speed weighting, and race timing remain undecided.

## 08 — Team and frontend boundary

- Four humans, all using AI coding agents: A gameplay/frontend; B backend/AI; C content; D UI/UX, QA, demo.
- A owns `apps/web/src/gameplay/` and frontend app wiring. D owns `apps/web/src/ui/` and browser acceptance tests; D defines shared components, A composes gameplay using them.
- Cross-owner edits require the affected owner's agreement before editing. Agents stop and ask when tasks exceed assigned ownership.
- GitHub usernames are deferred. Ownership uses A–D labels until handles are supplied.

## 09 — Repository and development workflow

- Use `contracts/`, `apps/web/`, `apps/api/`, `content/` with one JSON file per claim, and `docs/` in the current workspace.
- Contract-first development using mock API/fixtures. Contract changes require a dedicated PR, author sign-off, and approving reviews from the other three humans on the latest revision.
- CODEOWNERS records directory ownership once usernames are available; it does not enforce unanimous approval.
- Short-lived slice branches, frequent rebasing, squash merges, runnable `main`; separate git worktree per parallel agent.
- Avoid shared feature registries and shared index files. Dependency changes require a dedicated PR.
- GitHub Issues tracks tasks instead of editing `PLAN.md`.
- CI must run lint, typecheck, tests, and content validation covering schema, sources, and answer keys.
- Run lint and tests before commits; human reviews every PR. No force-push to `main`; no secrets in commits; use `.env.example` with safe placeholders when configuration is introduced.

## 10 — Delivery schedule

- Walking skeleton merged on day 1: 7 Nov 2026, after official kickoff.
- Integration day: 10 Nov. Feature freeze: 13 Nov. Submission: 14 Nov.
- Follow the official prohibition on source changes after the submission deadline.

## Open decisions

- Pilot-dependent: 2 vs 3 judgment options, confidence rating, inspect-step clarity — pending pilot results
- Pilot-format for SMP: interview vs in-class form — pending selection.

- Exact competition subtheme. Smart & Fun Education is a possible fit, not yet selected; choose exactly one.
- Problem-validation threshold and pivot condition; proposed small-sample discovery thresholds were not explicitly accepted.
- Three-way judgment comprehension threshold, two-option fallback wording, final inspection budget, optional sharing/reporting action.
- Race length, scoring constants, speed bonus, how to keep reading slowly viable.
- Whether original game claims reproduce the reasoning difficulty found with real viral claims.
- Flaw taxonomy, evaluation rubric/examples, AI-output acceptance criteria, prompt/model, timeout, cache matching/invalidation, treatment of ambiguous/off-topic/adversarial text.
- Consent, storage, retention, external AI handling, and deletion for student justifications; no real student-data persistence is approved yet.
- Team hours/availability. Four roles are confirmed; capacity estimates are not.
- B stewardship of shared tooling/CI and D stewardship of docs; these were recommendations, not accepted assignments.
- GitHub repo/handles, stack/package manager, executable checks, contract formats, exact submission mechanism/time.
- Committee permission for pre-build design/documentation; eligibility of ideas previously prototyped but not entered elsewhere.

One-week risks: verifying 15–20 evidence packs, racing polish, AI evaluation, and revision may exceed capacity. Revision remains optional; do not describe the target content count as completed work.

## 11 — Workspace and decision-recording discipline

- The current directory is the workspace. Create all project files here; do not inspect or modify parent directories.
- Append every explicitly confirmed decision to this file as it is confirmed. Do not leave confirmed decisions only in chat or batch them until the interview ends.
- Keep unconfirmed recommendations and assumptions labeled as such. When a decision changes, append the replacement and identify the superseded decision rather than silently rewriting its history.
- Continue the interview one question at a time, with a recommendation and challenges to weak assumptions or one-week scope. Stop when the user says “enough”.
- The user authorized writing `docs/WORKFLOW.md` and `AGENTS.md`; this supersedes the initial restriction on drafting those documents. The PRD and application implementation are not yet requested.

## 12 — Secondary evidence and limits of inference

- Cite the following as secondary evidence in the eventual PRD: CfDS UGM / APNIC Foundation (ISIF Asia), *Tackling Climate Crisis Misinformation in Indonesia* (2024). The study details below were supplied by the user; the original report, URL, and page/table references have not been independently checked in this workspace. Verify those references before presenting them as checked citations.
- Reported method: online survey, August–September 2023, n=2,401; 51.6% Gen Z. Respondents were general internet users, not a student-specific sample; the sample is not representative.
- User-reported findings: 63.5% use social media as their main climate-information source; 98% had encountered climate misinformation on social media; approximately 74% report confidence identifying it; 62.3% “only reach the verification stage”; approximately 20% created counter-narratives. Confidence was self-reported, not tested. Preserve the qualification on the verification-stage figure; check its definition and denominator in the original report before interpreting it.
- The same study reportedly analyzed 123 items from four fact-checking sites, identifying seven misinformation types. Themes included religion, politics, and climate alarmism; content often invoked names, figures, sources, or authority. This describes the analyzed corpus, not population prevalence or a requirement to include those themes in the game.
- These findings provide context, not validation of the target students' needs. Student difficulty evaluating environmental claims, a confidence–accuracy gap among those students, the value of racing, and improved discernment from game/AI feedback remain unvalidated hypotheses. The study does not establish that a game improves discernment.
- Verification update, 2026-10-25 (D-42; user-confirmed): the CfDS figures were checked against the English Executive Summary text at https://apnic.foundation/wp-content/uploads/2024/04/Executive-Summary-Tackling-Climate-Change-Misinformation-in-Indonesia-ENG-Ver.pdf, not against the full report. This updates the earlier unchecked status only for that stated scope; it is not a claim of an independent agent audit. The 62.3% “verification stage” wording is ambiguous and must not be reinterpreted; its precise meaning and denominator remain [OPEN].

## 13 — Pilot refinement and content constraints

- Keep the student pilot as a validation task; secondary evidence does not replace direct testing with the target learners.
- Include an optional confidence rating AFTER judgment and BEFORE reasoning in the pilot to explore the confidence–accuracy gap (D-18 supersedes the earlier pre-judgment timing). This is a pilot measure, not a confirmed production-game feature. With the small sample, report observations descriptively/qualitatively rather than population estimates or causal claims.
- Base the shipped claim set on 3–4 misinformation types. The exact types and mapping to inspection cues remain open; do not invent the study's taxonomy before consulting it.
- Prefer verifiable factual claims. Write original claims and cite official verification sources in the human-authored evidence packs.
- Avoid politically or religiously contested topics. This extends the earlier exclusion of politically contested topics; the report's religious/political themes are not a mandate to cover them.

## D-14 — Pilot documentation ownership and scope

- Date: 2026-10-25. Confirmed by user.
- C owns docs/pilot-protocol.md; D reviews format. Roles are already assigned in legacy §08, so the conditional B handover is unnecessary.
- Authorized edits for this slice: docs/pilot-protocol.md and this decision log only. Describe the protocol; create no results; preserve docs/pilot-kit.md.
- Rationale: bounded content ownership and review, without implying that a pilot has occurred.

## D-15 — SMP target and participant labeling

- Date: 2026-10-25. Reconfirmed by user; clarifies legacy §01.
- Target users are SMP (Indonesian junior high). Label every SMA/college participant as proxy, not as a target-user participant.
- Require written parent/teacher permission for every participant under 18, plus voluntary participant agreement. Use participant codes; omit names, schools, photos, and audio from session notes, following the pilot kit. Consent records must remain separate from notes and outside the repository; storage, retention, and deletion remain open.
- Rationale: make age-group mismatch explicit and protect minors without treating proxies as target validation.

## D-16 — Pilot card verification and preparation

- Date: 2026-10-25. Confirmed by user.
- Preserve all six pilot-kit card texts and answer keys verbatim in this protocol draft. Every card starts Unverified; verification date and verifier remain [OPEN] until the user checks each source personally. K4 and K6 remain Unverified; K6 has no source URL yet [OPEN].
- Card wording, especially K4–K6, is likely too technical for SMP [ASSUMPTION]. The user will rewrite it before the pilot; the agent must not rewrite it. A wording change requires checking that its source and key still match.
- Rationale: retain the source draft without presenting unchecked keys or age suitability as established.

## D-17 — Judgment options for the SMP pilot

- Date: 2026-10-25. Confirmed by user.
- Default to two judgment options for SMP; use three options only as a probe. Final game options and confidence-rating inclusion remain pilot-dependent.
- Supersedes legacy §03's three-option hypothesis as the default for this pilot only; it does not settle the production interface. Exact third-option wording and probe procedure remain [OPEN].
- Rationale: explore comprehension without making the three-option design a requirement.

## D-18 — Confidence timing resolved

- Date: 2026-10-25. Confirmed by user.
- Capture confidence AFTER the judgment and BEFORE the reasoning, matching docs/pilot-kit.md. Supersedes §13's earlier pre-judgment timing and resolves the timing question previously listed under Open decisions; §13 is updated explicitly at the user's request.
- Rationale: confidence concerns the chosen answer; capturing it before justification is intended to preserve spontaneous confidence without influence from constructing the justification, at a cost of one tap. These are design reasons, not validated pilot findings.
- Scope: leave docs/pilot-protocol.md unchanged as requested; its confidence-timing [OPEN] statements are stale and superseded by this decision.

## D-19 — Bad News citations and PRD evidence limits

- Date: 2026-10-25. Confirmed by user for inclusion in the eventual PRD.
- Record only the supplied bibliographic details below. These citations and sample/method details are user-supplied, not independently verified in this workspace; no additional findings are inferred.
  - Roozenbeek & van der Linden (2019), "Fake news game confers psychological resistance against online misinformation", Palgrave Communications. Volume, issue, pages/article number, DOI, URL, and other study details: [OPEN].
  - Roozenbeek & van der Linden (2020), "Good News about Bad News: Gamified Inoculation Boosts Confidence and Cognitive Immunity Against Fake News", Journal of Cognition. N=196, controlled. Volume, issue, pages/article number, DOI, URL, and other study details: [OPEN].
  - Axelsson, Nygren, Roozenbeek & van der Linden, "Bad News in the civics classroom: How serious gameplay fosters teenagers' ability to discern misinformation techniques". 516 upper-secondary Swedish students. Venue, year, volume, issue, pages/article number, DOI, URL, and other study details: [OPEN].
- Carry these limits into the PRD: Western samples; not environmental; the classroom sample is upper-secondary, not SMP; long-term effect unclear. Do not generalize the classroom age group to every cited study or claim effectiveness for this game's target users.
- Rationale: retain relevant secondary evidence with explicit limits, without substituting it for target-user validation or inventing citation metadata.

## D-20 — PRD session scope and evidence status

- Date: 2026-10-25. Confirmed by user.
- Authorize this session to edit only docs/PRD.md and this decision log. This supersedes legacy §11's statement that the PRD has not been requested. No additional approved-document list has been supplied; the placeholder is not approval.
- Propose an outline first and wait for approval; then ask at most 12 PRD-specific questions, one at a time with a recommendation, before drafting and self-review. Stop questioning when the user says “enough”.
- Keep docs/PRD.md at Draft v0.1 until pilot results are available. Pilot results are pending; keep dependent items [OPEN]. Secondary evidence remains subject to legacy §12 and D-19's verification and inference limits.
- Keep decisions in this log; the PRD references their identifiers rather than duplicating decision records. Include Status, Version, Depends on, and Last updated in its header. Target at most two pages; exclude FRD, architecture, design, and implementation planning.
- Rationale: bound the document and review process without presenting unrun pilots, unverified sources, or placeholder capacity details as findings.

## D-21 — PRD outline approval

- Date: 2026-10-25. Confirmed by user.
- Approve the proposed nine-section PRD outline: problem/evidence; users; goals/non-goals/subtheme; MVP scope tiers; AI role/boundaries; success metrics; validation plan/status; assumptions/risks/constraints; judging alignment. Target at most two pages under D-20.
- Continue the interview with selectable options and a recommendation, one question at a time, at most 12 product questions. The outline approval is not a product-question answer.
- Rationale: establish a compact document structure and make unresolved choices easier to answer without treating recommendations as decisions.

## D-22 — Competition subtheme

- Date: 2026-10-25. Confirmed by user; PRD interview question 1/12.
- Select Smart & Fun Education as the sole competition subtheme. Environmental claims provide the learning context, not a second selected subtheme. Resolves the subtheme item under Open decisions.
- Rationale: the product is intended to practice evidence-based claim evaluation through gameplay and feedback. This alignment is product intent, not evidence of learning effectiveness or environmental impact.

## D-23 — Primary MVP use context

- Date: 2026-10-25. Confirmed by user; PRD interview question 2/12.
- Prioritize individual, independent web play by SMP students under D-15. Narrower grade/age range remains [OPEN]; do not invent it.
- Validate whether learners can understand instructions and complete the core flow without facilitator help. This is a product validation need, not an established usability result or a change to pilot consent requirements.
- Rationale: focus the MVP on self-directed use; suitability for that context remains [ASSUMPTION] pending direct observation.

## D-24 — Environmental awareness intent and unresolved priority

- Date: 2026-10-25. User-stated intent during PRD interview question 3/12.
- Environmental awareness is an intended product goal in the context of factual and misleading environmental information on social media. No improvement, target-student difficulty, or target-student exposure has been demonstrated; these remain [ASSUMPTION].
- [OPEN] Resolve whether awareness is a supporting goal of evidence evaluation or a replacement for legacy §01's primary problem hypothesis. No supersession is recorded before that clarification. The user's references to “giringan/buzzer” do not establish a definition, finding, or classification requirement.
- Rationale: preserve the stated intent without treating a broader aspiration as measured impact or silently replacing the earlier product focus.

## D-25 — Environmental awareness as primary product goal

- Date: 2026-10-25. Confirmed by user; PRD interview question 4/12.
- Make environmental awareness the primary product goal; evidence-based claim evaluation is a means toward that goal. Supersedes legacy §01's prioritization of misinformation-evaluation difficulty over environmental knowledge and resolves D-24's priority question.
- The observable meaning of awareness and its evaluation remain [OPEN]. No awareness improvement, behavioral change, or target-user need is established. This does not change D-22's sole selected competition subtheme or the human-controlled scoring/AI boundaries.
- Rationale: align the product goal with the user's explicit priority while preserving evidence limits; the awareness-first framing is product intent, not a research finding.

## D-26 — Awareness indicator deferred

- Date: 2026-10-25. Confirmed by user; PRD interview question 5/12.
- Leave the observable meaning and primary indicator of environmental awareness [OPEN]. Do not adopt the proposed factual-explanation, claim-vigilance, or behavioral-intention indicators as requirements.
- Rationale: the user has not selected an indicator; the PRD must expose this measurement gap rather than invent a success criterion for D-25.

## D-27 — Core-first MVP scope tiers

- Date: 2026-10-25. Confirmed by user; PRD interview question 6/12.
- Must: one short racing/checkpoint flow with evidence inspection, judgment against human-authored answer keys, written justification at selected checkpoints, bounded AI hints, sourced verdict/feedback, and transparent fallback behavior. Preserve legacy §§05–07: deterministic scoring; live AI failure skips revision and reveals fixed feedback; pre-generated demo AI content is labeled.
- Nice-to-have: optional revision and expansion toward legacy §04's 15–20 verified claims and §06's 2–3 written checkpoints per race. Supersedes those numerical targets as minimum MVP commitments; minimum content and written-checkpoint counts remain [OPEN].
- Deferred: accounts, online leaderboards, teacher dashboard, and share/report actions. Resolves the optional share/report scope question for this MVP.
- Rationale: prioritize a demonstrable complete flow before content volume and optional features; available verification capacity remains unknown.

## D-28 — Reported team capacity, unit pending

- Date: 2026-10-25. User report during PRD interview question 7/12.
- Reconfirm four people. User supplied “3 jam”; whether this means per person per day or a combined/other time budget remains [OPEN]. Retain legacy §08's A–D roles; no role change was supplied. Classes/exams and other availability constraints remain [OPEN].
- Rationale: record the supplied capacity without silently multiplying an ambiguous time budget into a delivery commitment.

## D-29 — Capacity unit clarified

- Date: 2026-10-25. Confirmed by user; PRD interview question 8/12.
- Four people each have an estimated three hours per day during the build period. Resolves D-28's time-unit ambiguity. Keep legacy §08's A–D roles; specific scheduling constraints remain [OPEN].
- Rationale: use the user's availability estimate for scope assessment, not as evidence that all planned work will fit or as a delivery guarantee.

## D-30 — Multiple-choice intent; justification boundary unresolved

- Date: 2026-10-25. User clarification during PRD interview question 9/12.
- User specifies multiple-choice questions; students do not author the questions. [OPEN] Whether students still write a justification at selected checkpoints requires clarification against legacy §§05–06 and D-27. Do not infer that written justifications have been removed or that the existing AI-feedback scope is unchanged.
- The privacy options in question 9 were not selected. External processing, storage, access, retention, and deletion of real student data remain [OPEN]; no new permission is established.
- Rationale: distinguish selecting a claim judgment from writing its justification before changing the core AI interaction or data assumptions.

## D-31 — Multiple-choice racing without written justification

- Date: 2026-10-25. Confirmed by user; PRD interview question 10/12.
- Remove student-written justifications from the MVP. Students answer multiple-choice questions. Correct answers advance the car; incorrect answers leave it stationary for that answer. Typing Racer is a user-supplied interaction reference, not evidence of educational value or authorization for speed-based scoring.
- Supersedes legacy §§05–06's written-justification/hint/revision loop and D-27's written-checkpoint requirement. Written revision and justification-rewriting bonuses no longer apply to this MVP; other answer/evidence scoring details remain [OPEN]. Do not infer that evidence inspection is removed or speed bonuses are approved.
- User requests AI evaluation around correctness feedback. [OPEN] Clarify whether AI explains a human-key verdict or decides correctness; the latter would conflict with legacy §§04–05 and §07. No authority to let AI decide truth or points is established.
- [OPEN] Wrong-answer continuation/retry behavior and exact movement/scoring constants. No student-authored text is required by this interaction; privacy obligations for answer selections and provider processing remain unresolved.
- Rationale: align the interaction with the user's racing-game intent while explicitly exposing the resulting AI-role and scoring questions.

## D-32 — Post-race AI summary

- Date: 2026-10-25. Confirmed by user; PRD interview question 11/12.
- Human-authored keys determine correctness and car movement. After the race, AI summarizes selected answers and explains concepts using the relevant human-verified material; gameplay does not wait for AI. Do not infer unwritten reasoning from multiple-choice selections.
- On AI failure, show fixed sourced explanations. Preserve transparent labeling of live AI and pre-generated demo content. Supersedes legacy §§05–06's pre-verdict hint, answer-leakage restriction for those hints, and revision-specific failure flow for this MVP. Resolves D-31's correctness-authority question without changing the prohibition on AI scoring.
- [OPEN] Minimum context, accepted output format, grounding checks, timeout, cache/privacy policy, and evaluation criteria for the new post-race role. Prior taxonomy and single-current-claim input assumptions are not automatically requirements for this redesigned summary.
- Rationale: provide explanatory feedback without interrupting racing or delegating correctness to AI; added value over fixed feedback remains [ASSUMPTION].

## D-33 — Minimum evaluation package and demo data boundary

- Date: 2026-10-25. Confirmed by user; PRD interview question 12/12.
- Plan target-SMP usability observations: core-flow completion without assistance, confusion, and assistance needed. Results remain pending; distinguish this gameplay evaluation from the existing discovery protocol, which contains no gameplay task.
- Internally review post-race AI summaries on synthetic answer selections for agreement with human keys, source support, unsupported additions, and fallback behavior. No numerical acceptance threshold or awareness-improvement claim is approved.
- Use synthetic data for the AI demo first. Sending real students' answer selections to AI remains blocked pending privacy decisions; removing free text does not resolve external processing, access, retention, or deletion.
- Review wording/material when learners are confused; compare AI summaries with fixed feedback when added value is unclear. These are review triggers, not automatic pivot thresholds or approval to remove AI from the competition deliverable. Final success thresholds, pivot rules, and the awareness indicator remain [OPEN].
- Rationale: obtain observable hackathon-scale evidence while preserving the pending pilot status and avoiding unsupported impact claims or premature student-data processing.

## D-34 — Consolidated current open decisions

- Date: 2026-10-25. Confirmed by user; snapshot includes D-35–D-43 recorded in this revision. Earlier open lists remain historical; this snapshot supersedes their current-status interpretation, not their history.
- Resolved: sole subtheme (D-22, reaffirmed D-41); four-person capacity estimate of three hours/person/day (D-29); primary goal (D-25); confidence timing (D-18); no written justifications and post-race AI role (D-31–D-32); retained inspection (D-35); content/race counts (D-36); wrong-answer continuation (D-37); no speed bonus and steady bots (D-38); application data boundary (D-39). These are decisions, not evidence of implementation or sufficient capacity.
- [OPEN] Awareness definition/indicator (D-26); numerical MVP success thresholds to be supplied by the user (D-40); problem-validation and pivot thresholds; evidence that racing and AI add value.
- [OPEN] Narrower SMP grade/age segment, devices/connectivity, pilot recruitment/format, target/proxy observations, three-option probe procedure, final game judgment labels/options and confidence-feature inclusion, and inspection-budget details. One-of-three inspection is fixed by D-35; do not reopen that selection rule as an undecided feature.
- [OPEN] Verification and user revision of pilot cards (D-16), K6 source, dated claim context, shipped misinformation types/cue mapping, and whether original claims reproduce discovery difficulties. D-36 sets content targets, not completed verification.
- [OPEN] Movement amounts, bot pace/race timing and slow-reading viability, clue-budget presentation, evidence-selection reward details if retained. No speed bonus or same-claim retry is open after D-37–D-38.
- [OPEN] AI model/prompt, approved-source grounding while AI receives only claim IDs/options, output acceptance/format, timeout, and summary-quality comparison. Legacy hint taxonomy/evaluation and written-justification metrics require re-scoping, not automatic implementation.
- [OPEN] Provider processing/retention, notice/permission for real answer selections, browser-session lifetime/clearing, consent-record custodian/access/retention/deletion, and handling of separate pilot evaluation notes. No application server-side student storage is authorized; any cache must respect D-39. Real-student external processing remains gated by D-33.
- [OPEN] Specific availability constraints; shared tooling/docs stewardship; GitHub repository/handles/settings; stack/package manager; contracts/fixtures, executable checks, and approved implementation tasks.
- [OPEN] Committee permission for pre-kickoff documentation; eligibility of previously prototyped ideas; exact submission mechanism/time. Bad News source verification and complete bibliographic metadata remain open; CfDS verification is limited by D-42.
- Rationale: provide one current-status reference without erasing superseded decisions or converting unknowns into requirements.

## D-35 — Evidence inspection retained

- Date: 2026-10-25. Confirmed by user.
- Each checkpoint retains inspection of one of three clues with a limited budget, followed by a multiple-choice judgment and fixed sourced explanation. D-31 removes written justification, not evidence inspection; reaffirms legacy §03 and D-27 on this boundary.
- Rationale: preserve evidence checking as the learning interaction despite removal of free-text answers. Budget mechanics remain [OPEN].

## D-36 — Minimum MVP content and race size

- Date: 2026-10-25. Confirmed by user.
- Set the MVP content target at 10–12 verified claims, five claims per race. Expansion to 15–20 remains nice-to-have under D-27. Resolves the minimum-content/race-count questions; it does not assert any claims are already verified.
- Rationale: bound the race and required verification workload while keeping expansion optional.

## D-37 — Wrong-answer continuation

- Date: 2026-10-25. Confirmed by user.
- After a wrong answer, the car stays still, a short sourced explanation is shown, and play continues without repeating that claim. Resolves D-31's wrong-answer continuation/retry question.
- Rationale: maintain forward flow without requiring repeated guesses on the same claim.

## D-38 — No speed bonus; steady bots

- Date: 2026-10-25. Confirmed by user.
- No speed bonus in the MVP. Bots advance at a steady pace. Supersedes legacy §03's small speed bonus and resolves legacy §07's open speed-weighting question for this MVP.
- Rationale: reward human-key correctness rather than response speed. Exact bot pace and whether slow readers remain competitive still need evaluation.

## D-39 — Student-data minimization boundary

- Date: 2026-10-25. Confirmed by user.
- MVP collects no names, provides no accounts, and stores no student data server-side, including answer selections or student-linked summaries in logs/cache. AI receives only claim IDs and chosen options; no names, account identifiers, or student-authored text. Demo data is synthetic, consistent with D-33. This does not authorize adding evidence-pack text or other fields to the AI input; how source grounding works within this restriction remains [OPEN].
- This limits application behavior; it does not claim the AI provider retains nothing or authorize real-student transmission before D-33's remaining privacy gate is resolved. Source-grounding mechanics for the restricted payload remain [OPEN]. Separate pilot permission/evaluation records remain subject to D-15 and unresolved handling policy.
- Rationale: minimize student data while supporting answer-based summaries without persisting student sessions on the server. Supersedes incompatible legacy student-text persistence and student-linked cache assumptions for the MVP.

## D-40 — MVP success is operational, not awareness change

- Date: 2026-10-25. Confirmed by user.
- State plainly that the MVP does not measure awareness change. Awareness remains the primary stated goal under D-25; its indicator stays [OPEN] under D-26.
- Evaluate MVP success through flow completion without help, AI-summary agreement with human keys, source support, fallback behavior, and pilot observations. These are evaluation dimensions, not achieved outcomes.
- Numerical thresholds will be supplied by the user. Until then record them as [ASSUMPTION] / [OPEN], with no invented numbers and no pass claim. Supersedes any interpretation of earlier metrics as awareness-impact measurement; retains D-33's synthetic internal AI evaluation.
- Rationale: separate a long-term product goal from what can be observed during this hackathon.

## D-41 — Awareness goal and education subtheme compatibility

- Date: 2026-10-25. Confirmed by user.
- Consciously retain Smart & Fun Education as the sole subtheme (D-22), despite awareness being the primary goal (D-25). These are compatible: the educational game is the means; environmental awareness is the intended learning goal, not a second competition subtheme.
- Rationale: preserve a single coherent submission framing without claiming educational effectiveness.

## D-42 — CfDS Executive Summary verification scope

- Date: 2026-10-25. Confirmed by user; verification-status update, not a new research finding.
- Record in legacy §12 that the CfDS figures were checked against the English Executive Summary text: https://apnic.foundation/wp-content/uploads/2024/04/Executive-Summary-Tackling-Climate-Change-Misinformation-in-Indonesia-ENG-Ver.pdf. The full report was not checked; do not represent this as full-report verification or an independent agent audit.
- The 62.3% “verification stage” wording remains ambiguous and must not be reinterpreted. Precise definition/denominator remain [OPEN]; do not infer that it measures successful verification, failure, or tested skill.
- Rationale: identify the actual source checked and preserve its interpretive uncertainty and legacy §12's population/causality limits.

## D-43 — Draft v0.2 authorization and interview closure

- Date: 2026-10-25. Confirmed by user.
- Produce docs/PRD.md v0.2, still Draft, despite pending pilot results. Supersedes D-20's fixed-v0.1 restriction; does not approve the PRD or create pilot findings. Keep the authorized two-file scope and compact outline. User said “enough”; ask no additional interview questions.
- Rationale: incorporate the user's explicit decisions in a reviewable revision without implying validation or approval.

## D-44 — PRD v0.3 readability revision; downstream docs drafted with Claude

- Date: 2026-10-26. Confirmed by user.
- Produce docs/PRD.md v0.3, still Draft: add a plain product summary (section 0) restating D-31–D-39 in prose, and remove meta notes. No decision content changes. Supersedes D-43 only as the current PRD version.
- FRD, ARCHITECTURE, DESIGN, PLAN, and the WORKFLOW/AGENTS revision are grilled and drafted in the Claude project thread instead of separate Codex sessions, following the same outline → grill → draft → self-review steps (guides/session-prompts-v2.md).
- Rationale: make the PRD readable for judges and coding agents without restating decision records, and keep the document pipeline in one place.

## D-45 — Gameplay: direct true/false claims, no clue inspection

- Date: 2026-11-04. Confirmed by user (PRD business-process review, 2026-11-03/04).
- Each question is one environmental claim answered with two options (true/false). No clue inspection step. The player's answers are evaluated at the end of the race (D-50).
- Supersedes D-35 and legacy §03's inspection/evidence-selection stages. D-17's three-option probe remains a pilot-only probe, not a product option.
- No teacher/distribution actor is modelled in the product scope; the product scope is the platform itself.
- Rationale: a simpler, faster interaction the user explicitly prefers. Accepted trade-off: the game no longer trains evidence inspection directly; learning relies on the sourced explanation after a wrong answer and the end-of-race evaluation.

## D-46 — Multiplayer race rules (TypeRacer-style)

- Date: 2026-11-04. Confirmed by user.
- Players race at their own pace from a common start; the race is TypeRacer-style, not Kahoot-style lockstep. From Kahoot only the lobby countdown (3-2-1) and the end podium are borrowed.
- Correct answer: the car advances one step. Wrong answer: the car stays still and the fixed sourced explanation is shown for a fixed lock duration before the next claim (3–5 s; exact value [OPEN]). No retry of the same claim.
- A player finishes on their 5th correct answer. The race ends when all players finish or the time limit expires (3–5 min; exact value [OPEN]). Ranking: finish order first; players who did not finish are ranked by number of correct answers. Tie-break below that [OPEN].
- All players in a room get the same shuffled claim sequence from the bank (10–12 claims, D-36 bank size retained). A player who exhausts the sequence before 5 correct stops and is ranked by correct count.
- Supersedes D-36's "five claims per race", D-38 (speed now decides finish order; bots are fill-ins per D-47), and the D-27 deferral of multiplayer. D-31's correct-moves/wrong-stays rule and D-37's no-retry rule are retained.
- Rationale: user's racing-game intent. Accepted risk [ASSUMPTION]: speed-based finishing rewards fast guessing (50% per guess); the wrong-answer lock is the mitigation and must be evaluated in playtests.

## D-47 — Quick match with bot fill

- Date: 2026-11-04. Confirmed by user.
- Players join through quick match: the server groups whoever is waiting into a 4-slot room. After at most 10 s of waiting, empty slots are filled with bots visibly labelled "BOT".
- Bots follow fixed profiles (an answer accuracy and an answer-delay range per bot); exact profile values [OPEN]. Bots never use AI.
- Location-based matching is rejected (location data of minors). Private room codes are Nice-to-have.
- Rationale: the race always has opponents, including during a single-laptop demo.

## D-48 — Player identity, transient room state, results

- Date: 2026-11-04. Confirmed by user.
- Players type a free nickname; no accounts, no real names requested. Nickname, answers, and race progress exist only in server memory while the room is active and are deleted when the room ends; nothing is written to persistent storage or logs.
- Results show a per-room podium (1-2-3) and full ranking. A global/persistent leaderboard stays Deferred (D-27).
- Amends D-39: transient in-memory room state is permitted; D-39's no-accounts, no-persistent-student-data, and synthetic-demo-data rules remain. Nickname content filtering [OPEN].
- Rationale: multiplayer needs a display name and shared state; keeping both transient preserves data minimization.

## D-49 — Localhost-first runtime

- Date: 2026-11-04. Confirmed by user.
- The MVP runs on localhost (00 §A6). Demo: two or more browser windows on one laptop plus bots; phones on the same Wi-Fi are optional. Public online deployment is Nice-to-have.
- Rationale: the Grand Final requires localhost; real-time multiplayer must not depend on a hosted service.

## D-50 — End-of-race AI evaluation

- Date: 2026-11-04. Confirmed by user.
- After the podium, each player sees an "Evaluasi AI" panel: which claims they got wrong, the misinformation-type pattern behind those mistakes, and one tip. Gameplay never waits for AI; correctness, movement, and ranking come only from human answer keys.
- AI input: claim IDs and chosen answers, plus server-attached human-authored content for those claims (fixed sourced explanation and a misinformation-type tag). No nickname or other player data is sent. Every claim therefore needs a misinformation-type tag from 3–4 types (legacy §13; exact types [OPEN]).
- On AI failure, timeout, or invalid output, show the fixed explanations, labelled as not AI-generated. AI output is labelled as AI. Model, prompt, timeout, output format, and cache policy [OPEN].
- Resolves D-39's grounding question (human-authored content may be attached; it is not student data) and refines D-32 for the multiplayer flow.
- Fact recorded: the guidebook allows AI rather than mandating it, but the demo video must show the AI integration feature (00 §A5) and the rubric scores AI added value and transparency (00 §A7), so an in-app AI feature is required in practice. Confirm with the committee at the 7 Nov mentoring.
- Rationale: give AI a role a fixed template cannot fill (cross-claim pattern feedback) while keeping truth and scoring human-controlled.

## D-51 — Problem evidence framing without pilot results

- Date: 2026-11-04. Confirmed by user.
- The PRD states the problem as a working assumption for design, supported by the real secondary evidence already recorded (legacy §12, D-19, D-42), and states plainly that it has not been tested with SMP students. No pilot results are written or implied; docs/pilot-protocol.md stays a plan. Further desk research may be added later.
- Rationale: the team must be able to account for every claim to judges (00 §A3); presenting an unrun pilot as done would be fabricated evidence.

## D-52 — Current open items after D-45–D-51

- Date: 2026-11-04. Supersedes D-34's open list for gameplay items; D-34's remaining items (awareness indicator, privacy/provider handling, repo/stack, committee questions, citation metadata) still stand.
- [OPEN] Wrong-answer lock duration (3–5 s); race time limit (3–5 min); ranking tie-break; bot profile values; nickname filtering; misinformation types and per-claim tags; AI model/prompt/timeout/output format/cache; content verification of 10–12 claims; whether pilot-kit cards are reused as game claims.
