# Vocabulary Flashcards for Kids — Phase 1 Design

Date: 2026-09-27
Status: Approved
Scope: Phase 1 of 4 (see "Overall project roadmap" below)

## Overall project roadmap

The full product is an English vocabulary learning website for a 6-year-old
studying the Cambridge (Young Learners) curriculum used at Vinschool. It is
being built as four independent phases, each with its own design/plan cycle:

1. **Phase 1 (this document):** Vocabulary data + flashcard learning screens.
2. **Phase 2:** Placement test to assess starting vocabulary level and pick
   an appropriate starting set of topics/words.
3. **Phase 3:** Daily practice test that measures progress over time.
4. **Phase 4:** Reporting dashboard summarizing words learned and progress
   trends.

Phases 2–4 will reuse the vocabulary data and the per-word progress records
established in Phase 1, but are out of scope for this document.

## Goals (Phase 1)

- Let a single child browse English vocabulary by topic and learn words
  through flashcards with a fun illustration and correct pronunciation.
- Track, per word, whether the child marked it "known" or "still learning",
  as a foundation for later phases (daily tests, dashboard).
- Fun, colorful, playful visual design appropriate for a 6-year-old.
- Full English immersion: no Vietnamese anywhere in the product (flashcard
  content or UI chrome). Meaning is conveyed through the illustration, not
  translation.

## Non-goals (Phase 1)

- No placement test, no daily test, no dashboard (later phases).
- No multi-user accounts or server-side storage — single child, local only.
- No AI-generated illustrations yet — emoji/icons are used as placeholder
  illustrations; can be swapped for AI-generated art in a later pass.

## Users & usage context

- Single child (age 6), likely using a tablet or phone browser, plus a
  parent who may set things up. No login.

## Tech stack

- **Vite + React + TypeScript**.
- **Tailwind CSS** for styling — chosen for fast iteration on a colorful,
  playful UI and built-in responsive utilities (tablet/phone friendly).
- **React Router** for screen navigation, so later phases can add routes
  (placement test, daily test, dashboard) without restructuring navigation.
- Google Fonts: a rounded, kid-friendly display font (e.g. Baloo 2 or
  Fredoka) for headings/word text.
- No backend. Deployable as a static site.

## Data model

### Vocabulary data (static, bundled with the app)

File: `src/data/vocabulary.ts`

```ts
interface Topic {
  id: string;        // e.g. "animals"
  name: string;       // e.g. "Animals"
  emoji: string;       // topic tile icon, e.g. "🐶"
  color: string;       // tailwind color token for the topic tile
}

interface VocabWord {
  id: string;          // e.g. "animals-dog"
  word: string;        // e.g. "Dog"
  topicId: string;      // references Topic.id
  emoji: string;        // e.g. "🐶"
}
```

Word list is authored by Claude based on the Cambridge Young Learners
(Starters) framework — not guaranteed to match Vinschool's internal
curriculum exactly, since no official word list was provided. Target ~10–15
words per topic across topics such as: Animals, Colors, Family, Food, Body,
Numbers, Toys, Weather, Clothes, Actions — roughly 150–200 words total for
the initial release.

### Progress data (client-side persistence)

Stored in `localStorage` under a single key (e.g. `vocab-progress`), as a
map from word id to progress record:

```ts
interface WordProgress {
  status: "known" | "learning";
  lastSeen: number;     // epoch ms
  timesSeen: number;
}

type ProgressStore = Record<string /* wordId */, WordProgress>;
```

This is the data Phase 3 (daily test) and Phase 4 (dashboard) will read
and build on. If `localStorage` is unavailable (e.g. private browsing),
the app still functions for the current session; progress just doesn't
persist across reloads.

## Screens & flow

Routes (React Router):

- `/` — **Home**: grid of topic tiles (colorful, one color + emoji per
  topic). Tapping a topic navigates to its topic screen.
- `/topic/:topicId` — **Topic screen**: shows word count for the topic and
  a large "Start Learning" button.
- `/topic/:topicId/session` — **Flashcard session**: presents words one at
  a time.
  - Each card shows: emoji illustration (large), the English word (large,
    clear text), and a speaker button 🔊.
  - Pronunciation plays automatically when a card appears, and can be
    replayed by tapping the speaker button.
  - Two large action buttons below the card: "I know it! ✅" and "Still
    learning 🌱". Tapping either records progress for that word and
    advances to the next card.
  - A progress bar at the top shows position within the session.
- `/topic/:topicId/summary` — **Summary screen**: shown after the last
  card. Displays counts of "known" vs "still learning" words for the
  session (with a light celebratory animation), a "Review again" button
  that restarts a session containing only the "still learning" words, and
  a button to return Home.

## Visual design

- Bright, saturated color palette; large rounded corners (`rounded-3xl`);
  big tap targets sized for small hands.
- Kid-friendly rounded display font (Baloo 2 or Fredoka) for words and
  headings.
- Light bounce/scale micro-animations on button press and card transitions.
- Illustrations are Unicode emoji (free, no asset pipeline, consistent
  rendering on modern devices/browsers) — the recommended path to a fuller
  AI-illustrated version later without changing the data model (an `emoji`
  field can later be replaced/augmented by an `imageUrl` field).

## Pronunciation

- `window.speechSynthesis` (Web Speech API), voice locale `en-US` (or
  `en-GB`), speech rate ~0.85 (slightly slower than default) for clarity.
- No audio files, no external TTS service, no API key — works fully
  offline once the page is loaded (subject to browser voice availability).

## UI language

- All interface text (buttons, instructions, headings) is in simple
  English, consistent with the immersion approach — e.g. "Start Learning",
  "Listen", "I know it!", "Still learning", "Next Topic". Icons reinforce
  meaning for a child who may not yet read fluently.

## Error handling

- Web Speech API unsupported/unavailable: hide the speaker button (or
  show it disabled) and show a small inline note; never crash the card.
- `localStorage` unavailable or write fails: app continues to work for the
  session; progress simply isn't retained across reloads. No blocking
  errors shown to the child.
- Missing/empty topic (defensive only, shouldn't occur with static data):
  redirect to Home.

## Testing approach

- Component-level tests (Vitest + React Testing Library) for:
  - Flashcard session: advancing through cards, recording "known" vs
    "learning", progress bar state, session completion.
  - Progress persistence read/write helpers (mocking `localStorage`).
  - Summary screen "Review again" filtering to only "still learning"
    words.
- Manual check in a real browser for Web Speech API pronunciation and
  overall visual/interaction feel (automated tests won't meaningfully
  cover audio output or animation feel).

## Open questions / future considerations (not blocking Phase 1)

- Exact Vinschool word list may later replace the Cambridge
  Starters-based list Claude authors for Phase 1.
- Emoji illustrations may be replaced/augmented with AI-generated art in a
  future phase.
- Placement test (Phase 2) will need a way to map test results to a
  starting subset of topics/words — data model may need a `level` or
  `difficulty` field added to `VocabWord` at that point.
