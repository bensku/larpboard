# Larpboard

In Finnish-style LARPs, contacts between player characters often play a
very important role. For larger production teams, this presents a challenge:
how to keep _many_ contacts in sync, to avoid plot holes or gameplay issues?

Larpboard is based on my experiences as writer/GM. Compared to writing things
using a word processor (e.g. Google Docs), it can:

- Show contacts of the currently edited character from both perspectives
  - ... with live editing support!
- Automatically check and warn about several common issues
  - One-sided contacts (unless marked intentional)
  - Characters within same group not 'knowing' each other
  - Wildly varying contact counts between characters
- Help teams track completeness (without resorting to a separate spreadsheet)

## Technical details

On surface, Larpboard is a pretty standard (if very messy) web app.
It uses React, Tailwind and some shadcn UI components in frontend,
and a sync server to replace a backend.

The less usual part is that Larpboard supports live collaborative editing.
I used Yjs CRDT library as baseline and built a (pretty terrible) realtime
database on top of it. Then I built React hooks for the database. The result
is that everything from text fields to reorderable lists allows multiple
people to change things simultaneously without breaking anything.
Well, _mostly_ without breaking anything.

> Caution! Pre-alpha software; if it breaks, you can keep the pieces!

## Installation

For development, Bun is used:

```sh
bun install

bun server.ts # To run the development "backend"
bun dev # To run Vite for React live reloads, etc.
```

Authentication is configured by adding environment variables.
For example, put this to your `.env`:

```
LARPBOARD_TOKEN_test=foo
```

... and then you can visit the project `test` using the following "secret" link:
[http://localhost:5173/test/foo](http://localhost:5173/test/foo)

For production, you should probably use containers. Images and deployment
instructions for them coming soon!
