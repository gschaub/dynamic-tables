# Message Framework Usage

This note documents the current Gutenberg message framework in `src/messages.js`.

The library is built around keyed messages, each of which may contain a notice portion, an announcement portion, or both. A single message key can be used as:

- a store-backed inline notice
- a store-backed snackbar
- a directly rendered local `<Notice />`
- an accessibility announcement via `speak()`
- plain resolved text for existing UI markup

## Imports

These examples assume the importing file is also inside `src/`, like `src/edit.js`.
If you import from another folder, adjust the relative path.

```js
import {
	MESSAGE_TARGETS,
	getMessageText,
	getMessageNoticeProps,
	getMessageRenderProps,
	publishMessage,
	removeMessageNotice,
	showMessageNotice,
	speakMessage,
} from './messages';
```

## Common Call Shape

All helpers follow the same pattern:

```js
helper(messageId, options);
```

The store-backed helpers take the specific notice action creator first:

```js
showMessageNotice(createNotice, messageId, options);
publishMessage(createNotice, messageId, options);
removeMessageNotice(removeNotice, messageId, options);
```

Typical setup in a React component:

```js
const { createNotice, removeNotice } = useDispatch(noticeStore);
```

Typical setup in a data action:

```js
const createNotice = registry.dispatch(noticeStore).createNotice;
```

### Dynamic Values

If a message needs values injected into it, pass them through `args`.

```js
showMessageNotice(createNotice, 'invalid-num-columns', {
	args: { count: numColumns },
	target: MESSAGE_TARGETS.STORE_INLINE,
	context: 'dtbk/editor',
});
```

Examples of values that belong inside `args`:

- counts
- row numbers
- column labels
- cell ids

### Common Options

These are the options you will use most often:

- `args`: values injected into the message text
- `target`: where the message should render
- `context`: notice-store context for create/remove behavior
- `status`: optional severity override such as `success` or `warning`
- `id`: optional notice id override
- `politeness`: optional screen reader priority override

### Store-Oriented Options

These are mainly relevant for notice-store usage:

- `announceMode`: `auto` or `manual` for `publishMessage()`
- `type`: explicit store notice type override
- `explicitDismiss`: snackbar dismiss behavior
- `onDismiss`: callback for store notice dismissal

### Local Render Options

These are mainly relevant when rendering `<Notice />` directly:

- `onRemove`: close handler for a rendered `<Notice />`
- `className`: class applied to the rendered notice
- `regionClassName`: class applied to the wrapper region
- `anchor`: required for `CELL_POPOVER`
- `placement`: popover placement
- `offset`, `flip`, `shift`, `focusOnMount`, `noArrow`, `popoverProps`: popover behavior

## Store Notices

Use store notices for system-level feedback, async failures, and all snackbars.

### Inline Store Notice

```js
showMessageNotice(createNotice, 'post-save-sync-error', {
	target: MESSAGE_TARGETS.STORE_INLINE,
	context: 'dtbk/editor',
});
```

### Inline Store Notice With Args

```js
showMessageNotice(createNotice, 'invalid-num-rows', {
	args: { count: numRows },
	target: MESSAGE_TARGETS.STORE_INLINE,
	context: 'dtbk/editor',
});
```

### Snackbar Notice

```js
showMessageNotice(createNotice, 'cell-pasted', {
	target: MESSAGE_TARGETS.STORE_SNACKBAR,
	context: 'dtbk/editor',
	id: 'dtbk-cell-pasted',
	status: 'success',
});
```

### Publish Store Notice

`publishMessage()` is useful when a message may have both notice and announcement behavior.

```js
publishMessage(createNotice, 'data-type-mismatch', {
	target: MESSAGE_TARGETS.STORE_INLINE,
	context: 'dtbk/editor',
});
```

By default, `publishMessage()` uses `announceMode: 'auto'`, which means:

- store-backed notices are not manually re-spoken
- non-store messages can still be announced when no store notice is created

If you explicitly want a second manual announcement:

```js
publishMessage(createNotice, 'data-type-mismatch', {
	target: MESSAGE_TARGETS.STORE_INLINE,
	context: 'dtbk/editor',
	announceMode: 'manual',
});
```

### Remove Store Notice

If a notice was created in a custom context, remove it with that same context.

```js
removeMessageNotice(removeNotice, 'invalid-num-columns', {
	context: 'dtbk/editor',
});
```

## Local Rendered Notices

Use local rendered notices for block-local, sidebar, modal, and popover feedback. This API framework is available for future use. However, _actual rendering for these local notices has not been implemented at this time_.

### Get Render Props

```js
const { regionProps, noticeProps } = getMessageRenderProps('invalid-num-columns', {
	target: MESSAGE_TARGETS.SIDEBAR,
	args: { count: numColumns },
	onRemove: clearSidebarMessage,
});
```

Render it directly:

```jsx
{
	noticeProps && (
		<div {...regionProps}>
			<Notice {...noticeProps} />
		</div>
	);
}
```

### Popover-Attached Notice

```js
const { noticeProps, popoverProps } = getMessageRenderProps('data-type-mismatch', {
	target: MESSAGE_TARGETS.CELL_POPOVER,
	anchor: activeCellElement,
	onRemove: clearCellMessage,
	placement: 'top',
});
```

Render it:

```jsx
{
	noticeProps && popoverProps && (
		<Popover {...popoverProps}>
			<Notice {...noticeProps} />
		</Popover>
	);
}
```

### Get Notice Props Only

Use `getMessageNoticeProps()` when you already know where the notice will render and only need
the `<Notice />` props.

```js
const noticeProps = getMessageNoticeProps('post-id-sync-error', {
	target: MESSAGE_TARGETS.MODAL,
	onRemove: closeModalNotice,
});
```

### What `getMessageRenderProps()` Returns

```js
{
	target,
	regionProps,
	noticeProps,
	popoverProps,
	descriptor,
}
```

Notes:

- `regionProps` is useful for `BLOCK_TOP`, `BLOCK_BOTTOM`, `SIDEBAR`, and `MODAL`
- `regionProps` is `null` for `CELL_POPOVER`
- `popoverProps` is only populated for `CELL_POPOVER`

## Announcement-Only Usage

Use `speakMessage()` when you want accessibility messaging without rendering a notice.

```js
speakMessage('editing-cell', { args: { cellId: nextId } });
speakMessage('stopped-editing-cell', { args: { cellId: currentId } });
speakMessage('cell-pasted');
```

## Shared Message Text

Use `getMessageText()` when you want the resolved library string without creating a notice or
speaking it.

### Static Text

```js
const editorGridHelpText = getMessageText('editor-grid-help');
```

### Dynamic Text

```js
const invalidRowsMessage = getMessageText('invalid-num-rows', {
	args: { count: numRows },
});
```

## Which Helper To Use

- `showMessageNotice()`: create a store-backed notice
- `publishMessage()`: create a store-backed notice when the target is store-backed and optionally speak the message
- `removeMessageNotice()`: remove a store-backed notice by `id` and `context`
- `getMessageRenderProps()`: prepare props for direct `<Notice />` rendering and optional popover rendering
- `getMessageNoticeProps()`: get only the `<Notice />` props
- `getMessageText()`: resolve the library text for direct UI output
- `speakMessage()`: send an accessibility announcement without rendering a notice

## Target Guidance

- `STORE_INLINE`: global or shared inline editor notices
- `STORE_SNACKBAR`: all snackbar notices
- `BLOCK_TOP`: inline notice above the block
- `BLOCK_BOTTOM`: inline notice below the block
- `SIDEBAR`: settings-related feedback
- `MODAL`: urgent or modal-scoped feedback
- `CELL_POPOVER`: cell-specific feedback anchored to a referenced element

## Notes

- `showMessageNotice()` and `publishMessage()` are the right fit for notice-store paths.
- `showMessageNotice()` and `publishMessage()` expect the generic `createNotice` action creator, not a wrapped object.
- `removeMessageNotice()` expects the `removeNotice` action creator, not a wrapped object.
- `getMessageRenderProps()` and `getMessageNoticeProps()` are the right fit for direct local rendering.
- `publishMessage()` does not render local notices for you.
- The same message key can be rendered differently depending on the calling context.
- Announcement-only messages can still be rendered as notices; if no notice severity exists, they default to `info` unless you override `status`.
- If you create a store notice in a custom `context`, remove it with that same `context`.
- Local render targets are framework-ready, but each new UI placement should still be integration tested when first wired up.
