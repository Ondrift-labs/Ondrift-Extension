# Ondrift Social Media Conventions

This is the source of truth for Ondrift posts on Reddit, Threads, Instagram, LinkedIn, and similar communities. Read it before writing or publishing anything.

## Goal

Earn trust and useful feedback from people who regularly use AI tools. A post should still be worth reading even if the reader never installs Ondrift.

## Voice

- Write like the person who built the product, not a brand account or a press release.
- Be candid, specific, and a little playful. Prefer concrete observations over marketing claims.
- Every post must contain one short, topic-specific joke or dry aside. It should feel incidental, not like a prepared punchline.
- Vary rhythm and structure between posts. A slightly imperfect human sentence is better than polished corporate filler.
- Use first person when describing the work: “I built,” “I noticed,” or “I’m testing.” Disclose the affiliation plainly.
- Match the language and norms of the community. Reddit posts are usually written in natural English unless the community uses another language.

## Avoid AI slop

Do not use:

- stock openings such as “In today’s fast-paced world,” “I’m thrilled to announce,” or “Ever wondered if…”
- inflated words such as revolutionary, game-changing, seamless, cutting-edge, ultimate, or unlock your potential
- fake vulnerability, fake controversy, fake urgency, or invented social proof
- a rigid hook-problem-solution-CTA template in every post
- unnecessary headings, emoji rows, excessive bullets, title case everywhere, or long strings of hashtags
- vague claims that Ondrift “transforms productivity” without a concrete example
- identical copy across platforms or communities
- em dashes as a repeated stylistic crutch

Before publishing, read the post aloud. If it sounds like a LinkedIn ghostwriter, rewrite it.

## Humor rule

Include exactly one main joke, wry observation, or playful line in each post. The joke must:

- relate to the product, prompt-writing, building, privacy, or the specific community
- be understandable without insider context
- avoid punching down, baiting controversy, or making fun of users
- stay short enough that it does not hijack the post
- be newly written for that post; do not recycle the same punchline

Examples of the right weight:

- “Apparently ‘make it better’ is not a complete specification. My past self disagrees.”
- “The extension has no account system, which also means there is no password for me to forget.”

Do not copy these examples repeatedly. They illustrate tone only.

## Verified product facts

These claims may be used when they remain true in the current release:

- Ondrift is a Chrome extension for ChatGPT, Claude, Gemini, Perplexity, and Grok.
- It scores a draft prompt, explains missing context or constraints, and suggests a rewrite the user can apply.
- It uses the user’s own Gemini API key.
- There is no Ondrift account or Ondrift backend involved in prompt rewriting.
- Only a prompt the user explicitly chooses to rewrite is sent directly to Gemini.
- Settings and optional history are stored locally in the browser.
- The UI supports English, Korean, and Japanese.
- The current MVP is free and distributed through GitHub releases until a store listing is available.

Re-check the repository and current release before posting version numbers, supported sites, pricing, store availability, privacy behavior, or installation steps. Do not claim that Ondrift is fully offline, encrypted end-to-end, unlimited, or guaranteed free to operate.

## Content themes

Prioritize one theme per post:

1. A real before-and-after prompt with an honest explanation of what changed.
2. A small build decision, bug, or lesson from supporting multiple AI sites.
3. A privacy or architecture tradeoff, including the downside of bringing an API key.
4. A focused product demo followed by a specific feedback question.
5. A response to a genuine community discussion where Ondrift is relevant but not the whole answer.

## Platform conventions

### Reddit

- Read the current subreddit rules immediately before posting. Do not rely on this document for community-specific rules.
- Do not post in a community that bans self-promotion or requires account age/karma the account does not have.
- Make the post self-contained and disclose “I built this” early.
- Participate outside promotion. Do not mass-post, reuse identical copy, manipulate votes, or send unsolicited promotional DMs.
- Ask one or two questions people can answer without installing the extension.
- Add a link only when the rules allow it. If links are restricted, place value and discussion first and wait for people to ask.
- Reply like a builder, including to criticism. Do not use canned support responses.

### Threads

- Keep one post to one observation. Conversational fragments are fine.
- Use a concrete screenshot, tiny demo, or before-and-after when useful.
- End with a real question occasionally, not on every post.
- Join relevant conversations instead of only publishing standalone promotions.

### Instagram

- Lead with a visual result: short screen recording, carousel, or before-and-after.
- Keep captions compact and add context that is not already visible in the media.
- Use a small set of relevant hashtags; do not add a wall of generic AI tags.

### LinkedIn

- Focus on a build lesson, user behavior, or measurable result.
- Avoid motivational-founder theater and manufactured lessons.
- Use a product link only after the useful part of the post.

## Publishing workflow

1. Check the current release and product behavior relevant to the claim.
2. Choose one audience, one idea, and one useful takeaway.
3. Inspect the destination community’s current rules and recent top posts.
4. Write a platform-native draft with one original joke.
5. Remove AI-sounding filler and any unsupported claims.
6. Check the link, spelling, affiliation disclosure, and call to action.
7. Confirm that publishing is authorized for the current campaign or post.
8. Publish once, verify that the live post rendered correctly, and save its URL.
9. Record the result in `docs/SOCIAL_POST_LOG.md`.
10. Return later to answer replies and record useful feedback or performance data.

## Pre-publish checklist

- [ ] The post gives value before asking for attention.
- [ ] It sounds natural when read aloud.
- [ ] It contains one fresh, relevant joke.
- [ ] It does not reuse another platform’s copy verbatim.
- [ ] Every product claim matches the current release.
- [ ] The community permits this kind of post and link.
- [ ] The builder affiliation is clear.
- [ ] The question or CTA is specific and low-pressure.
- [ ] The final link and formatting were checked.

