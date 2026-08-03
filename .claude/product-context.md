# Splexa — Product Knowledge Document

### How we think about this product. Why every decision was made. Who we are building for.

**This document is not a technical spec. It is the product brain.**  
Read this before building anything. Read this when confused about what to build next.  
Read this when someone asks "why does it work this way?"

---

## The One Thing to Always Remember

An Indian advocate's biggest professional fear is missing a hearing date.

Not missing it because they forgot to show up. Missing it because they lost track of it in the noise of managing 20+ cases simultaneously across multiple notebooks, WhatsApp chats, and memory.

When that happens — the court can dismiss the case. The client loses trust. The advocate loses their reputation.

Splexa exists to make sure that never happens. Everything else in this product is secondary to that.

---

## The Person We Are Building For

Picture Rajesh. He has been practicing at the District Court in Hyderabad for 9 years. He handles about 22 active cases. Every morning he wakes up and spends 15–20 minutes piecing together what his day looks like — checking a physical diary, scrolling WhatsApp, calling his clerk.

He is not bad at his job. He is actually very good at his job. The law part. The arguing in court part. The understanding of procedure and precedent.

What exhausts him is the administration around the law. The tracking. The updating clients. The remembering what happened in Case 14 when a client calls about Case 14 three months after the last hearing.

He is not looking for powerful software. He is looking for relief. He wants to open something in the morning and immediately know what his day looks like. He wants to stop carrying all of this in his head.

He will not pay for software he has to learn. He will not use software that feels like it was designed for someone else. He will not trust software that makes him feel like his client data could leak.

But if something genuinely makes his morning easier — he will tell every advocate in his building about it. Court buildings are extremely tight communities. Word travels fast.

---

## What "Easy" Actually Means for a Lawyer

Easy does not mean fewer clicks. Easy means never having to think about what to do next.

When Rajesh opens Splexa in the morning, the answer to "what do I have today" must be visible without scrolling, without searching, without clicking anything. It should be the first thing on the screen.

When a client calls asking about their case, Rajesh should be able to pull up everything about that case within 5 seconds of opening the app. Not by remembering which folder it is in. Just by searching the client's name.

When a hearing is over, adding the outcome and the next date should take under a minute. Not because we put a timer on it but because the form is so simple there is nothing to get confused about.

When a document needs to be found at 10pm before an important hearing the next morning, finding it should feel like opening a drawer, not like searching a filing cabinet.

This is the standard. Every feature decision, every screen layout, every form field — measured against this standard.

---

## How Indian Legal Work Actually Flows

Understanding this is the difference between building something lawyers adopt and something they ignore.

### A Case Does Not Have a Clean Beginning and End

A civil case in India can run for 3 to 10 years. In that time it goes through dozens of hearings, each one potentially getting adjourned to a new date. The advocate needs to maintain context across all of that time.

This means our case detail page is not just a form with fields. It is a living record that grows over time. The timeline of events — hearings, orders, documents, notes — is what makes a case record valuable, not just the metadata at the top.

### Every Hearing Is Likely to Be Adjourned

In Indian courts, adjournment is the norm, not the exception. A hearing gets scheduled, the advocate appears, the judge is busy, the matter gets adjourned to a new date. This happens constantly.

This means the product must make it extremely fast to update a hearing outcome and set a new date. It should be a 20-second action, not a 2-minute process. If it takes too long, advocates will stop doing it and the data becomes stale and useless.

### The Client Relationship Is Personal

Indian clients, especially in district courts, do not behave like corporate clients. They call frequently. They want to know everything. They may not understand the legal process at all. The advocate is their guide, their translator of the legal world.

This means the advocate needs instant access to everything about a client's case when that client calls. Not after navigating three menus. Immediately.

### Documents Are Everywhere and in Every Format

A case file contains petitions, counter-petitions, affidavits, court orders, notices, vakalatnamas, evidence documents, photographs. Some are typed, many are handwritten and scanned, some are photos taken on a phone in a courtroom corridor.

Our document management needs to accept anything. It is not a document management system with categories and workflows — it is a secure folder for everything related to a case. Simple upload, clear label, easy retrieval.

### Advocates Work on Their Phones in Corridors

This is not a product for someone sitting at a desktop in an air-conditioned office. It is for someone standing outside a courtroom waiting for their matter to be called, checking their next hearing on their phone.

The mobile experience is not a "nice to have." It is where the product will actually be used most of the time.

---

## The Six Things We Are Building

### 1. Cases — The Heart of the Product

Everything in Splexa connects to a case. A case is the central object. When we think about any feature, the first question is: how does this relate to a case?

A case in our product mirrors how an advocate mentally organises their work. It has a client. It has a court. It has a history of what happened. It has documents. It has upcoming dates.

The most important thing about the cases list is that it should reflect how an advocate prioritises their attention. Cases with hearings coming up soon should be at the top. Cases that need action should be visually distinct from cases that are just waiting.

The case detail page is where an advocate lives in this product. Every other page leads to a case. The case detail must feel complete — like the advocate's full file on that matter, digitised.

### 2. Hearings — The Product's Most Critical Feature

This is the feature that will determine whether advocates keep using Splexa or abandon it.

Every time a hearing is added, the advocate is making a commitment in the product. They are saying: on this date, I will be in this court for this case. The product's job is to make sure they never forget that commitment.

The hearing calendar is not just a display of dates. It is the advocate's professional schedule made visible. On days with multiple hearings, the advocate should be able to see them all at a glance and understand how their day is structured.

After a hearing happens, the flow of updating the outcome and setting the next date must feel natural. It should feel like turning the page in a diary, not like filling out a government form.

### 3. Clients — The People Behind the Cases

Every case has a real person behind it. That person is worried. That person is calling.

The client record exists so that when someone calls, the advocate has instant context. Who this person is. What cases they have. When the last hearing was. What happened.

The client page is not a CRM. We are not tracking leads or managing relationships in a sales sense. We are maintaining a simple, complete record of who the advocate's clients are and what work is being done for them.

In Phase 1 the client themselves never logs in or sees anything. The client record is purely for the advocate's reference.

### 4. Documents — A Secure Place to Put Things

The core promise of the documents module is simple: upload it here and find it instantly later.

Advocates currently store documents in Google Drive, WhatsApp, email attachments, and physical files. The problem is not that they don't have storage. The problem is that documents are scattered across too many places and cannot be found quickly when needed.

Our document module is not trying to compete with Google Drive on features. It is competing on context. Every document in Splexa is linked to a case and a client. When you search for "Sharma affidavit" you find it. When you open a case you see all its documents in one place.

That context — documents attached to the right case — is what makes this useful. Not features like versioning or collaborative editing.

### 5. Reminders — The Feature That Earns Daily Habit

Reminders are what will make advocates open Splexa every morning.

If the reminder arrives reliably, every time, in a format that is clear and useful, the advocate will start to depend on it. That dependence creates daily habit. Daily habit creates retention. Retention creates a business.

The reminder must be so reliable that an advocate would feel nervous if they did not receive it. That is the standard.

The reminder content must answer one question clearly: what do I need to do today and tomorrow? Nothing more. Not a marketing message. Not a prompt to upgrade. Just the hearing information, clearly stated.

### 6. Dashboard — The Morning View

The dashboard is not a home page in the traditional sense. It is a briefing.

When an advocate opens Splexa in the morning, the dashboard should function like a clerk who has already prepared their daily schedule. "You have three hearings today. Here they are. You have two hearings tomorrow. Here they are. Nothing else needs your attention right now."

The dashboard should be calm. Not full of numbers and charts trying to look impressive. Just the information that is relevant right now, presented clearly.

---

## How We Make the Workflow Easy — The Specific Decisions

### Never Make the Advocate Navigate to Add a Hearing

If an advocate is looking at a case and wants to add a hearing, the button should be right there on the case detail page. Not in a separate hearings menu. Not requiring them to leave the case context. Right there.

### After Adding a Hearing, Go Back to the Case

When an advocate adds a hearing, they are in the middle of working on a case. After saving the hearing, take them back to the case detail page, not to the hearings calendar.

### Make Updating a Hearing Outcome Frictionless

The outcome update should ask only:

- What happened? (Completed / Adjourned / Cancelled)
- Any notes? (optional textarea)
- Next date? (date picker, appears only if adjourned)

Three things maximum. Get in, get out.

### Let Advocates Add Cases Without All the Details

They must be able to create a case with just a title and a client. Everything else is optional. Fill in the details later is a completely valid workflow.

### Search Is More Important Than Filters

The search bar must be prominent, fast, and search across everything — case titles, client names, case numbers, court names. Results appear as the advocate types. Filters are secondary.

### Show the Next Hearing Date Everywhere

Wherever a case appears — cases list, client detail, search results — show the next hearing date. If there is no upcoming hearing, show the last hearing date. Never a blank field.

### The Timeline Is the Case Story

The case timeline is not a log of system events. It is the story of the case told in chronological order — every hearing, every document uploaded, every note — so that when a client calls about a case last active 4 months ago, the advocate reads the timeline in 60 seconds and is fully briefed.

---

## Things That Will Kill This Product If We Get Them Wrong

### Reminder Failures

If an advocate misses a hearing because our reminder did not send, the damage to trust is permanent. Every edge case — hearing added same day, email bounces, hearing date changed after reminder scheduled — must be handled.

### Slow Performance on Mobile

An advocate on 2G in a court corridor with 8 seconds to load cases will close the app and use their notebook. After twice, they stop opening Splexa. Performance on slow connections is a Phase 1 survival concern.

### Data Loss

If entered data disappears, that advocate is lost forever and they will tell people. Every save must be confirmed. Every delete is a soft delete.

### Confusing the First Time User

Empty dashboard must clearly guide to one action: create your first case. Not a tutorial. Not a video. One clear prompt, one button.

---

## What Success Looks Like in Phase 1

50 advocates in Hyderabad opening Splexa every morning as part of their routine — not because reminded to, but because it is where their professional day begins.

If that habit exists, everything else follows. If it does not, no amount of features will fix it.

---

## The Tone of the Product

Calm. Organised. Fast. Reliable. Plain and direct language — not clever, not casual, not corporate.

```
"Case created successfully"  not  "Your case has been successfully created!"
"No hearings today"          not  "You're all clear for today 🎉"
"Hearing reminder"           not  "Don't forget — court tomorrow!"
```

Action-confirmation toasts (create/update/delete) specifically use the `"{Entity} {verb} successfully"` shape — e.g. "Client added successfully", "Case updated successfully", "Document deleted successfully" — not the bare `"Case created"` this doc used to recommend, and not an exclamation mark or "Your ... has been ..." phrasing either. Every success toast in the app follows this exact pattern (see `hooks/use-*.ts`); match it for anything new.

An advocate is a professional. Speak to them like one.

---

## The Compass

Every product decision — new feature, change to a flow, prioritisation question — runs through three questions:

1. Does this reduce the administration burden for an advocate?
2. Does this make their morning easier?
3. Does this make them more confident they won't miss anything?

If yes — build it. If no — don't.
