# Voice and product language

Concise, direct and domain-specific. Write the way a capable colleague talks.

## Rules

- **Sentence case** for every label, title, button and menu item.
- **Verbs for actions, nouns for destinations:** "Open thread", "Retry download"
  / "Channels", "Downloads".
- **Name the object and the outcome:** "Delete 3 recordings", not "Are you sure?"
- **Use canonical terms** from [vocabulary.md](../vocabulary.md). Never invent a
  synonym for an existing entity.
- **No promotional language** inside the product: no "supercharge", "seamless",
  "unlock" or "magic".
- **No anthropomorphic filler.** Write "Running tool: image.generate", not "Maya
  is thinking hard…". Describe the real state.
- **No redundant explanation.** If the layout is clear, the copy stays short. Do
  not write copy to make up for weak structure.
- **Numbers and units:** "12 minutes ago", "4.2 GB", "3 of 100".

## States

| State | Pattern | Example |
|---|---|---|
| Empty | What is empty and why, then the next action | "No sources in this channel. Add a source to start collecting items." |
| Error | What failed, the cause if known, what to do | "Couldn't load the timeline: the gateway timed out. Retry" |
| Permission | What is restricted and who can grant it | "You can read this channel but not post. Ask a channel admin for access." |
| Pending | What is happening, in real terms | "Downloading 3 of 12 files" |
| Stale | How old the data is, then refresh | "Updated 2 hours ago · Refresh" |
| Destructive confirmation | Object plus consequence, then the action as the verb | "Delete 'Weekly sync'? Its 48 messages are removed for everyone." / **Delete channel** |
