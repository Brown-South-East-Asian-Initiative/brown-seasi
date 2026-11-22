# Editing the SEASI website

You can change the website's text, images, links and lists right on the page. No code needed.
Your changes are saved as a **draft**, and an admin publishes them after a quick check.

## 1. Get access (once)

1. Make a free GitHub account at [github.com/signup](https://github.com/signup), if you don't have one.
2. Send your GitHub username to a SEASI website admin. They'll add you to the website editors.
3. Check your email or GitHub notifications and **accept the invitation**.

## 2. Log in

1. Go to **[seasi.org/edit](https://seasi.org/edit)**.
2. Click **Log in with GitHub**. The first time, GitHub asks you to approve "SEASI Website Editor". Click **Authorize**.
3. You land on the website in **edit mode**: the normal site with a dark toolbar at the bottom.

Use a computer (not a phone). The login lasts 8 hours, or until you close the tab.

## 3. Make changes

Move your mouse over the page: anything you can edit gets a dashed red outline.

| To change… | Do this |
|---|---|
| **Text** | Double-click it, type, then press **Enter** (or click away). **Esc** cancels. For long text (paragraphs, abstracts), press **Ctrl/⌘ + Enter** to finish. |
| **An image** | Click it and choose a new file. Big photos are shrunk automatically. You may be asked for a short description of the image (for people using screen readers). |
| **A button or link** | Double-click its text to rename it. Hover and click **🔗** to change where it goes (`/symposium`, `https://…`, or `mailto:someone@brown.edu`). |
| **A PDF** (annual report, talk flyer) | Hover the link and click **⬆** to upload a new PDF, or use **Upload PDF** under a talk. Max 20 MB. |
| **A date** | Double-click it and pick from the calendar. |
| **A choice** (event type, schedule type, featured…) | Click it and pick from the list. |
| **Lists** (talks, events, photos, schedule, nav links…) | **+ Add …** adds one, **✕** or the trash icon removes one, and you can **drag** items to reorder them. |

### Make a new page

1. Click **Pages** in the toolbar → **+ New page**, and give it a name (e.g. *Oral History Project*).
2. Choose whether to add it to the site menu. The page lives at `seasi.org/p/oral-history-project`.
3. Click **+ Add block** to build it: **Text**, **Image**, **Gallery**, **Button**, **FAQ**, **Video / audio** (paste a YouTube, Vimeo, Internet Archive, SoundCloud or Google Drive link) or **Quote**.
4. Drag blocks by their **⠿** label to reorder; **✕ Remove** deletes one. **Delete this page** is at the top.

A new page appears on the live site once its draft is published (before that, check it with the preview link).

Moving between pages: click the **→** next to a menu link (normal links don't navigate in edit mode, so you don't lose your work).

Made a mistake? **Undo** (or Ctrl/⌘ + Z) steps back one change at a time. **Discard** throws away everything you haven't saved.

> **Tip:** In About paragraphs, put \*stars\* around words to show them in *italics*.

## 4. Save

1. Click **Save** in the toolbar.
2. Write a short note about what you changed, like *"Add Nov 10 talk"*, and click **Save draft**.
3. After a minute or two the toolbar shows **Open preview ↗**, a private copy of the site with your changes. Check it looks right.
4. Keep editing? Each later **Save** adds to the same draft.

**Your changes are not live yet.** An admin reviews the draft (linked in the toolbar as **Draft #…**) and publishes it. You can let them know in the group chat.

Leaving the page with unsaved changes? Your browser will warn you. Save first.

## Good to know

- **Design is fixed on purpose.** You can change words, pictures, links and lists, but not fonts, colors or layout. That keeps the site consistent and working on phones.
- **New kinds of sections or pages** need a developer.
- **Audio, video and big archives** don't go on the website itself. Upload them to YouTube, the Internet Archive or the Brown Digital Repository and link to them (for example from a Student Works entry).
- **The footer's "Annual Report" link** is separate from the one on the home page. After uploading a new report, copy its address (hover the home page link → 🔗 shows it) into the footer link too.

## If something goes wrong

| Message | What to do |
|---|---|
| "This account can't edit the website yet" | Ask an admin to add you, then accept the invite. |
| "Your login expired" | Click **Log in again** in the toolbar. Your unsaved edits are kept. |
| "Someone else changed … since you started" | Another person edited the same thing. Copy your text somewhere, reload the page, and redo your change. |
| "Preview build failed" | Tell an admin. The live site is not affected. |

---

## For admins

**Add an editor:** GitHub → the `Brown-South-East-Asian-Initiative` organization → **Teams → website-editors → Add a member** (the team needs **Write** access to `brown-seasi`). Remove them there to take access away.

**Publish a draft:** open the pull request (GitHub → `brown-seasi` → **Pull requests**), check the Netlify **deploy preview** link, then click **Merge**. The live site updates in about 2 minutes.

**Undo a published change:** open the merged pull request and click **Revert**, then merge the revert.

**Accounts the site depends on** (keep these owned by the SEASI organization, not one person):
- GitHub organization `Brown-South-East-Asian-Initiative` (the code and content)
- GitHub App "SEASI Website Editor" (the editor login)
- Netlify site (hosting); it holds `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `NUXT_PUBLIC_SITE_URL`
- The `seasi.org` domain
