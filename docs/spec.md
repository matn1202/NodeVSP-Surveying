# Survey design

What this survey asks, what it records, and why each choice is made that way.
Implementation notes live beside the code; this is the design.

## What it collects

Three tasks share one stimulus set and one submit endpoint.

### 1. Brief writing — `D_human_model`

The participant sees an aircraft as an orbitable **3D model** -- it loads and
starts rotating automatically. If a browser can't run WebGL or reach the three.js
CDN, two rendered stills of the same model stand in instead. They are asked to
describe it well enough that someone else could build it.

This produces a description of *what exists*. It is directly comparable to the
briefs the project generates itself, which is what makes it usable as a
measurement arm rather than only as colour.

### 2. Brief writing — `D_human_photo`

The same task, but the stimulus is a **photograph of the real aircraft**. This
produces a description of *what to build* — the actual user journey, and the arm
most likely to name the aircraft outright.

Both arms are collected because the stimulus changes what a brief is. Neither
substitutes for the other.

### 3. Discrimination game

Four aircraft, shown as rendered stills, one generated brief, pick the aircraft the brief describes.
Ten rounds. **The score is the metric**: if a human cannot tell which of four
aircraft a brief refers to, the brief is ambiguous, and no downstream system can
do better. Ten rounds of a game answer that for free.

## What it records

One record per submission:

```json
{ "arm": "D_human_model|D_human_photo|discriminate",
  "file": "<model filename>", "brief": "…",
  "participant": "…", "at": "<iso timestamp>",
  "answer": "…|null", "correct": true|false|null }
```

`answer` and `correct` belong to the discrimination game and are `null` for the
brief arms.

The client never sends a model filename — it sends an **opaque stimulus id**, and
the server resolves it. A submission carrying an id the server cannot resolve is
rejected at the boundary. It is the only rejection in the application.

## Design decisions worth stating

**Stimuli are anonymous.** The participant is never shown the aircraft's name, its
source filename, or a URL derived from either. An identity in view biases a
description and, in the discrimination game, simply is the answer.

**Validation hints, it never blocks.** The brief box warns when a description is
very short, very long, or written as code rather than prose. It always submits
anyway. A participant who wrote something and lost it is worse than a
description that needs trimming.

**Naming the aircraft is data, not a mistake.** Nothing in the interface
discourages "make me an F-16". How often people reach for an identity instead of
a description is one of the things this survey is for. Those responses are
tagged after collection, never filtered during it.

**Nothing is discarded.** Responses are tagged, split by arm, and kept. Filtering
happens at analysis time, where it can be undone.

## Participation

Anonymous. A participant id is generated in the browser to group one person's
answers across tasks; no account, no email, no contact details are collected.
Available in Spanish (default) and English.

## Licence

MIT (see `LICENSE`). The collected responses are research data for the NodeVSP
project and are not published from this repository.
