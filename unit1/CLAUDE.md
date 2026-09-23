# unit1/ — "Cell by Cell" (Koran's Unit 1 review dashboard)

Context handoff from a claude.ai chat with Irene (2026-09-23). Irene speaks Spanish; reply to her in Spanish. Everything the student sees is in English.

## What it is
- Live: https://clipstocks.github.io/ap-review-koran/unit1/ (GitHub Pages, branch main).
- Single self-contained file: unit1/index.html (question bank, 6 images as base64, CSS and JS all inline). No build step.
- Separate from the Chapter 1 dashboard at the repo root. Do not touch root index.html, js/, css/ when working on unit1.
- Header: "Koran" (gold), "Cell by Cell — stronger every day" (gold), small grey "Unit 1 Exam: Ch. 1–3 + Labs 1–3". Always dark theme. "@clipAI" small at the bottom.

## Source material (NOT in the repo, keep it that way)
- Unit 1 Exam Review BSC2085 Summer 2026 (Ch. 1, 2, 3); Lab Activity #1, #2, #3.
- 6 image panels (RBC tonicity hypo/iso/hyper; skin cancer basal/squamous/melanoma) without labels. Irene approved keeping these 6 public. Study-guide photos must never be committed (.gitignore excludes docs/study-guide/).

## Question bank (const BANK inside index.html)
- 214 questions, 87 topics. Sections: Chapter 1, Lab 1, Chapter 2, Chapter 3, Lab 2, Lab 3, Images.
- Fields: t topic, s section, y type (mc|tf|case|sa), q, o options, a, e short explanation (middle-school level), img key.
- mc/case: correct option is o[0] (shuffled on screen). tf: a = true/false. sa: a = array of correct indexes.
- APPEND new questions at the end only (progress references questions by index).
- Followed the course where it differs from textbooks: fever = positive feedback; muscular includes "protection"; pancreas in RUQ.

## Rules (Irene's decisions)
- 20 questions/day. Score out of 20; sticky card says "Final score" when done.
- True/False wrong: "Incorrect", 0, no 2nd try, show answer + explanation.
- Others: 1st miss "Incorrect, one more try" (not revealed); 2nd try right = ½; two misses = 0 + answer + explanation.
- Not right on 1st try -> topic returns next day with a different variant.
- Daily pick: review topics, then never-seen, then least recent / lowest mastery.
- "Clear and start over" after finishing: same questions, reshuffled, unlimited rounds. Only ROUND 1 counts (score, mastery, review). Other rounds = practice, shown in history.
- Progress report: days completed, average % (round 1), streak, topics practiced, to review, mastery by topic, history.
- localStorage key koran-unit1-review-v1 (per device).

## Pending
1. Send results to the Google Sheet "A&P Review – Koran" (Apps Script /exec, same plan as root CLAUDE.md) so Irene sees daily + cumulative results.
2. WhatsApp via CallMeBot (7 AM link, 6 PM reminder, 8 PM result to Irene); numbers/apikeys only in Apps Script properties.
3. Apply answer-key corrections Irene reports (numbering follows section order).
