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
 * @since    1.5.0  Add support for external data
 *
 * @param {Object} value       Cell value attributes
 * @param {string} content     Cell content
 * @param {string} contentType Column content type
 * @return {Object}            Normalized cell value attributes
 */
export function normalizeCellValueAttributes(value = {}, content = '', contentType) {
	const canonical = {
		...(value?.['cannonical'] || {}),
		...(value?.canonical || {}),
	};
	const options = { ...value?.options };
	const refs = [...(value?.refs ?? [])];
	const meta = { ...value?.meta };
	const externalData = { ...value?.externalData };
	const indexText = value?.indexText;

	/* Backwards compatibility for old newTab location for links*/
	if (options?.newTab == null && typeof canonical?.newTab === 'boolean') {
		options.newTab = canonical.newTab;
	}
	delete canonical?.newTab;

	const attributes = {
		...value,
		canonical,
		options,
		refs,
		meta,
		externalData,
		indexText,
	};

	// Remove the legacy misspelled property from normalized values.
	delete attributes['cannonical'];

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
	const postId = Number(attributes?.canonical?.postId);
	const postType = attributes?.canonical?.postType;

	if (
		!Number.isSafeInteger(postId) ||
		postId <= 0 ||
		typeof postType !== 'string' ||
		postType.length === 0
	) {
		return null;
	}

	return {
		value: String(postId),
		label: attributes.indexText || __('No title found', 'dynamic-table-blocks'),
		postType: postType,
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
			label = String(attributes.canonical?.label || '');
			url = String(attributes.canonical?.url || '').trim();
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
		canonical: {
			...attributes.canonical,
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
	const canonical = { ...attributes.canonical };
	delete canonical.postId;
	delete canonical.postType;
	return {
		...attributes,
		canonical,
		refs: [],
		indexText: '',
	};
}
