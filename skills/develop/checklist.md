# UI Accessibility and Token Checklist

Loaded by `/develop` on the UI track, during the accessibility phase. Work through each section. Items marked **required** must pass before the task is reported done. Best effort items are completed where scope allows.

---

## Keyboard navigation (required)

- [ ] Every interactive element is reachable with `Tab`, in logical document order
- [ ] `Enter` activates buttons and links
- [ ] `Space` activates buttons, checkboxes, and radio buttons
- [ ] `Escape` closes modals, drawers, dropdowns, and tooltips
- [ ] Arrow keys navigate within composite widgets: tabs, listboxes, menus, radio groups
- [ ] No keyboard trap, except inside a modal, where a trap is required
- [ ] After an action removes the focused element, focus moves to a logical next target rather than being lost to the document body

## Focus visibility (required)

- [ ] Every focusable element has a visible focus indicator in every state
- [ ] `outline: none` or `outline: 0` never appears without a custom focus style replacing it
- [ ] The focus ring is visually distinct: at least 2px wide, at least 3 to 1 contrast against the colour beside it

## Semantic HTML (required)

- [ ] Headings reflect document hierarchy, and are never chosen for their visual size
- [ ] `<button>` for every action, `<a>` for every navigation. Never a div or span with a click handler
- [ ] Lists use `<ul>`, `<ol>`, and `<li>`, not styled divs
- [ ] Tables use `<table>`, `<thead>`, `<th scope>`, `<td>`, and `<caption>`, not a grid of divs
- [ ] Forms group related fields with `<fieldset>` and `<legend>`
- [ ] `<main>`, `<nav>`, `<header>`, `<footer>`, and `<aside>` mark the landmark regions

## Labels and accessible names (required)

- [ ] Every input, select, and textarea has a label associated by `for` and `id`, or by wrapping
- [ ] Placeholder text is never the only label, since it disappears as soon as someone types
- [ ] Icon only buttons carry an `aria-label` describing the action
- [ ] Images that are not decorative have alt text describing the content, not the filename and not "image of"
- [ ] Decorative images have an empty alt and no `aria-label`
- [ ] For a linked image, the alt text describes the destination, not the picture

## ARIA (only where HTML semantics are not enough)

- [ ] `role` appears only on a genuinely custom widget
- [ ] `aria-expanded` on a toggle trigger: an accordion header, a dropdown trigger, a disclosure button
- [ ] `aria-controls` links a trigger to what it controls, where supported
- [ ] `aria-haspopup` on a trigger that opens a menu or listbox
- [ ] `aria-live="polite"` on a region that updates without user action
- [ ] `aria-atomic="true"` on a live region that should be read as one unit
- [ ] `aria-hidden="true"` on a decorative icon, or anything duplicating visible text
- [ ] `aria-disabled="true"` on a custom element that behaves as disabled but cannot use the disabled attribute
- [ ] `aria-required="true"` on a required field, alongside the visual indicator
- [ ] `aria-invalid="true"` on a field that failed validation, with `aria-describedby` pointing at the error message

## Colour contrast (required)

- [ ] Normal text: a contrast ratio of at least 4.5 to 1 against its background
- [ ] Large text: at least 3 to 1
- [ ] Component boundaries, meaning input borders, button outlines, and focus rings: at least 3 to 1 against what is beside them
- [ ] Placeholder text: technically exempt, but aim for 4.5 to 1 anyway
- [ ] Information is never carried by colour alone. Always pair it with text, an icon, or a pattern

## Modal and dialog (required where applicable)

- [ ] The modal has `role="dialog"` and `aria-modal="true"`
- [ ] `aria-labelledby` points at the modal's visible title
- [ ] `aria-describedby` points at the descriptive content, when there is any
- [ ] Focus moves into the modal when it opens
- [ ] Focus is trapped inside while it is open, cycling with `Tab` and `Shift+Tab`
- [ ] `Escape` closes it
- [ ] Focus returns to the element that opened it

## Token discipline (required)

The specifics come from `code-standards.md`. These are the defaults when it does not say otherwise.

- [ ] No hex colour literals in new files
- [ ] No rgb or hsl functions with raw values
- [ ] No raw pixel values for spacing, padding, margin, or gap. The exceptions are `1px` and `0`
- [ ] No raw pixel values for font size or line height
- [ ] No raw pixel or rem values for border radius or shadow
- [ ] Every value references the design system: a utility class, a custom property, or a token
- [ ] A missing token is written as a `TODO` naming what is needed, never invented inline

## Responsive (best effort)

- [ ] No horizontal scroll at a 375px viewport
- [ ] Touch targets are at least 44 by 44 pixels on mobile
- [ ] Body copy is at least 16px on mobile
- [ ] Images do not overflow their container
- [ ] Table or data heavy content has a mobile strategy: horizontal scroll within its own container, a card layout, or similar

## Loading and error states (required)

- [ ] The loading state is implemented. No blank space while data loads
- [ ] The error state is implemented, and its message is visible and actionable
- [ ] The empty state is implemented, and its message explains why it is empty and what to do
- [ ] The states are visually distinct from each other and from the populated state
