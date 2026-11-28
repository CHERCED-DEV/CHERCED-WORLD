# Feature Specification: Reading room for the blog

**Branch**: `900-reading-room` | **Created**: 2026-11-27 | **Status**: Draft

**Input**: “I want reading the blog to feel like a reading room: whoever arrives finds, saves and follows what interests them, in Spanish and in English”.

> Made-up sample for the Cotejo demo in the AI Lab. The blog, its readers and its author are fictional. This spec carries defects seeded on purpose, and its ground truth lives next to this file.

## Context

The blog has existed for four years. A single author writes it, publishing on software architecture, testing and working with agents.

Today each article is a long page with a title, the text and the comments at the end. Whoever arrives from a link does not know how much is left, cannot save the article and does not hear about new posts unless they return to the home page.

The author wants reading to be the center and everything else to be removable without breaking it. That is why this spec splits each piece into its own story, with its own independent test.

Nothing this spec asks for uses a paid service or a new server. What needs a server, like the newsletter or the comments, uses the one the blog already has.

## User Scenarios & Testing

The blog publishes long technical articles, in Spanish and in English. This spec gathers what happens around the text: reading, following, saving, searching, talking, listening and reading offline.

### User Story 1: Read an article from start to finish (Priority: P1)

A reader arrives at a long article from a shared link. She wants to know how much is left, jump to the section that interests her and copy a code snippet without selecting it by hand.

This story pursues the best reading experience on a phone, which is where most shared links are opened.

**Why this priority**: almost every visit comes in through an article and not through the home page, so reading is the heart of the blog.

**Independent Test**: a 3,000-word article is opened on a mid-range phone and read all the way through with the keyboard and with a finger.

**Acceptance Scenarios**:

1. **Given** an open article, **When** the reader scrolls down the page, **Then** a progress bar shows how much of the text she has read.
2. **Given** an article with five sections, **When** the reader opens the table of contents, **Then** she sees the five headings and each one takes her to its section.
3. **Given** a code block, **When** the reader presses “Copy”, **Then** the code lands on the clipboard and a notice confirms it.
4. **Given** that the reader reached the end of the article, **When** she presses “Back to top”, **Then** the page goes up to the title without reloading.
5. **Given** an article with an English version, **When** the reader switches language, **Then** she lands on the same section in the other version.

### User Story 2: Follow the blog without looking for it again (Priority: P1)

A reader wants to hear about each new post without visiting the home page every day. He can use his feed reader, get an email or accept a browser notification.

Today the blog only has the feed. The email newsletter and the browser notifications are new, and both ask for permission before sending anything.

**Why this priority**: whoever subscribes comes back; without a subscription, each visit depends on someone sharing the link.

**Independent Test**: a test post is published and it is checked that it arrives through the three channels to a test account.

**Acceptance Scenarios**:

1. **Given** a feed reader with the address of the Spanish feed, **When** a post is published, **Then** the post shows up with its title, its summary and its link.
2. **Given** that a reader types his email into the newsletter form, **When** he sends it, **Then** he receives a message with a confirmation link.
3. **Given** an expired confirmation link, **When** the reader opens it, **Then** the page explains how to request a new one.
4. **Given** that the reader accepted browser notifications, **When** a post is published, **Then** he receives a notification with the title of the post.
5. **Given** a newsletter email, **When** the reader presses “Unsubscribe me”, **Then** he stops receiving it without typing his password.

### User Story 3: Save an article for later (Priority: P2)

A reader finds an article at work and wants to read it at night, on another device. She saves it to her reading list with one tap.

When she finishes it, she marks it as read and the list cleans itself up. If she moves to another blog, she takes her links with her in a file.

**Why this priority**: today that reader emails the link to herself, and half the time she loses it in her inbox.

**Independent Test**: three articles are saved in one browser and the list is checked in another, with the same account.

**Acceptance Scenarios**:

1. **Given** an open article, **When** the reader presses “Save”, **Then** the article appears first in her reading list.
2. **Given** an article already saved, **When** the reader marks it as read, **Then** it leaves the list and stays in her history.
3. **Given** a full reading list, **When** the reader tries to save another article, **Then** the screen asks her to delete one first.
4. **Given** a reading list with articles, **When** the reader exports it, **Then** she downloads an OPML file with the links.
5. **Given** a saved article that the author unpublished, **When** the reader opens her list, **Then** that article appears crossed out with the date it was removed.
6. **Given** a reader without an account, **When** she saves an article, **Then** the screen warns her that the list lives only in that browser.

### User Story 4: Find what was already published (Priority: P2)

A reader remembers an article about message queues, but not its title. He types two words into the search box and filters by the tag “architecture”.

At the end of each article, the blog suggests three others on the same topic, so he keeps reading without searching again.

**Why this priority**: the blog has more than 200 posts and the home page only shows the latest ten.

**Independent Test**: 20 known articles are searched by a word from their body and the position where each one appears is written down.

**Acceptance Scenarios**:

1. **Given** the open search box, **When** the reader types “message queues”, **Then** the article about queues appears among the top three results.
2. **Given** the page of a tag, **When** the reader opens it, **Then** he sees only the posts with that tag, from newest to oldest.
3. **Given** a search with no results, **When** it finishes, **Then** the screen suggests three tags that have posts.
4. **Given** the end of an article, **When** the reader reaches it, **Then** he sees three related articles with their title and their date.

### User Story 5: Talk to the author (Priority: P3)

A reader wants to thank the author for an article or correct a detail. She reacts with an emoji without creating an account, or leaves a comment that the author reviews from the back office before publishing it.

The author answers comments from the same panel, and her answer stays below the original comment.

**Why this priority**: comments bring useful corrections, but without moderation they fill up with advertising.

**Independent Test**: a test comment is left and its path through moderation is followed until it is published.

**Acceptance Scenarios**:

1. **Given** an article, **When** the reader presses a reaction, **Then** the counter goes up by one and the reaction stays marked in her browser.
2. **Given** a new comment, **When** the reader sends it, **Then** the screen tells her that the author will review it before publishing it.
3. **Given** a pending comment, **When** the author approves it from the backoffice, **Then** it appears below the article with its date.
4. **Given** a comment with a link, **When** it arrives in the middle of the night, **Then** it stays on hold [NEEDS CLARIFICATION: who moderates it if the author is away?].
5. **Given** a published comment, **When** the author answers it, **Then** her answer appears below with the “Author” mark.
6. **Given** a rejected comment, **When** the reader comes back to the article, **Then** she does not see it published and receives an email that explains why.

### User Story 6: Read offline (Priority: P3)

A reader travels by bus and loses signal halfway through an article. He wants to finish reading it without network, and wants the blog to install as a PWA on his phone.

**Why this priority**: it comes after the rest, because most people read with a connection.

**Independent Test**: an article is opened, the device network is cut and reading continues until the end.

**Acceptance Scenarios**:

1. **Given** an article opened with network, **When** the connection drops, **Then** the text and its images stay on screen.
2. **Given** an article from the reading list, **When** the reader opens the PWA without network, **Then** the article loads from the copy on the device.
3. **Given** that the reader installed the PWA, **When** a post is published, **Then** the copy on the device updates if possible.
4. **Given** an article that was never opened with network, **When** the reader looks for it offline, **Then** the screen tells him that copy does not exist.
5. **Given** that the connection comes back, **When** the reader stays on the article, **Then** new comments load without reloading the page.

### User Story 7: Listen to an article (Priority: P3)

A reader wants to listen to an article while he walks, with the screen off. He presses “Listen” and the voice reads the text without the code blocks.

**Why this priority**: it opens the blog to whoever cannot read at that moment, although it is not the main way to consume it.

**Independent Test**: an article with two code blocks is listened to and it is checked that the voice skips them and says so.

**Acceptance Scenarios**:

1. **Given** an open article, **When** the reader presses “Listen”, **Then** the voice starts with the title and goes on through the paragraphs in order.
2. **Given** an article being played, **When** the reader presses “Pause”, **Then** the voice stops and resumes from the same sentence.
3. **Given** a code block, **When** the voice reaches it, **Then** it announces that there is code and jumps to the next paragraph.
4. **Given** an article being played, **When** the reader changes page, **Then** the voice stops and the button says “Listen” again.
5. **Given** an article in English, **When** the reader presses “Listen”, **Then** the voice uses the language of the article and not that of the browser.

### User Story 8: Follow a series of articles (Priority: P2)

The author writes series of four or five parts. A reader who lands on the third part wants to see where she is and move on to the next one without looking for it.

**Why this priority**: series are the most read content on the blog, and today each part is found on its own.

**Independent Test**: the middle part of a series is opened and the reader navigates to the previous and the next part.

**Acceptance Scenarios**:

1. **Given** an article from a series, **When** the reader opens it, **Then** she sees the name of the series and which part she is on.
2. **Given** the last part of a series, **When** the reader reaches the end, **Then** she sees a link to the first part instead of “Next”.
3. **Given** a series with a new part, **When** the author publishes it, **Then** the earlier parts link to it without anyone editing them.
4. **Given** the index of a series, **When** the reader opens it, **Then** she sees all the parts with their title and the ones she already read in that browser are marked.

### User Story 9: Read in the other language (Priority: P2)

An English-speaking reader lands on an article in Spanish from a search engine. She wants the English version and, if it does not exist, to know it before she starts reading.

The blog marks on each article which languages it has, and switching language takes her to the same section of the other text.

**Why this priority**: half the visits come from outside the country, and today those readers do not know the other version exists.

**Independent Test**: an article with both versions and another with only one are opened, and the language is switched on both.

**Acceptance Scenarios**:

1. **Given** an article with two versions, **When** the reader opens the language selector, **Then** she sees both options with the current one marked.
2. **Given** an article with a single version, **When** the reader switches language, **Then** she lands on the home page of the other language with a notice that explains it.
3. **Given** an external search engine, **When** it indexes an article, **Then** it finds the link to its version in the other language.

### User Story 10: Share an article (Priority: P3)

A reader wants to send an article to his team. He copies the link to a section and, when he pastes it in a chat, a card appears with the title and the image of the article.

**Why this priority**: each shared link brings new visits, but the blog can already be shared by copying the address.

**Independent Test**: the link to a section is copied, pasted into a test chat and the card that appears is checked.

**Acceptance Scenarios**:

1. **Given** a section heading, **When** the reader presses its anchor, **Then** the page address changes to the one for that section.
2. **Given** the link to an article, **When** it is pasted in a chat, **Then** the image of the article appears with its title.
3. **Given** an article without its own image, **When** it is shared, **Then** the card uses the general image of the blog.

### User Story 11: Publish without breaking reading (Priority: P3)

The author publishes a new post from the back office. She wants the feed, the sitemap, the series and the notifications to catch up on their own, without touching each piece.

**Why this priority**: today publishing is one step, and the reading room must not turn it into five.

**Independent Test**: a post from a series is published and the feed, the sitemap, the index of the series and the test notification are checked.

**Acceptance Scenarios**:

1. **Given** a post that is ready, **When** the author presses “Publish”, **Then** the post appears in the feed, in the sitemap and in its series.
2. **Given** a published post with a mistake, **When** the author corrects it, **Then** the feed shows the corrected version without duplicating it.
3. **Given** a post that the author unpublishes, **When** the next publication runs, **Then** the post leaves the feed and the search.

### User Story 12: Read with a screen reader (Priority: P2)

A blind reader goes through the blog with his screen reader and the keyboard. He wants to jump between sections, know how far along he is and hear the copied or saved notices without losing his place.

Each new piece of the reading room is tested this way before it is published, and not only with the mouse.

**Why this priority**: the reading room adds controls to each article, and each new control can leave out whoever does not see the screen.

**Independent Test**: a whole article is read with a screen reader, without a mouse, and all its controls are used.

**Acceptance Scenarios**:

1. **Given** the table of contents, **When** the reader goes through it with the keyboard, **Then** he hears the title of each section and which one is current.
2. **Given** a code block, **When** the reader activates “Copy” with the keyboard, **Then** he hears “Copied” and the focus stays on the button.
3. **Given** a reaction, **When** the reader reaches it, **Then** he hears its name in text and how many people left it.
4. **Given** the progress bar, **When** it receives focus, **Then** the reader hears the percentage he has read.

### Edge Cases

- An article without sections does not show the table of contents, and the progress bar keeps working.
- A half-translated article shows a notice in the missing language, with a link to the complete version.
- An email that is already subscribed receives a reminder instead of a second confirmation link.
- A repeated reaction from the same browser does not count twice.
- If the feed has more than 50 posts, it only publishes the latest 50.
- A comment longer than 2,000 characters is rejected with a message that states the limit.
- Search with or without accents gives the same results: “migración” and “migracion” are the same word.
- Without JavaScript, the article reads in full; the reading list and the reactions say that they need JavaScript.
- A series with an unpublished part shows that part as “Coming soon”, without a link.
- An article without related articles does not show the suggestions block.
- If the browser voice is not available, the “Listen” button does not appear.
- A section heading repeated in the same article gets an anchor with a number at the end, so each link lands in its place.
- A reader who unsubscribes from the newsletter and subscribes again goes through double confirmation once more.
- A deleted article leaves the feed, the sitemap and the reading lists on the next publication.
- A shared link to a section that no longer exists takes the reader to the start of the article, with a discreet notice on top.
- A browser notification that arrives while the phone is locked shows only the title, without the summary.

## Requirements

### Functional Requirements

#### Reading

- **FR-001**: Each article MUST show a reading progress bar that advances with scrolling.
- **FR-002**: Each article with three or more sections MUST show a table of contents with a link to each section.
- **FR-003**: Each code block MUST have a button to copy its content to the clipboard.
- **FR-004**: Each article MUST show the estimated reading time before the first paragraph.
- **FR-005**: A button to go back to the top MUST appear at the end of each article.
- **FR-006**: The reader MUST be able to switch between light theme and dark theme from any page.
- **FR-007**: The article text MUST have adequate contrast over any background.
- **FR-008**: The reader MUST be able to change the font size of the article without losing their position.
- **FR-009**: An article page MUST render in full in 2 s or less on a mid-range phone.
- **FR-010**: Each article MUST offer the language switch to its version in English, when it exists.

#### Subscription

- **FR-011**: The blog MUST publish an RSS feed per language with its latest posts.
- **FR-012**: The feed MUST update quickly after a post is published.
- **FR-013**: The newsletter form MUST ask only for the email and the preferred language.
- **FR-014**: The newsletter subscription MUST use double confirmation: an email with a link that the reader opens to activate it.
- **FR-015**: The subscription confirmation link MUST expire after 24 hours.
- **FR-016**: The newsletter MUST go out by email and/or as a browser notification, depending on what the reader chooses.
- **FR-017**: Each newsletter email MUST carry a link to unsubscribe with a single click.
- **FR-014**: The reader MUST be able to unsubscribe from browser notifications on the same page where they turned them on.
- **FR-018**: The subscription confirmation link MUST expire after 48 hours.

#### Reading list

- **FR-019**: The reader MUST be able to save an article to their personal reading list with a single tap.
- **FR-020**: A reader MUST be able to save up to 50 articles in their reading list.
- **FR-021**: The reading list MUST be intuitive and show first what was saved last.
- **FR-022**: The reading list MUST sync across the devices of the same reader.
- **FR-023**: The reader MUST be able to export their reading list in several formats.
- **FR-024**: The reading history MUST live only in the reader's browser.
- **FR-025**: A reader MUST be able to save up to 100 articles in their reading list.

#### Search and tags

- **FR-026**: The search MUST find a word even when the reader types it without accents.
- **FR-027**: The blog search MUST include the draft posts.
- **FR-028**: The reader MUST be able to filter the posts by tag from each article.
- **FR-029**: The search timeout per query MUST be 800.
- **FR-030**: The search MUST show results as soon as the reader stops typing, without pressing a button.
- **FR-031**: The blog search MUST NOT include the draft posts.
- **FR-032**: The search MUST find a word even when the reader types it without accents.

#### Conversation

- **FR-033**: The reader MUST be able to react to a post without creating an account.
- **FR-034**: Each comment MUST go through the author's moderation before it is published.
- **FR-035**: The comment form MUST be easy to use on a phone.
- **FR-036**: The limit of comments per reader per hour is TBD.
- **FR-037**: The author MUST be able to answer a comment from the back office, under the rule of FR-099.

#### Series, audio and discovery

- **FR-038**: Each article in a series MUST show the name of the series with links to the previous and the next part.
- **FR-039**: The reader MUST be able to listen to the article read aloud, with a button to pause and resume.
- **FR-040**: Three articles related by their tags MUST appear at the end of each article.
- **FR-041**: The blog MUST publish a sitemap with each article and its version in the other language.
- **FR-042**: Each article MUST have a social media image with its title and its date.

#### Offline

- **FR-043**: The blog MUST be installable as a PWA on a phone.
- **FR-044**: An open article MUST stay readable if the connection drops.
- **FR-045**: A reader MUST receive a browser notification when a post is published, if they accepted it before.

#### Languages and sharing

- **FR-046**: Each article MUST say in which languages it is available, next to its publication date.
- **FR-047**: An article without a translation MUST say so in the other language, with a link to the version that exists.
- **FR-048**: Each section heading MUST have an anchor that the reader can copy.
- **FR-049**: The link to an article pasted in a chat MUST show a card with its title and its image.

#### Privacy

- **FR-050**: The newsletter MUST delete the email of whoever unsubscribes within 30 days or less.
- **FR-051**: Reactions MUST be stored without the email or the name of whoever reacts.
- **FR-052**: The comment form MUST explain what gets published and what stays private before it is sent.

#### Accessibility

- **FR-053**: The table of contents MUST announce to the screen reader the section the reader is in.
- **FR-054**: The “Copied” and “Saved” notices MUST be read by the screen reader without moving the focus.
- **FR-055**: Each reaction MUST have a text name besides its emoji.

#### Added in review

- **FR-56**: From every page, whoever reads MUST be able to toggle dark mode and light mode.
- **FR-057**: The server MUST keep for 90 days the pages that each reader opened.
- **FR-058**: Before the text starts, the post MUST state how many minutes it takes to read it.
- **FR-059**: The reader MUST be able to save an article to their personal reading list with a single tap or click.

### Non-Functional Requirements

- **NFR-001**: An article page MUST render in full in 2500 milliseconds or less on a mid-range phone.
- **NFR-002**: The whole reading room MUST be usable with the keyboard alone, with the focus always visible.
- **NFR-003**: With “reduce motion” on, the progress bar and the notices MUST appear without animation.
- **NFR-004**: The newsletter MUST store only the email, the language and the confirmation date of each reader.
- **NFR-005**: Browser notifications MUST work on desktop and phone browsers, etc.
- **NFR-006**: Each article page MUST load 300 kB or less of JavaScript when it opens.

### Key Entities

- **Reader**: whoever visits the blog, with an account or without one.
- **Article**: a published post, with its language, its tags and its date.
- **Series**: an ordered group of articles that the author publishes in parts.
- **Subscription**: a reader's email, their language and the state of their double confirmation.
- **Reading list**: the articles a reader saved, in the order they saved them.
- **Comment**: a reader's text about an article, with its moderation state.
- **Reaction**: an emoji that a reader leaves on an article, once per browser.
- **Newsletter**: the email that goes out with each new post to those who confirmed it.
- **Browser notification**: the alert a reader who accepted it receives, with the title of the post.

## Success Criteria

### Measurable Outcomes

- **SC-001**: On a mid-range phone, the progress bar follows scrolling at 60 frames per second, with no visible jumps.
- **SC-002**: 90 % of newsletter subscriptions get confirmed within the first day.
- **SC-003**: Three out of four readers who save an article open it again within the next seven days.
- **SC-004**: In the test of the 20 known articles, 18 appear among the top three results.
- **SC-005**: The author settles each comment in 24 hours or less from its arrival.
- **SC-006**: No comment with advertising stays published for more than one hour.
- **SC-007**: An article page meets NFR-009 in the three templates of the blog.
- **SC-008**: With the network cut, 100 % of the articles in the reading list open in full.
- **SC-009**: The automated accessibility score of each template is 95 or more, with no critical errors.
- **SC-010**: Half of those who finish the first part of a series open the second.
- **SC-011**: Eight out of ten readers who press “Listen” hear at least one minute.
- **SC-012**: Four out of five readers who land on an article without a translation use the link to the version that exists.
- **SC-013**: The card of a shared link shows the full title in the three test chats.
- **SC-014**: Thirty days after an unsubscribe, the newsletter database no longer has that email.

### How each criterion is tracked

| How it is measured | Criterion | How often |
|---|---|---|
| Performance recording on the test phone while scrolling down an article | SC-001 | On each delivery |
| Confirmed subscriptions over requested subscriptions | SC-002 | Every week |
| Saved articles that get opened again | SC-003 | Every month |
| The test of the 20 known articles | SC-004 | On each delivery |
| Arrival time and decision time of each comment | SC-005 | Every week |
| Review of the published comments with links | SC-006 | Every day |
| The airplane mode reading test | SC-008 | On each delivery |
| The automated audit of the three templates | SC-009 | On each delivery |
| Reads of the second part over complete reads of the first | SC-010 | Every month |
| Clicks on the link to the version that exists | SC-012 | Every month |

## Assumptions

- The author publishes one or two posts per week, in Spanish and in English.
- The newsletter email goes out through a sending provider the blog already uses; this spec does not pick one.
- Reactions are counted per browser and not per person: a reader with two browsers can react twice.
- The reading list MUST NOT sync across the devices of the same reader.
- Offline reading uses the copy that the browser kept of each opened article.
- The voice that reads the articles is the browser's, so its accent changes from one device to another.
- The images in the articles already have alternative text; this spec does not rewrite it.
- The back office already identifies the author with her account, and this spec does not change how she signs in.

## Dependencies

## Out of Scope

- Payments, paid subscriptions or content exclusive to subscribers.
- A new article editor: the author keeps writing as she does today.
- Nested comments of more than one level.
- Machine translation of the articles: the author writes each version.

## Open Questions

| ID | Question | Default |
|---|---|---|
| Q-01 | Does the newsletter go out each week or with each post? | With each post |
| Q-02 | Do comments require an account? | No: they ask for a name and an email that is not published |
| Q-03 | Do related articles come from the tags or from the text? | From the tags |
| Q-04 | Does the offline copy include the comments? | No: only the text and the images |
| Q-05 | Is the browser notification requested on the first visit? | No: after saving or finishing an article |

## Glossary

- **Back office**: the private panel where the author publishes and moderates.
- **Progress bar**: the strip that advances while an article is read (`ReadingProgress`).
- **Table of contents**: the list of sections of an article, with a link to each one (`Toc`, `TocSheet`).
- **Estimated reading time**: the minutes it takes to read an article, calculated from its words (`readingTime`).
- **Double confirmation**: newsletter sign-up that only becomes active when the reader opens the link they receive by email.
- **Guided reading**: a route of five articles that the author puts together for newcomers.
- **Tag**: a word that groups articles on the same topic (`tag`).
- **Related articles**: the three articles suggested at the end of another one, by their tags (`RelatedPosts`).
- **Series**: see “Key Entities”; in the code, its navigation is `SeriesNav`.

## Acronyms

- **RSS**: subscription format that feed readers read.
- **SMTP**: protocol through which the newsletter email goes out.

## Design Notes

The reading room does not change how an article is written: it changes what happens around the text. Each new piece has to be able to turn off without breaking reading, because the text comes first.

The edges of each piece are in [Edge Cases](#reading-room-edges), and each story carries its independent test.

### Reading

The progress bar measures the text of the article and not the whole page: the comments and the footer do not count. That way, reaching the last paragraph is reaching one hundred percent.

The table of contents is built from the second and third level headings. On the phone it opens from a fixed button at the bottom, and on wide screens it stays to the right of the text.

The copy button lives in the corner of the code block and says “Copied” for two seconds, with a notice for the screen reader.

The theme switch respects what the operating system asked for the first time, and from then on it remembers the reader's choice in their browser.

### Subscription

The newsletter and the browser notifications share a rule: nothing goes out unless the reader asked for it, and unsubscribing takes one click.

The feed carries the summary of each post and not the full text, so whoever reads it comes into the blog and sees the comments.

### Reading list

The reading list lives in the reader's account. Whoever has no account uses it in their browser and loses it if they clear the site data.

Exporting the list produces a file with the title, the link and the date each article was saved, in the order of the list.

### Search

The search runs in the browser over an index generated at publish time. The query stays on the device of whoever searches.

Related articles are chosen by the tags they share; on a tie, the newest one wins.

The page of a tag lists its posts from newest to oldest, with twenty per page and a link to the next one.

### Conversation

Normally, the author reviews the comments once a day, in the morning.

A rejected comment is not deleted on the spot: it stays 30 days in the back office in case the author changes her mind, and then it is removed.

Reactions are six fixed emojis. A reader can leave one of each per article, and remove it with a second tap.

### Performance

The progress bar and the table of contents are computed once on load and update with scrolling, without measuring the text again.

The images of each article load when they are about to come on screen, and each one carries its width and its height so the text does not jump.

### Accessibility

Each new control has a name for the screen reader and is reached with the Tab key, in the same order in which it is seen.

The progress bar does not depend on color: it also says the percentage read when it receives focus.

### Series and audio

Each part of a series knows which one comes before it and which one follows, and the series block appears above and below the article.

The read-aloud mode uses the browser voice, without downloading anything, and highlights the paragraph being read.

Code blocks are not read aloud: the voice says “here is a code block” and moves on to the next paragraph.

### Offline

The offline copy keeps the text and the images of each opened article, and it is deleted when the article goes a month without being opened.

The PWA asks for no permissions when it is installed: browser notifications are requested separately, after the reader saves or finishes an article.

### Languages

Each article carries in its metadata the link to its version in the other language, so search engines relate the two.

The missing translation notice is written in the language of whoever is going to read it and not in that of the article.

### Privacy

The newsletter keeps the minimum it needs to work. Unsubscribing deletes the email; it does not mark it as inactive.

Reactions are counted on the server with one number per article and per emoji, with no data about whoever reacts.

### Publishing

Publishing a post generates the feed, the sitemap, the search index and the index of its series in one go. If a step fails, the post does not go out and the back office says which one it was.

Correcting a published post keeps its address and its publication date, and adds an update date that the feed also shows.

### Measurement

The success criteria are reviewed every week in a table in the back office, with the figure for the week and the one before.

The manual tests are repeated on each delivery with the same devices, so the figures can be compared.

A figure that gets worse two weeks in a row opens a task for the next delivery, with the criterion that measures it.

## Decisions

| Decision | Why | What is given up |
|---|---|---|
| The search runs in the browser | The query does not leave the device and there is no search server to maintain | The index weighs more as the posts grow |
| The newsletter uses double confirmation | Nobody gets emails they did not ask for, and the list stays clean | A share of the readers never confirm |
| The voice is the browser's | It downloads nothing and works without network | The accent changes from one device to another |
| Comments are moderated before they are published | Advertising never gets seen | A legitimate comment waits until the review |
| The reading list lives in the account | The reader finds it on any device with their account | Whoever has no account loses it when clearing the site data |

## Manual tests

| Test | Device | What is checked |
|---|---|---|
| Read a whole article | Mid-range phone | The progress bar, the table of contents and the back to top button |
| Subscribe and unsubscribe | Desktop | The confirmation email, its expiration and the unsubscribe link |
| Save and export | Two browsers | The reading list and the exported file |
| Search without accents | Phone | The top three results of ten known searches |
| Moderate a comment | Back office | The move from pending to published and the author's answer |
| Read without network | Phone in airplane mode | The text, the images and the missing copy notice |

## Delivery plan

| Delivery | What it includes | Duration |
|---|---|---|
| 1 | Progress bar, table of contents, copy button and back to top | 2 weeks |
| 2 | Feed per language and newsletter with double confirmation | 3 weeks |
| 3 | Reading list and its export | 10 business days |
| 4 | Search, tags, related articles and reactions | 4 weeks |
| 5 | Comments with moderation and the author's answers | 1 week |
| 6 | Series, read-aloud mode and offline reading | 5 weeks |

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Browser notifications feel invasive | Medium | They are requested only after the reader saves or finishes an article |
| The newsletter lands in the spam folder | High | Double confirmation and a sender of the blog's own domain |
| The reading list grows without control | Low | A cap per reader and a notice before it fills up |
| Comments fill up with advertising | High | Prior moderation and a limit per hour |
| The browser voice reads English terms poorly | Low | The “Listen” button warns that the voice is the device's |

## Change log

| Date | Change |
|---|---|
| 2026-11-20 | First version, with stories 1 to 6 |
| 2026-11-24 | Stories 7 and 8 are added, with their series and audio requirements |
| 2026-11-27 | Languages, sharing, privacy and accessibility are added, and the review appends four requirements at the end |
