A number of things I do not like:

- we should have a expand/minize container that collapse section. It must have a "title/name" and it can be collapsed to save some space on the page. Typically the table of content should be collapsable - always
- the quote is not good, the background should be greyed. Currently the quote is only using a chevron and 2 separators bottom and up
- the collapse/expand and the code block should have slightly rounded corners
- the codeblock should have a copy button on the top right
- the inline should also have some rounded corner
- we are missing components:
  - Alert Dialog (with status: info, warning, success, danger, note)
  - Badge

Generally I think the interline is quite large

Can you think of other components we might need for the blog ?

---

Fix the following nits:

- The blockcode is weird, it has a grey backround (ok), rounded edges (ok) but 2 bands on top and bottom, looks like padding between code block and border. remove it.
- The blockcode is still missing a "copy to clipboard" button on top right it seems.
- table of content collapse is weird: the chevron is too close to the title/name and there is not hierarchy/tabs in the table of content anymore.
- quote left highlitgh should also be rounded
- tabs codeblock formmatting seems not working I see the backticks not the codeblock

---

other nits to fix:

- for the alerts/dialogs also add the border radius on the left
- remove this completly: " Collapsible code block
  The {{< code >}} shortcode wraps code in a <details> element:
  TypeScript example" because we have collapse/expand (much better)
- tables should let you grey the header row and possibly the first column
- the 2 margins (top/bottom) in codeblocks are still there, not removed

---

I need some option to change the theme colors of the website, also the language and theme should be saved in the local storage when the user comes back.

For the theme colors there are some explanations there: https://github.com/panr/hugo-theme-terminal

---

I will need the additional pages:

- bookmark: bookmarning video, blog posts, articles etc...
- reading list / with a completion / state / opinion
- a thoughts page

---

Support comment section
