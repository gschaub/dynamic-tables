import { escapeAttribute, escapeEditableHTML } from '@wordpress/escape-html';
import { __ } from '@wordpress/i18n';

/**
 * Validates a url
 *
 * @since    1.4.10
 *
 * @param {string} value url to be formatted
 * @return {string | boolean}   Is url valid
 */
export function isWebUrl(value) {
	if (typeof value !== 'string' || !value.trim()) return false;
	try {
		const { protocol } = new URL(value.trim(), 'https://wordpress.invalid/');
		return protocol === 'http:' || protocol === 'https:';
	} catch {
		return false;
	}
}

/**
 * Support updates required for changes to cell value attribute definitions.
 *
 * @since    1.4.10
 *
 * @param {Object} value       Cell value attributes
 * @param {string} content     Cell content
 * @param {string} contentType Column content type
 * @return {Object}            Normalized cell value attributes
 */
export function normalizeCellValueAttributes(value = {}, content = '', contentType) {
	const cannonical = { ...value?.cannonical };
	const options = { ...value?.options };
	const refs = [...(value?.refs ?? [])];
	const meta = { ...value?.meta };
	const indexText = value?.indexText;

	/* Backwards compatibility for old newTab location for links*/
	if (options.newTab == null && typeof cannonical.newTab === 'boolean') {
		options.newTab = cannonical.newTab;
	}
	delete cannonical.newTab;

	const attributes = {
		...value,
		cannonical,
		options,
		refs,
		meta,
		indexText,
	};

	return attributes;
}

/**
 * Convert post attibutes a Combobox option.
 *
 * @since    1.4.10
 *
 * @description Build a combobox option for the post stored in the cell value attributes.
 *
 * @param {Object} attributes Post value attributes
 * @return {Object | null}    Combobox Option
 */
export function getPostOption(attributes) {
	const postId = Number(attributes?.cannonical?.postId);
	if (!Number.isSafeInteger(postId) || postId <= 0) return null;
	return {
		value: String(postId),
		label: attributes.indexText || __('No title found', 'dynamic-table-blocks'),
		postType: attributes.cannonical.postType || 'post',
	};
}

/**
 * Does cell contain an option to open a link in a new tab.
 *
 * @since    1.4.10
 *
 * @param {Object} attributes    Cell value attributes
 * @param {Object} columnOptions Content type's format options
 * @return {boolean}             Is the newTab option set?
 */
export function getNewTab(attributes, columnOptions = {}) {
	return Boolean(attributes.options?.newTab ?? columnOptions.newTab ?? false);
}

/**
 * Extract and return URL from cell conent.
 *
 * @since    1.4.10
 *
 * @param {string} content Cell content
 * @return {string}        URL extracted from content
 */
export function getCellLinkUrl(content) {
	const template = document.createElement('template');
	template.innerHTML = content;

	return template.content.querySelector('a[href]')?.getAttribute('href') ?? '';
}

/**
 * Builds a cell's content when cached.
 *
 * @since    1.4.10
 *
 * @param {string} contentType   Cell's column content type
 * @param {Object} attributes    Cell value attributes
 * @param {Object} columnOptions Content type's format options
 * @param {string} postUrl       The post's URL if it exists
 * @return {string}              Cell content
 */
export function buildCellContent(contentType, attributes, columnOptions = {}, postUrl = '') {
	let label;
	let url;

	switch (contentType) {
		case 'post': {
			if (!getPostOption(attributes)) return '';
			label = String(attributes.indexText || '');
			url = String(postUrl).trim();
			break;
		}
		default: {
			label = String(attributes.cannonical?.label || '');
			url = String(attributes.cannonical?.url || '').trim();
		}
	}

	const text = escapeEditableHTML(label);
	if (!isWebUrl(url)) return text;

	const target = getNewTab(attributes, columnOptions)
		? ' target="_blank" rel="noopener noreferrer"'
		: ' target="_top"';

	return '<a href="' + escapeAttribute(url) + '"' + target + '>' + text + '</a>';
}

/**
 * Creates or updates a post cell's attributes when changed.
 *
 * @since    1.4.10
 *
 * @param {Object} attributes Cell value attributes
 * @param {Object} post       Wordpress post details
 * @return {Object}           Updated cell attributes for a post type cell
 */
export function setPostDetails(attributes, post) {
	return {
		...attributes,
		cannonical: {
			...attributes.cannonical,
			postId: post.postId,
			postType: post.postType,
		},
		refs: [{ postId: post.postId }],
		indexText: post.title,
	};
}

/**
 * Clears the cell’s post selection.
 *
 * @since    1.4.10
 *
 * @param {Object} attributes Cell value attributes
 * @return {Object}           Updated cell attributes for a post type cell
 */
export function removePostDetails(attributes) {
	const cannonical = { ...attributes.cannonical };
	delete cannonical.postId;
	delete cannonical.postType;
	return {
		...attributes,
		cannonical,
		refs: [],
		indexText: '',
	};
}
