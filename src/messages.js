/* External dependencies */
import { speak } from '@wordpress/a11y';
import { __, sprintf } from '@wordpress/i18n';

/**
 * @callback CreateNoticeHandler
 * @param {string} status    Notice status such as 'success', 'info', 'warning', or 'error'.
 * @param {string} content   Notice message text.
 * @param {Object} [options] Optional notice configuration.
 * @return {*}
 */

/**
 * @callback RemoveNoticeHandler
 * @param {string} noticeId  Notice identifier.
 * @param {string} [context] Notice context.
 * @return {*}
 */

/**
 * Identify the render method and  location
 *
 * @since 1.3.1
 */
export const MESSAGE_TARGETS = Object.freeze({
	STORE_INLINE: 'store-inline',
	STORE_SNACKBAR: 'store-snackbar',
	BLOCK_TOP: 'block-top',
	BLOCK_BOTTOM: 'block-bottom',
	SIDEBAR: 'sidebar',
	MODAL: 'modal',
	CELL_POPOVER: 'cell-popover',
});

/**
 * Message targets to be implemented via the notice store.
 *
 * @since 1.3.1
 */
const STORE_TARGETS = new Set([MESSAGE_TARGETS.STORE_INLINE, MESSAGE_TARGETS.STORE_SNACKBAR]);

/**
 * Message targets to be implemented via local rendering.
 *
 * @since 1.3.1
 */
const LOCAL_TARGETS = new Set([
	MESSAGE_TARGETS.BLOCK_TOP,
	MESSAGE_TARGETS.BLOCK_BOTTOM,
	MESSAGE_TARGETS.SIDEBAR,
	MESSAGE_TARGETS.MODAL,
	MESSAGE_TARGETS.CELL_POPOVER,
]);

/**
 * Create and return the message definition from the message library.
 *
 * @since 1.3.1
 *
 * @param {Object}  param0                     Message definition parts.
 * @param {?Object} [param0.notice=null]       Notice configuration for the message.
 * @param {?Object} [param0.announcement=null] Announcement configuration for the message.
 * @return {Object} 	                       Message definition.
 */
function buildMessage({ notice = null, announcement = null }) {
	return {
		notice,
		announcement,
	};
}

/**
 * Create the notice portion of the message from the message library.
 *
 * @since 1.3.1
 *
 * @param {Object}          param0                 Notice configuration.
 * @param {string}          [param0.id]            Unique notice identifier.
 * @param {string}          [param0.status]        Notice status such as 'success', 'info', 'warning', or 'error'.
 * @param {string|Function} [param0.content]       Notice text or callback that returns the text.
 * @param {Array}           [param0.actions]       Optional notice actions.
 * @param {*}               [param0.icon]          Optional notice icon.
 * @param {boolean}         [param0.isDismissible] Whether the notice can be dismissed.
 * @param {string}          [param0.politeness]    Optional screen reader politeness setting.
 * @param {string|Function} [param0.spokenMessage] Optional spoken message override.
 * @return {Object} 	                           Notice definition.
 */
function buildNotice({
	id = '',
	status = 'info',
	content,
	actions = [],
	icon = null,
	isDismissible = true,
	politeness,
	spokenMessage,
} = {}) {
	return {
		id,
		status,
		content,
		actions,
		icon,
		isDismissible,
		politeness,
		spokenMessage,
	};
}

/**
 * Create an error message definition for library message that are defined as errors.
 *
 * @since 1.3.1
 *
 * @param {string}          id      Notice identifier.
 * @param {string|Function} content Notice text or callback that returns the text.
 * @param {Object}          notice  Optional notice into which the returned notice can be merged.
 * @return {Object} 	            Error message definition.
 */
function buildErrorMessage(id, content, notice = {}) {
	return buildMessage({
		notice: buildNotice({
			id,
			status: 'error',
			content,
			politeness: 'assertive',
			...notice,
		}),
	});
}

/**
 * Create the announcement portion of the message from the message library.
 *
 * @since 1.3.1
 *
 * @param {string|Function} content    Announcement text or callback that returns the text.
 * @param {string}          politeness Optional screen reader politeness setting.
 * @return {Object} 	               Announcement definition.
 */
function buildAnnouncement(content, politeness) {
	return {
		content,
		politeness,
	};
}

/**
 * Library of pre-defined message definitions that can be formatted for rendering in various ways and
 * locations. They can include a notice, an announcement, or both. Notices are used for visual display
 * and can optionally be announced to screen readers. Announcements are only used for screen readers
 * and will not have a visual display.
 *
 * Each message definition contains:
 * 	- A unique message identifier used to retrieve the message from the library.
 *  - Content which includes text and context. This content may be general or specitically identified
 *    as a notice or announcement.
 *
 * @since 1.3.1
 */

const MESSAGE_LIBRARY = {
	'update-entity-error': buildErrorMessage('dtbk-update-entity-error', () =>
		__('Dynamic Tables could not queue the latest table changes for save.', 'dynamic-table-blocks')
	),

	'invalid-num-columns': buildErrorMessage('invalidNumColumns', ({ count }) => {
		return sprintf(
			// translators: %s: Column count entered by the user.
			__(
				'Cannot have %s columns. You must have at least 1 and no more than 50 columns.',
				'dynamic-table-blocks'
			),
			count
		);
	}),

	'invalid-num-rows': buildErrorMessage('invalidNumRows', ({ count }) => {
		return sprintf(
			// translators: %s: Row count entered by the user.
			__(
				'Cannot have %s rows. You must have at least 1 and no more than 1,000 rows.',
				'dynamic-table-blocks'
			),
			count
		);
	}),

	'paste-content-type-mismatch': buildMessage({
		notice: buildNotice({
			id: 'dataTypeMismatch',
			status: 'error',
			politeness: 'assertive',
			content: () =>
				__(
					'Cannot paste cell content because the source and target cell content types do not match.',
					'dynamic-table-blocks'
				),
		}),
		announcement: buildAnnouncement(
			() =>
				__(
					'Cannot paste cell content because the source and target cell content types do not match.',
					'dynamic-table-blocks'
				),
			'assertive'
		),
	}),

	'unmounted-reconcile-error': buildErrorMessage('dtbk-unmounted-reconcile-error', () =>
		__('Dynamic Tables could not reconcile unmounted tables.', 'dynamic-table-blocks')
	),

	'post-save-sync-error': buildErrorMessage('dtbk-post-save-sync-error', () =>
		__(
			'Dynamic Tables could not finish table cleanup after the post was saved.',
			'dynamic-table-blocks'
		)
	),

	'post-id-sync-error': buildErrorMessage('dtbk-post-id-sync-error', () =>
		__('Dynamic Tables could not synchronize the table post relationship.', 'dynamic-table-blocks')
	),

	'unmount-save-error': buildErrorMessage('dtbk-unmount-save-error', () =>
		__('Dynamic Tables could not save table cleanup state.', 'dynamic-table-blocks')
	),

	'editing-cell': buildMessage({
		announcement: buildAnnouncement(({ cellId }) => {
			// translators: %s: Cell identifier.
			return sprintf(__('Editing cell %s.', 'dynamic-table-blocks'), cellId);
		}),
	}),

	'stopped-editing-cell': buildMessage({
		announcement: buildAnnouncement(({ cellId }) => {
			// translators: %s: Cell identifier.
			return sprintf(__('Stopped editing cell %s.', 'dynamic-table-blocks'), cellId);
		}),
	}),

	'cell-pasted': buildMessage({
		announcement: buildAnnouncement(() => __('Cell pasted.', 'dynamic-table-blocks')),
	}),

	'cell-cut': buildMessage({
		announcement: buildAnnouncement(() =>
			__('Cell cut. Paste into another cell to move the content.', 'dynamic-table-blocks')
		),
	}),

	'cell-copied': buildMessage({
		announcement: buildAnnouncement(() => __('Cell copied.', 'dynamic-table-blocks')),
	}),

	'column-inserted-right': buildMessage({
		announcement: buildAnnouncement(({ columnLabel }) => {
			// translators: %s: New column label such as A, B, or C.
			return sprintf(__('Inserted column %s to the right.', 'dynamic-table-blocks'), columnLabel);
		}),
	}),

	'column-inserted-left': buildMessage({
		announcement: buildAnnouncement(({ columnLabel }) => {
			// translators: %s: New column label such as A, B, or C.
			return sprintf(__('Inserted column %s to the left.', 'dynamic-table-blocks'), columnLabel);
		}),
	}),

	'row-inserted-below': buildMessage({
		announcement: buildAnnouncement(({ rowNumber }) => {
			// translators: %d: New row number.
			return sprintf(__('Inserted row %d below.', 'dynamic-table-blocks'), rowNumber);
		}),
	}),

	'row-inserted-above': buildMessage({
		announcement: buildAnnouncement(({ rowNumber }) => {
			// translators: %d: New row number.
			return sprintf(__('Inserted row %d above.', 'dynamic-table-blocks'), rowNumber);
		}),
	}),

	'column-deleted': buildMessage({
		announcement: buildAnnouncement(({ columnLabel }) => {
			// translators: %s: Deleted column label such as A, B, or C.
			return sprintf(__('Deleted column %s.', 'dynamic-table-blocks'), columnLabel);
		}),
	}),

	'row-deleted': buildMessage({
		announcement: buildAnnouncement(({ rowNumber }) => {
			// translators: %d: Deleted row number.
			return sprintf(__('Deleted row %d.', 'dynamic-table-blocks'), rowNumber);
		}),
	}),

	'column-moved-right': buildMessage({
		announcement: buildAnnouncement(({ columnLabel }) => {
			// translators: %s: Column label such as A, B, or C.
			return sprintf(__('Moved column %s right.', 'dynamic-table-blocks'), columnLabel);
		}),
	}),

	'column-moved-left': buildMessage({
		announcement: buildAnnouncement(({ columnLabel }) => {
			// translators: %s: Column label such as A, B, or C.
			return sprintf(__('Moved column %s left.', 'dynamic-table-blocks'), columnLabel);
		}),
	}),

	'row-moved-down': buildMessage({
		announcement: buildAnnouncement(({ rowNumber }) => {
			// translators: %d: Row number.
			return sprintf(__('Moved row %d down.', 'dynamic-table-blocks'), rowNumber);
		}),
	}),

	'row-moved-up': buildMessage({
		announcement: buildAnnouncement(({ rowNumber }) => {
			// translators: %d: Row number.
			return sprintf(__('Moved row %d up.', 'dynamic-table-blocks'), rowNumber);
		}),
	}),

	'table-title-hidden': buildMessage({
		announcement: buildAnnouncement(() =>
			__(
				'Table title hidden. The table remains labeled for assistive technology.',
				'dynamic-table-blocks'
			)
		),
	}),

	'table-title-shown': buildMessage({
		announcement: buildAnnouncement(() => __('Table title shown.', 'dynamic-table-blocks')),
	}),

	'editor-grid-help': buildMessage({
		announcement: buildAnnouncement(() =>
			__(
				'Use arrow keys to move between cells. Press Enter or F2 to edit the selected cell. Use the row and column option buttons to manage table structure. If your screen reader is using browse or scan mode, switch to focus or forms mode to interact with the grid.',
				'dynamic-table-blocks'
			)
		),
	}),
};

/**
 * Retrieve and prepare full message from the message library.
 *
 * @since 1.3.1
 *
 * @param {string|Function}   content   Message content or callback that returns message content.
 * @param {Object<string, *>} [args={}] Arguments to pass to the content callback to be embedded into the message text.
 * @return {*}                          Formatted content.
 */
function resolveContent(content, args = {}) {
	return typeof content === 'function' ? content(args) : content;
}

/**
 * Assign aria politeness based on status if it is not otherwise specified.
 *
 * @since 1.3.1
 *
 * @param {string} status Message status level (error, warning, info).
 * @return {string}       Politeness level.
 */
function getDefaultPoliteness(status = 'info') {
	if (status === 'error' || status === 'warning') {
		return 'assertive';
	}
	return 'polite';
}

/**
 * Notice updated for any applied overrides.
 *
 * @since 1.3.1
 *
 * @param {Object}            notice    Notice definition from MESSAGE_LIBRARY.
 * @param {Object<string, *>} args      Values injected into dynamic message text.
 * @param {Object}            overrides Override values applied while resolving the notice.
 * @return {Object}                     Notice with overrides applied.
 */
function normalizeNotice(notice, args = {}, overrides = {}) {
	if (!notice) {
		return null;
	}

	const resolvedStatus = overrides.status ?? notice.status ?? 'info';

	return {
		...notice,
		id: overrides.id ?? notice.id ?? '',
		status: resolvedStatus,
		content: resolveContent(notice.content, args),
		actions: overrides.actions ?? notice.actions ?? [],
		icon: overrides.icon ?? notice.icon ?? null,
		isDismissible: overrides.isDismissible ?? notice.isDismissible ?? true,
		politeness: overrides.politeness ?? notice.politeness ?? getDefaultPoliteness(resolvedStatus),
		spokenMessage: overrides.spokenMessage ?? resolveContent(notice.spokenMessage, args),
	};
}

/**
 * Announcement updated for any applied overrides.
 *
 * @since 1.3.1
 *
 * @param {Object}            announcement Announcement definition from `MESSAGE_LIBRARY`.
 * @param {Object<string, *>} args         Values injected into dynamic message text
 * @param {Object}            overrides    Override values applied while resolving the announcement.
 * @return {Object}                        Announcement with overrides applied.
 */
function normalizeAnnouncement(announcement, args = {}, overrides = {}) {
	if (!announcement) {
		return null;
	}

	const resolvedStatus = overrides.status ?? 'info';

	return {
		content: resolveContent(announcement.content, args),
		politeness:
			overrides.politeness ?? announcement.politeness ?? getDefaultPoliteness(resolvedStatus),
	};
}

/**
 * Generate notice from announcement when notice is not specified.
 *
 * @since 1.3.1
 *
 * @param {Object} announcement Announcement definition containing content and politeness.
 * @param {Object} overrides    Override values applied while deriving the notice.
 * @return {Object}             Notice with overrides applied.
 */
function deriveNoticeFromAnnouncement(announcement, overrides = {}) {
	if (!announcement) {
		return null;
	}

	const resolvedStatus = overrides.status ?? 'info';

	return {
		id: overrides.id ?? '',
		status: resolvedStatus,
		content: announcement.content,
		actions: overrides.actions ?? [],
		icon: overrides.icon ?? null,
		isDismissible: overrides.isDismissible ?? true,
		politeness:
			overrides.politeness ?? announcement.politeness ?? getDefaultPoliteness(resolvedStatus),
		spokenMessage: overrides.spokenMessage,
	};
}

/**
 * Retrieve and return message definition from the library.
 *
 * @since 1.3.1
 *
 * @param {string} messageId Registered message key defined in MESSAGE_LIBRARY.
 * @return {Object}          Message definition.
 */
function resolveMessageDefinition(messageId) {
	const definition = MESSAGE_LIBRARY[messageId];

	if (!definition) {
		throw new Error(`Unknown message "${messageId}".`);
	}

	return definition;
}

/**
 * Identifies whether this will be rendered through the editor notification system.
 *
 * @since 1.3.1
 *
 * @param {string} target Message delivery target type and location.
 * @return {boolean}      Whether the message should be rendered through the notice store.
 */
function isStoreTarget(target) {
	return STORE_TARGETS.has(target);
}

/**
 * Retrieve the notice type from the default target unless it is explicitly specified.
 *
 * @since 1.3.1
 *
 * @param {string} target       Message delivery target and render location.
 * @param {string} explicitType Explicit store notice type override.
 * @return {boolean}            Store notice type
 */
function resolveStoreType(target, explicitType) {
	if (explicitType) {
		return explicitType;
	}
	return target === MESSAGE_TARGETS.STORE_SNACKBAR ? 'snackbar' : 'default';
}

/**
 * Build class name string from specified class names.
 *
 * @since 1.3.1
 *
 * @param {...string} classNames Class names to combine.
 * @return {string}              Space-delimited class name string.
 */
function joinClassNames(...classNames) {
	return classNames.filter(Boolean).join(' ');
}

/**
 * Props associated with rendering notices locally.
 *
 * @since 1.3.1
 *
 * @param {string} target          Message delivery target and render location.
 * @param {string} regionClassName Class name(s) associated with the message display region.
 * @return {Object|null}           Props to be applied for local render targets, or `null` when no region wrapper is needed.
 */
function buildRegionProps(target, regionClassName = '') {
	if (!LOCAL_TARGETS.has(target) || target === MESSAGE_TARGETS.CELL_POPOVER) {
		return null;
	}
	return {
		className: joinClassNames(
			'dtbk-message-region',
			`dtbk-message-region--${target}`,
			regionClassName
		),
		'data-dtbk-message-target': target,
	};
}

/**
 * Build a resolved message descriptor from the message library for store-backed,
 * local-rendered, and announcement-only usage.
 *
 * @since 1.3.1
 *
 * @param {string}            messageId                                 Registered message key defined in `MESSAGE_LIBRARY`.
 * @param {Object}            [param1={}]                               Message resolution and rendering options.
 * @param {Object<string, *>} [param1.args={}]                          Values injected into dynamic message text.
 * @param {string}            [param1.target=MESSAGE_TARGETS.BLOCK_TOP] Message delivery target and render location.
 * @param {string}            [param1.context='default']                Notice-store context used for create/remove operations.
 * @param {string}            [param1.type]                             Explicit store notice type override, such as `default` or `snackbar`.
 * @param {string}            [param1.id]                               Optional notice id override.
 * @param {string}            [param1.status]                           Optional notice status override such as `success`, `info`, `warning`, or `error`.
 * @param {Array<Object>}     [param1.actions]                          Optional notice actions.
 * @param {*}                 [param1.icon]                             Optional notice icon.
 * @param {string|Function}   [param1.spokenMessage]                    Optional spoken message override.
 * @param {string}            [param1.politeness]                       Optional screen reader politeness override.
 * @param {boolean}           [param1.isDismissible]                    Whether the notice can be dismissed.
 * @param {boolean}           [param1.explicitDismiss=false]            Whether a store-based snackbar requires explicit dismissal.
 * @param {Function}          [param1.onDismiss]                        Optional callback when a store notice is dismissed.
 * @param {Function}          [param1.onRemove]                         Optional callback when a locally rendered notice is removed or a popover is closed.
 * @param {string}            [param1.className='']                     Optional class name applied to a locally rendered notice.
 * @param {string}            [param1.regionClassName='']               Optional class name applied to the local render region wrapper.
 * @param {*}                 [param1.anchor=null]                      Optional anchor reference for `CELL_POPOVER` rendering.
 * @param {string}            [param1.placement='top']                  Optional popover placement.
 * @param {number}            [param1.offset=12]                        Optional popover offset.
 * @param {boolean}           [param1.flip=true]                        Whether the popover may flip placement to remain visible.
 * @param {boolean}           [param1.shift=true]                       Whether the popover may shift to remain visible.
 * @param {boolean|string}    [param1.focusOnMount=false]               Popover focus behavior on mount.
 * @param {boolean}           [param1.noArrow=false]                    Whether the popover arrow should be hidden.
 * @param {Object}            [param1.popoverProps={}]                  Additional props merged into popover rendering.
 * @return {Object} Resolved message descriptor containing notice, announcement, store, component, popover, and region data.
 */
function createMessageDescriptor(
	messageId,
	{
		args = {},
		target = MESSAGE_TARGETS.BLOCK_TOP,
		context = 'global',
		type,
		id,
		status,
		actions,
		icon,
		spokenMessage,
		politeness,
		isDismissible,
		explicitDismiss = false,
		onDismiss,
		onRemove,
		className = '',
		regionClassName = '',
		anchor = null,
		placement = 'top',
		offset = 12,
		flip = true,
		shift = true,
		focusOnMount = false,
		noArrow = false,
		popoverProps = {},
	} = {}
) {
	const definition = resolveMessageDefinition(messageId);
	const announcement = normalizeAnnouncement(definition.announcement, args, {
		status,
		politeness,
	});

	let notice = normalizeNotice(definition.notice, args, {
		id,
		status,
		actions,
		icon,
		spokenMessage,
		politeness,
		isDismissible,
	});

	if (!notice && announcement) {
		notice = deriveNoticeFromAnnouncement(announcement, {
			id,
			status,
			actions,
			icon,
			spokenMessage,
			politeness,
			isDismissible,
		});
	}

	const descriptor = {
		messageId,
		target,
		context,
		notice,
		announcement,
		store: null,
		component: null,
		popover: null,
		regionProps: buildRegionProps(target, regionClassName),
	};

	if (notice && isStoreTarget(target)) {
		descriptor.store = {
			status: notice.status,
			content: notice.content,
			options: {
				id: notice.id || undefined,
				type: resolveStoreType(target, type),
				context,
				actions: notice.actions,
				icon: notice.icon,
				isDismissible: notice.isDismissible,
				politeness: notice.politeness,
				spokenMessage: notice.spokenMessage,
				explicitDismiss,
				onDismiss,
			},
		};
	}

	if (notice && !isStoreTarget(target)) {
		descriptor.component = {
			status: notice.status,
			actions: notice.actions,
			icon: notice.icon,
			isDismissible: notice.isDismissible,
			onRemove,
			politeness: notice.politeness,
			spokenMessage: notice.spokenMessage,
			className,
			children: notice.content,
		};
	}

	if (target === MESSAGE_TARGETS.CELL_POPOVER) {
		descriptor.popover = {
			anchor,
			placement,
			offset,
			flip,
			shift,
			focusOnMount,
			noArrow,
			onClose: onRemove,
			...popoverProps,
		};
	}

	return descriptor;
}

/**
 * Retrieve and prepare full notice render props from the message library.
 *
 * Description: Prepare properties for direct <Notice /> rendering and optional
 * popover rendering
 *
 * @since 1.3.1
 *
 * @param {string} messageId    Registered message key defined in MESSAGE_LIBRARY.
 * @param {Object} [options={}] Message resolution and rendering options.
 * @return {Object}             Render props including `target`, `regionProps`, `noticeProps`, `popoverProps`, and `descriptor`.
 */
export function getMessageRenderProps(messageId, options = {}) {
	const descriptor = createMessageDescriptor(messageId, options);

	return {
		target: descriptor.target,
		regionProps: descriptor.regionProps,
		noticeProps: descriptor.component,
		popoverProps: descriptor.popover,
		descriptor,
	};
}

/**
 * Retrieve notice props from the message library for the <Notice /> component.
 *
 * Description: Lightweight helper that returns <Notice /> props only.
 *
 * @since 1.3.1
 *
 * @param {string} messageId    Registered message key defined in MESSAGE_LIBRARY.
 * @param {Object} [options={}] Message resolution and rendering options.
 * @return {Object}             Properties for the <Notice /> component.
 */
export function getMessageNoticeProps(messageId, options = {}) {
	return getMessageRenderProps(messageId, options).noticeProps;
}

/**
 * Retrieve message text only from library.
 *
 * Description: Prefer announcement content when available. Otherwise use notice content
 * as a fallback.
 *
 * @since 1.3.1
 *
 * @param {string} messageId    Registered message key defined in MESSAGE_LIBRARY.
 * @param {Object} [options={}] Message resolution and rendering options.
 * @return {Object}             Resolved message text.
 */
export function getMessageText(messageId, options = {}) {
	const descriptor = createMessageDescriptor(messageId, options);

	return descriptor.announcement?.content ?? descriptor.notice?.content ?? '';
}

/**
 * Retrieve a store based notice payload from the message library.
 *
 * @since 1.3.1
 *
 * @param {string} messageId    Registered message key defined in MESSAGE_LIBRARY.
 * @param {Object} [options={}] Message resolution and rendering options.
 * @return {Object}             Store notice payload from the message library.
 */
function getMessageStorePayload(messageId, options = {}) {
	return createMessageDescriptor(messageId, {
		target: MESSAGE_TARGETS.STORE_INLINE,
		...options,
	}).store;
}

/**
 * Create a notice through the notice store from the message library.
 *
 * Description: Creates a store-based notice when the target is store-based but
 *              does not create an accessibility announcement.
 *
 * @since 1.3.1
 *
 * @param {CreateNoticeHandler} createNotice Notice store createNotice action dispatcher.
 * @param {string}              messageId    Registered message key defined in MESSAGE_LIBRARY.
 * @param {Object}              [options={}] Message resolution and rendering options.
 * @return {Object|null}                     Store notice payload or null if no notice was created.
 */
export function showMessageNotice(createNotice, messageId, options = {}) {
	const storeNotice = getMessageStorePayload(messageId, options);

	if (!storeNotice || typeof createNotice !== 'function') {
		return null;
	}

	createNotice(storeNotice.status, storeNotice.content, storeNotice.options);
	return storeNotice;
}

/**
 * Remove a store-based notice.
 *
 * @since 1.3.1
 *
 * @param {RemoveNoticeHandler} removeNotice Notice store removeNotice action dispatcher.
 * @param {string}              messageId    Registered message key defined in MESSAGE_LIBRARY.
 * @param {Object}              [options={}] Message resolution and rendering options.
 * @return {string|null}                     Notice identifier from message library.
 */
export function removeMessageNotice(removeNotice, messageId, options = {}) {
	const descriptor = createMessageDescriptor(messageId, {
		target: MESSAGE_TARGETS.STORE_INLINE,
		...options,
	});
	const noticeId = descriptor.notice?.id || null;

	if (!noticeId || typeof removeNotice !== 'function') {
		return null;
	}

	removeNotice(noticeId, descriptor.context);

	return noticeId;
}

/**
 * Retrieve message announcement from message library.
 *
 * @since 1.3.1
 *
 * @param {string} messageId    Registered message key defined in MESSAGE_LIBRARY.
 * @param {Object} [options={}] Message resolution and rendering options.
 * @return {Object|null}        Announcement payloadwith content and politeness.
 */
function getAnnouncementPayload(messageId, options = {}) {
	const descriptor = createMessageDescriptor(messageId, options);

	if (descriptor.announcement) {
		return descriptor.announcement;
	}

	if (descriptor.notice) {
		return {
			content: descriptor.notice.spokenMessage || descriptor.notice.content,
			politeness: descriptor.notice.politeness || getDefaultPoliteness(descriptor.notice.status),
		};
	}

	return null;
}

/**
 * Send an accessibility announcement without rendering a notice.
 *
 * @since 1.3.1
 *
 * @param {string} messageId    Registered message key defined in MESSAGE_LIBRARY.
 * @param {Object} [options={}] Message resolution and rendering options.
 * @return {string|null}        Announcement text.
 */
export function speakMessage(messageId, options = {}) {
	const announcement = getAnnouncementPayload(messageId, options);

	if (!announcement?.content) {
		return null;
	}

	speak(announcement.content, announcement.politeness || 'polite');

	return announcement.content;
}

/**
 * Publish a message to the notice store.
 *
 * Description: Creates a store-based notice when the target is store-based and
 *              optionally speak the message.
 *
 * @since 1.3.1
 *
 * @param {CreateNoticeHandler} createNotice Notice store createNotice action dispatcher.
 * @param {string}              messageId    Registered message key defined in MESSAGE_LIBRARY.
 * @param {Object}              [options={}] Message resolution and rendering options.
 * @return {Object|null}                     Resolved message descriptor.
 */
export function publishMessage(createNotice, messageId, options = {}) {
	const { announceMode = 'auto' } = options;
	const descriptor = createMessageDescriptor(messageId, {
		target: MESSAGE_TARGETS.STORE_INLINE,
		...options,
	});

	if (descriptor.store && typeof createNotice === 'function') {
		createNotice(descriptor.store.status, descriptor.store.content, descriptor.store.options);
	}
	const shouldManuallyAnnounce =
		announceMode === 'manual' || (announceMode === 'auto' && !descriptor.store);

	if (shouldManuallyAnnounce) {
		speakMessage(messageId, options);
	}

	return descriptor;
}
