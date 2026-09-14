# Launch day: Tuesday 15 September 2026

The post goes live at 00:01 Pacific, 04:01 in Argentina. Product Hunt ranks by votes and comments in the first hours, with a heavy weight on the first four to six. Everything below is written so Maxim can paste and go.

## Timeline (Argentina time)

- **Monday evening**: send the "launching tomorrow" note to 10 to 15 people (text below). Do not ask for votes, ask them to look and comment.
- **04:00 to 04:30**: post live. Check that the first comment is there (it was written in the form). Post the X thread and the LinkedIn post (both in `github-and-posts.md`). Reply to the first comments within minutes; PH rewards makers who are present.
- **08:00 to 10:00**: second pass on comments. Share the PH link in the Astro Discord showcase channel and in one or two relevant subreddits only where self-promotion is allowed (r/SEO and r/webdev do not allow launch posts; r/Astro allows showcase posts).
- **12:00 to 14:00**: third pass. If the post is in the top 10, post a short update comment ("what people asked most so far").
- **18:00 to 20:00**: last pass. Thank commenters by name in one comment.
- **Wednesday**: reply to anything left, read the traffic in the AI visibility check and the products page (GA4), note which product got the clicks.

## Message to friends and contacts (Monday)

Hi, tomorrow at 04:00 Argentina time I launch a free tool on Product Hunt: sixteen automatic checks for content sites, the ones we use on our own sites. If you have five minutes tomorrow, have a look and leave a comment with a question or an opinion, it helps more than a vote. Link: https://www.producthunt.com/posts/operstack-gates

## Replies to the comments that always come

Paste, adjust one detail, send. Keep replies short: two to five sentences, one link at most.

**"Congrats on the launch! What made you build this?"**
Thanks. Fifteen content sites on one pipeline, and the same defects kept shipping past the build log: titles cut mid-sentence, sections with nothing under them, one paragraph copied to 121 pages with the numbers swapped. Every gate exists because that exact thing went live at least once.

**"How is this different from a linter or from Vale?"**
A linter reads one file. The gates read the corpus: gate 05 compares paragraphs across pages with the digits masked, gate 06 finds sentences shared by three or more pages, gate 14 checks that llms.txt still matches the site, gate 08 resolves every link in the built HTML against the redirects file. You could add some of that to Vale rules; the corpus-level checks are the part nobody had.

**"Does it work with Next.js / Hugo / WordPress?"**
Any folder of Markdown or MDX files with frontmatter. Astro gets the deepest support (the exact link check needs a static build). WordPress: not directly; export to Markdown first, or run the free AI visibility check on the live site instead: https://oper-stack.com/ai-visibility/

**"Why sixteen? Feels arbitrary."**
It is exactly the number of defects that shipped on our sites and cost something. The thresholds live in one JSON file, and I would rather hear which ones are wrong for your corpus than defend them.

**"Isn't this just for AI-generated content?"**
It catches what any scaled production ships: humans on templates, humans in a hurry, and models. The gate that catches copied paragraphs with swapped numbers was written before we used a model for anything.

**"Does it send my content anywhere?"**
No. It runs locally, no account, no telemetry, and the only network calls are optional link checks against your own site. MIT licence, the code is on GitHub.

**"What does the AI visibility check actually measure?"**
Five things an answer engine needs before it can cite a site: whether its crawlers are allowed in, whether there is an llms.txt map, whether schema names the entity, whether pages open with a quotable answer and carry tables, and whether pages expose dates and sources. Ten seconds, public signals only.

**"How do I make money with this / what do you sell?"**
The gates, the starter and the Claude Code plugin stay free. The paid products are a written SEO, AEO and GEO audit and the Site Kit (the starter plus the generator and the niche discovery module) for people who want the whole pipeline: https://oper-stack.com/products/

**"Can I add my own gate?"**
Yes. Each gate is one file in src/gates with the same shape; copy the closest one, register it, and send a pull request if it is general. Issues welcome for thresholds that feel wrong.

**"Any plans for a hosted version / a GitHub Action?"**
The package already returns exit codes and a JSON report, so it runs in any CI as one step. A dedicated Action is a good idea; if enough people ask, it goes on the list.

**"Great idea, but the demo numbers look fake."**
They are, on purpose. The fixture market, Isla Verde, is fictional and every figure was invented for the tests, so nobody mistakes the demo for advice.

**Negative or dismissive comment.**
Fair point. Which part would you change? The thresholds and the gate list are both in the open, and a concrete example of a corpus where a gate fires wrongly is the most useful thing I can get today.

## After the day

- Add "Featured on Product Hunt" badge if the post finished in the top five of the day; otherwise keep the plain badge.
- Write down the three most repeated questions; they become FAQ entries on the product page.
- Reply to every comment that is still open on Wednesday morning.
