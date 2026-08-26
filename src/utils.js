/* External dependencies */
import { dateI18n } from '@wordpress/date';
import { create, getTextContent } from '@wordpress/rich-text';

const LETTER_MAP = {
	1: 'A',
	2: 'B',
	3: 'C',
	4: 'D',
	5: 'E',
	6: 'F',
	7: 'G',
	8: 'H',
	9: 'I',
	a: 'J',
	b: 'K',
	c: 'L',
	d: 'M',
	e: 'N',
	f: 'O',
	g: 'P',
	h: 'Q',
	i: 'R',
	j: 'S',
	k: 'T',
	l: 'U',
	m: 'V',
	n: 'W',
	o: 'X',
	p: 'Y',
	q: 'Z',
};

const READABLE_LINE_BREAK_TAGS = new Set([
	'BLOCKQUOTE',
	'DIV',
	'H1',
	'H2',
	'H3',
	'H4',
	'H5',
	'H6',
	'LI',
	'OL',
	'P',
	'PRE',
	'TABLE',
	'TR',
	'UL',
]);

const READABLE_TAB_BREAK_TAGS = new Set(['TD', 'TH']);

const TWO_DIGIT_YEAR_CURRENT_CENTURY = 2000;
const TWO_DIGIT_YEAR_CURRENT_CENTURY_END = 49;
const TWO_DIGIT_YEAR_PREVIOUS_CENTURY = 1900;

/**
 * Replace html tags with readable equivalents.
 *
 * @since 3.1.0
 *
 * @param {Array}  buffer All tokens previously converted tokens
 * @param {string} token  Token to be converted and added to the buffer
 */
function appendReadableToken(buffer, token) {
	if (!token) {
		return;
	}

	const lastToken = buffer[buffer.length - 1];
	if ((token === '\n' || token === '\t') && lastToken === token) {
		return;
	}

	buffer.push(token);
}

/**
 * Create index text from HTML for search and accessibility purposes.
 *
 * @since 3.1.0
 *
 * @param {string} html Passed html string
 * @return  {string}    Plain text
 */
export function htmlToIndexText(html = '') {
	return getTextContent(create({ html })).replace(/\s+/g, ' ').trim();
}

/**
 * Convert html to plain text retaining line breaks and tabs.
 *
 * @since 3.1.0
 *
 * @param {string} html Passed html string
 * @return  {string}    Plain text with line breaks and tabs converted for readability
 */
export function htmlToReadableText(html = '') {
	if (!html) {
		return '';
	}

	if (typeof document === 'undefined') {
		return htmlToIndexText(html);
	}

	const root = document.createElement('div');
	root.innerHTML = String(html);

	const tokens = [];

	function transformNode(node) {
		if (node.nodeType === 3) {
			appendReadableToken(tokens, node.textContent || '');
			return;
		}

		if (node.nodeType !== 1) {
			return;
		}

		const tagName = node.tagName.toUpperCase();

		if (tagName === 'BR') {
			appendReadableToken(tokens, '\n');
			return;
		}

		node.childNodes.forEach(transformNode);

		if (READABLE_TAB_BREAK_TAGS.has(tagName)) {
			appendReadableToken(tokens, '\t');
		}

		if (READABLE_LINE_BREAK_TAGS.has(tagName)) {
			appendReadableToken(tokens, '\n');
		}
	}

	root.childNodes.forEach(transformNode);

	return tokens
		.join('')
		.replace(/\u00a0/g, ' ')
		.replace(/\r\n?/g, '\n')
		.replace(/[^\S\n\t]+/g, ' ')
		.replace(/ *\n */g, '\n')
		.replace(/ *\t */g, '\t')
		.replace(/\t+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/**
 * Convert a column number to a string of letters.
 *
 * @since 1.0.0
 * @since 1.1.0 Refactored
 *
 * @param {number} letterNumber Integer
 * @return  {string} Column letter
 */
export function numberToLetter(letterNumber) {
	if (letterNumber === 0) {
		return '0';
	}

	const digits = letterNumber.toString(26);
	let result = '';

	for (let i = 0; i < digits.length; i++) {
		result += LETTER_MAP[digits[i]] ?? '';
	}

	return result;
}

/**
 * Convert a column letter number to a number.
 *
 * @since 1.3.1
 *
 * @param {string} numberLetter Column letter
 * @return {number}             Column number
 */
export function letterToNumber(numberLetter) {
	let result = 0;
	for (const ch of numberLetter.toUpperCase()) {
		result = result * 26 + (ch.charCodeAt(0) - 64);
	}
	return result;
}

/**
 * Update one attribute value inside the array.
 *
 * @since 1.0.0
 *
 * @param {Array|Object} arrayIn     current state with nested arrays and objects
 * @param {string}       key         State array type
 * @param {number}       id          Identifier of object associated with they key
 * @param {Object}       updatedData New object value
 * @return  {Array|Object} Updated object that represents one attribute of the new state
 */
export function updateArray(arrayIn, key, id, updatedData) {
	return arrayIn.map(item => (item[key] === id ? { ...item, ...updatedData } : item));
}

function escapeHtml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

/**
 * Sort table part array by the natural identifier assigned at design time.
 *
 * @since 1.0.0
 *
 * @param {string} tablePart  Table part to be sorted (columns | rows | cells)
 * @param {Array}  tableArray Array of all attributes of the table part being sorted
 */
export function tableSort(tablePart, tableArray) {
	if (tablePart === 'rows') {
		const sortedRows = [...tableArray];
		sortedRows.sort((a, b) => {
			if (Number([a.row_id]) < Number([b.row_id])) {
				return -1;
			}
			return 1;
		});
		return sortedRows;
	}

	if (tablePart === 'columns') {
		const sortedColumns = [...tableArray];
		sortedColumns.sort((a, b) => {
			if (Number([a.column_id]) < Number([b.column_id])) {
				return -1;
			}
			return 1;
		});
		return sortedColumns;
	}

	if (tablePart === 'cells') {
		const sortedCells = [...tableArray];
		sortedCells.sort((a, b) => {
			if (Number([a.row_id]) === Number([b.row_id])) {
				if (Number([a.column_id]) < Number([b.column_id])) {
					return -1;
				}
				return 1;
			}

			if (Number([a.row_id]) < Number([b.row_id])) {
				return -1;
			}
			return 1;
		});
		return sortedCells;
	}
}

/**
 * Create a set of css classes from a space delimited string
 *
 * @since 1.2.4
 *
 * @param {string} classString String of css class names
 * @return  {Set}              Set of class names
 */
export function stageClassesForEdit(classString) {
	if (typeof classString !== 'string' || classString === '') return new Set();
	return new Set(classString.split(/\s+/).filter(Boolean));
}

/**
 * Build string of space delimited classes from class set
 *
 * @since 1.2.4
 *
 * @param {Set} classSet String of css class names
 * @return  {string}              Set of class names
 */
export function prepareClassesForUse(classSet) {
	return Array.from(classSet).join(' ');
}

/**
 * Create a random identifier for assignment as a block/table cross reference.
 *
 * @since 1.0.0
 *
 * @return  {string} New block_table_ref
 */
export function generateBlockTableRef() {
	const timestamp = Date.now();
	return timestamp.toString(16);
}

/**
 * Calculate the cell id for each cell in the Summary.
 *
 * @since 1.0.0
 * @since 1.1.0 Moved from resolvers.js to utils.js
 *
 * @param {*} fetchedCells cell array retrieved the REST api
 * @return  {Array|Object} Cells with the added cell id attribute
 */
export function computeCellIds(fetchedCells) {
	fetchedCells.forEach(cell => {
		cell.cell_id = numberToLetter(cell.column_id) + cell.row_id;
	});
	return {
		fetchedCells,
	};
}

/**
 * Extract the column id and row id given cell id.
 *
 * @since 1.3.1
 *
 * @param {string} cellId Cell id to be transformed
 * @return {Object}       Row and column id extracted from the cell id
 */
export function getCellIdCoordinates(cellId) {
	const match = cellId.match(/^(0|[A-Z]+)(\d+)$/i);
	if (!match) {
		throw new Error('Invalid cell id (' + cellId + ')');
	}

	const [, colLetters, rowString] = match;
	const rowId = Number(rowString);
	const colId = colLetters === '0' ? 0 : letterToNumber(colLetters);

	return { column_id: colId, row_id: rowId };
}

/**
 * Set content for borders occuring in rows (integers) and columns (letters).
 *
 * @since 1.0.0
 *
 * @param {*} row     current row_id
 * @param {*} column  current column_id
 * @param {*} content current content
 * @return  {number | string | null} cell content
 */
export function setBorderContent(row, column, content) {
	if (row === '0' && column === '0') {
		return '';
	}
	return content;
}

/**
 * Identify whether to display the column menu component for the current column
 *
 * @since 1.0.0
 *
 * @param {boolean} columnMenuVisible Whether the column menu should be visible based on current state of processing
 * @param {number}  openColumnRow     The column id or row id that should be open
 * @param {number}  column_id         Current column id
 * @return {boolean}                  Show the current column menu?
 */
export function openCurrentColumnMenu(columnMenuVisible, openColumnRow, column_id) {
	if (columnMenuVisible && openColumnRow === column_id) {
		return true;
	}
	return false;
}

/**
 * Identify whether to display the row menu component for the current column
 *
 * @since 1.0.0
 *
 * @param {boolean} rowMenuVisible Whether the row menu should be visible based on current state of processing
 * @param {number}  openColumnRow  The column id or row id that should be open
 * @param {number}  row_id         Current row id
 * @return {boolean}               Show the current row menu?
 */
export function openCurrentRowMenu(rowMenuVisible, openColumnRow, row_id) {
	if (rowMenuVisible && openColumnRow === row_id) {
		return true;
	}
	return false;
}

/** Fallback detault data type of backward compatibility */
export const DEFAULT_COLUMN_DATA_TYPE = {
	type: 'general',
};

/**
 * Velidate the existance of a column data type and create a detault if there is not one
 *
 * @since 1.2.3
 *
 * @param {Object} columnDataType Data Type of the current column
 * @return {Object} Default data type object
 */
export function normalizeColumnDataType(columnDataType) {
	if (columnDataType?.type) {
		return columnDataType;
	}

	if (columnDataType?.columnDataType?.type) {
		return columnDataType.columnDataType;
	}

	return DEFAULT_COLUMN_DATA_TYPE;
}

/**
 * Test whether a data is formatted as a valid ISO date string
 *
 * @since 1.2.0
 *
 * @param {string} value Test date string
 * @return {boolean}     Passed test?
 */
function isValidISODate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

	const [year, month, day] = value.split('-').map(Number);
	const test = new Date(Date.UTC(year, month - 1, day));

	return (
		test.getUTCFullYear() === year && test.getUTCMonth() === month - 1 && test.getUTCDate() === day
	);
}

/**
 * Test whether a data is formatted as a valid time string
 *
 * @since 1.2.2
 *
 * @param {string} value Test date string
 * @return {boolean}     Passed test?
 */
function isValidTime(value) {
	const m = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(value);
	return !!m;
}

/**
 * Test whether a data is formatted as a valid ISO date-time string
 *
 * @since 1.2.0
 *
 * @param {string} value Test date string
 * @return {boolean}     Passed test?
 */
function isValidISODatetime(value) {
	const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

	if (!isoRegex.test(value)) return false;

	const test = new Date(value);
	return !Number.isNaN(test.valueOf());
}

/**
 * Format Date/Time values for display when focus is not on this cell
 *
 * @since 1.2.0
 *
 * @param {Date}   date   ISO Date
 * @param {string} format Date/Time format
 * @return {string}       Formatted date for display
 */
export function formatedDisplayDate(date, format) {
	if (!date) return '';

	// Test whether input is a valid ISO date
	if (!isValidISODate(date) && !isValidISODatetime(date) && !isValidTime(date)) {
		return '';
	}

	if (format === 'date') {
		return dateI18n('n/j/Y', date);
	}
	if (format === 'time') {
		const [hh, mm] = date.split(':').map(Number);
		if (!Number.isInteger(hh) || !Number.isInteger(mm)) return '';

		const ampm = hh >= 12 ? 'pm' : 'am';
		const h12 = ((hh + 11) % 12) + 1;
		return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
	}
	if (format === 'datetime-local') {
		return dateI18n('n/j/Y g:i a', date);
	}
	return '';
}

/**
 * Format Date/Time values for canonical storage in ISO format
 *
 * @since 1.2.0
 *
 * @param {string} date   Date string
 * @param {string} format Date/Time format
 * @return {Date}         ISO date
 */
export function formattedIsoDate(date, format) {
	// Test whether input is a valid ISO date
	if (date) {
		switch (format) {
			case 'date':
				if (!isValidISODate(date)) return '';
				break;
			case 'time':
				if (!isValidTime(date)) return '';
				break;
			case 'datetime-local':
				if (!isValidISODatetime(date)) return '';
				break;
			default:
				return '';
		}
	}

	const dateString = date ? new Date(date) : new Date();

	if (format === 'date') {
		return dateString.toISOString().split('T')[0];
	}

	if (format === 'time') {
		if (!!date) {
			return date;
		}
		const hh = String(dateString.getHours()).padStart(2, '0');
		const mm = String(dateString.getMinutes()).padStart(2, '0');
		return `${hh}:${mm}`;
	}

	if (format === 'datetime-local') {
		const yyyy = dateString.getFullYear();
		const mo = String(dateString.getMonth() + 1).padStart(2, '0');
		const dd = String(dateString.getDate()).padStart(2, '0');
		const hh = String(dateString.getHours()).padStart(2, '0');
		const mm = String(dateString.getMinutes()).padStart(2, '0');
		return `${yyyy}-${mo}-${dd}T${hh}:${mm}`;
	}

	return '';
}

/*
 * Support caret positioning during entry
 */
const CARET_TOKEN_PATTERN = /[\d.-]/;

/**
 * Number of numeric input characters (caret tokens) that appear before the caret location
 *
 * @since 1.2.4
 *
 * @param {string} value      Edit input value
 * @param {number} caretIndex Initial caret position
 * @return {number}           Number of caret tokens before the caret
 */
export function countCaretTokens(value, caretIndex) {
	return (value.slice(0, caretIndex).match(/[\d.-]/g) ?? []).length;
}

/**
 * Identify caret insertion point for a number string
 *
 * @since 1.2.4
 *
 * @param {string} value      Edit input value
 * @param {number} tokenCount Number of caret tokens
 * @return {number}           Caret insertion point computed from input value
 */
export function getCaretIndexFromTokenCount(value, tokenCount) {
	if (tokenCount <= 0) {
		return 0;
	}

	let seen = 0;

	for (let i = 0; i < value.length; i++) {
		if (CARET_TOKEN_PATTERN.test(value[i])) {
			seen++;

			if (seen >= tokenCount) {
				return i + 1;
			}
		}
	}

	return value.length;
}

/**
 * Identify the location of the first numeric value in a string
 *
 * @since 1.2.4
 *
 * @param {string} value Edit input value
 * @return {number}           First number location index
 */
export function getFirstNumericIndex(value) {
	return value.search(/\d/);
}

/**
 * Adjusts next caret location if the prior location was at the start of the string
 * or in the prefix zone (e.g., currency symbol, etc.)
 *
 * @since 1.2.4
 *
 * @param {string} value      Edit input value
 * @param {number} caretIndex Caret location in the rendered input value
 * @param {Object} caretMeta  Information about the current caret location
 * @return {number}           Next caret location adjusted for prefx
 */
export function normalizeCaretForPresentationPrefix(value, caretIndex, caretMeta) {
	if (!caretMeta) {
		return caretIndex;
	}

	const firstNumericIndex = getFirstNumericIndex(value);

	if (firstNumericIndex === -1) {
		return caretIndex;
	}

	if (caretMeta.wasAtStart) {
		return 0;
	}

	if (caretMeta.wasInPrefixZone) {
		return firstNumericIndex;
	}

	return caretIndex;
}

/**
 * Strip formatting characters from numeric display string
 *
 * @since 1.2.4
 *
 * @param {string} value          String representation of number
 * @param {string} dataTypeFormat Number format type
 * @return {string} Sanitized numeric string
 */
export function sanitizeNumberInput(value, dataTypeFormat) {
	let next = String(value ?? '');

	// Remove display formatting first.
	next = next.replace(/,/g, '');
	next = next.replace(/[^\d.\-]/g, '');

	// Keep only a single leading minus.
	next = next.replace(/(?!^)-/g, '');

	// Integers do not allow decimals.
	if (dataTypeFormat === 'integer') {
		return next.replace(/\./g, '');
	}

	// Keep only the first decimal point.
	const firstDot = next.indexOf('.');
	if (firstDot !== -1) {
		next = next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, '');
	}
	return next;
}

/**
 * Adjust decimal position for percentage formatted numbers
 *
 * @since 1.2.4
 *
 * @param {string} rawValue String representation of number
 * @param {string} places   Number decimal
 * @return {string}           Number with revised decimal locations
 */
function shiftDecimalString(rawValue, places) {
	const next = sanitizeNumberInput(rawValue, 'number');

	if (next === '' || next === '-') {
		return next;
	}

	const isNegative = next.startsWith('-');
	const unsigned = isNegative ? next.slice(1) : next;
	const [integerPart = '', fractionPart = ''] = unsigned.split('.');
	let digits = `${integerPart.replace(/\D/g, '')}${fractionPart.replace(/\D/g, '')}`;

	if (digits === '') {
		return isNegative ? '-' : '';
	}

	const scale = fractionPart.replace(/\D/g, '').length - places;

	digits = digits.replace(/^0+(?=\d)/, '');
	if (digits === '') {
		digits = '0';
	}

	if (scale <= 0) {
		return `${isNegative ? '-' : ''}${digits}${'0'.repeat(scale * -1)}`;
	}

	if (digits.length <= scale) {
		digits = digits.padStart(scale + 1, '0');
	}

	const splitIndex = digits.length - scale;
	const whole = digits.slice(0, splitIndex).replace(/^0+(?=\d)/, '') || '0';
	const fraction = digits.slice(splitIndex).replace(/0+$/, '');

	return `${isNegative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

/**
 * Move two decimal position to the left for entry
 *
 * @since 1.2.4
 *
 * @param {string} rawValue Number percentage string before formatting update
 * @return {string}         Number percentage string after formatting update
 */
export function toPercentEntryValue(rawValue) {
	return shiftDecimalString(rawValue, 2);
}

/**
 * Move two decimal position to the right after entry
 *
 * @since 1.2.4
 *
 * @param {string} rawValue Number percentage string before formatting update
 * @return {string}         Number percentage string after formatting update
 */
export function fromPercentEntryValue(rawValue) {
	return shiftDecimalString(rawValue, -2);
}

/**
 * Strip formatting characters from numeric display string
 *
 * @since 1.2.4
 *
 * @param {string}  rawValue           String representation of canonical number
 * @param {string}  dataTypeFormat     Number format type
 * @param {boolean} thousandSeparator  Add thousands separator
 * @param {number}  decimalPlaces      Number of decimal places
 * @param {boolean} showCurrencySymbol Display currency symbol
 * @param {boolean} bracketNegative    Display negative numbers with brackets
 * @return {string}                   Formatted string representation of number
 */
export function formattedNumber(
	rawValue,
	dataTypeFormat,
	thousandSeparator,
	decimalPlaces,
	showCurrencySymbol,
	bracketNegative = false
) {
	const sanitizedNumber = sanitizeNumberInput(rawValue, dataTypeFormat);

	if (sanitizedNumber === '') return '';
	if (sanitizedNumber === '-') return '-';

	const isNegative = sanitizedNumber.startsWith('-');
	const unsigned = isNegative ? sanitizedNumber.slice(1) : sanitizedNumber;
	const hasDecimal = unsigned.includes('.');

	let [integerPart = '', fractionPart = ''] = unsigned.split('.');
	integerPart = integerPart.replace(/\D/g, '');
	fractionPart = fractionPart.replace(/\D/g, '');

	let numberStyle = 'decimal';
	let revisedDecimalPlaces = decimalPlaces;

	switch (dataTypeFormat) {
		case 'number':
			numberStyle = 'decimal';
			break;
		case 'integer':
			numberStyle = 'decimal';
			break;
		case 'percent':
			numberStyle = 'percent';
			revisedDecimalPlaces = decimalPlaces + 2;
			break;
		case 'currency':
			numberStyle = showCurrencySymbol ? 'currency' : 'decimal';
			break;
		default:
			numberStyle = 'decimal';
	}

	const formatOptions = {
		style: numberStyle,
		currency: 'USD',
		// Options include code | symbol | narrowSymbol | name
		currencyDisplay: 'symbol',
		currencySign: bracketNegative ? 'accounting' : 'standard',
		// Reserved for future unit of measure adoption
		// unit:  Per subset of ECMA-402 specification
		// unitDisplay:
		minimumIntegerDigits: 1, // provides ability to left pad zeros
		minimumFractionDigits: decimalPlaces,
		maximumFractionDigits: decimalPlaces,
		// Not implemented at this time
		// minimumSignificantDigits:
		// maximumSignificantDigits:
		// roundingPriority:
		// roundingIncrement:
		// roundingMode:
		// trailingZeros:
		// notation:
		// compactDisplay:
		signDisplay: 'auto',
		useGrouping: thousandSeparator ? true : false,
	};

	if (numberStyle === 'currency') {
		formatOptions.currency = 'USD';
		formatOptions.currencyDisplay = 'symbol';
	}

	const limitedFraction = fractionPart.slice(0, Math.max(0, revisedDecimalPlaces));
	const decimalFragment = hasDecimal ? `.${limitedFraction}` : '';
	const rawNumberString = `${integerPart}${decimalFragment}`;

	const formattedMagnitude = new Intl.NumberFormat('en-US', formatOptions).format(
		Number(rawNumberString)
	);

	if (!isNegative) {
		return formattedMagnitude;
	}

	if (bracketNegative) {
		return `(${formattedMagnitude})`;
	}

	return `-${formattedMagnitude}`;
}

/**
 * Strip formatting characters from numeric display string
 *
 * @since 1.3.1
 *
 * @param {string} cellContent    Value of the cell content to be copied
 * @param {Array}  cellValueAttr  The cell attribute Value data
 * @param {Object} columnDataType Column data settings
 * @return {Array}                Formatted text and plain text to be copied to the clipboard
 */
export function formatClipboardContent(
	cellContent,
	cellValueAttr,
	columnDataType = DEFAULT_COLUMN_DATA_TYPE
) {
	const dataType = columnDataType?.type || 'general';
	const typeFormat = columnDataType?.settings;
	let formattedText = '';
	let plainText = '';

	switch (dataType) {
		case 'general': {
			formattedText = cellContent;
			plainText = htmlToReadableText(cellContent) || cellValueAttr.indexText || '';
			break;
		}
		case 'date-time': {
			formattedText = formatedDisplayDate(cellContent, typeFormat?.format);
			plainText = formattedText;
			break;
		}
		case 'number':
			{
				const numberDisplayValue = formattedNumber(
					cellContent,
					typeFormat?.format,
					typeFormat?.formatOptions?.thousandSeparator,
					typeFormat?.formatOptions?.decimalPlaces,
					typeFormat?.formatOptions?.showCurrencySymbol,
					typeFormat?.formatOptions?.bracketNegative
				);
				if (typeFormat?.formatOptions?.redNegative) {
					const isNegativeNumber = Number(cellContent) < 0;
					const htmlFormatted = `<span style="color: red;">${escapeHtml(numberDisplayValue)}</span>`;
					formattedText = isNegativeNumber ? htmlFormatted : numberDisplayValue;
				} else {
					formattedText = numberDisplayValue;
				}
				plainText = numberDisplayValue;
			}
			break;
		default: {
			formattedText = cellContent;
			plainText = htmlToReadableText(cellContent) || cellValueAttr.indexText || '';
		}
	}
	return {
		formattedText,
		plainText,
	};
}

/**
 * Coerce data between from one type to another
 *
 * @since 1.4.9
 *
 * @param {string} cellContent                 The content of the table cell
 * @param {string} cellValueAttr               The value attribute of the table cell
 * @param {Object} currentColumnDataTypeObject The data type object for the current column
 * @param {string} columnDataType              The data type of the target column
 * @return {Object}  Coerced cell content
 */
export function coerceCellData(
	cellContent,
	cellValueAttr,
	currentColumnDataTypeObject,
	columnDataType
) {
	const currentColumnDataType = currentColumnDataTypeObject?.type || 'general';
	const dataTypeFormat = currentColumnDataTypeObject?.settings || '';

	let incompatibleDataTypes = false;
	let updatedCellContent = cellContent;
	let updatedCellValueAttr = cellValueAttr;

	switch (currentColumnDataType) {
		// Target Data Type
		case 'general':
			switch (columnDataType) {
				case 'checkbox':
					if (cellContent !== '') {
						updatedCellContent = cellContent === 1 || cellContent === true ? 'True' : 'False';
						updatedCellValueAttr = { indexText: updatedCellContent };
					} else {
						updatedCellContent = '';
						updatedCellValueAttr = { indexText: '' };
					}
					break;
				case 'number':
					break;
				case 'date-time':
					break;
				default:
					incompatibleDataTypes = true;
					break;
			}
			break;
		case 'number':
			switch (columnDataType) {
				case 'general':
					const convertedNumber = coerceNumberFromGeneral(cellContent, dataTypeFormat);
					if (!convertedNumber) {
						incompatibleDataTypes = true;
						break;
					}
					updatedCellContent = convertedNumber;
					updatedCellValueAttr = { indexText: convertedNumber };
					break;
				default:
					incompatibleDataTypes = true;
					break;
			}
			break;
		case 'date-time':
			switch (columnDataType) {
				case 'general':
					const convertedDate = coerceDateTimeFromGeneral(cellContent, dataTypeFormat);
					if (!convertedDate) {
						incompatibleDataTypes = true;
						break;
					}
					updatedCellContent = convertedDate;
					updatedCellValueAttr = { indexText: convertedDate };
					break;
				default:
					incompatibleDataTypes = true;
					break;
			}
			break;
		case 'checkbox':
			switch (columnDataType) {
				case 'general':
					if (cellContent.toLocaleLowerCase() === 'true' || Number(cellContent) === 1) {
						updatedCellContent = 1;
						updatedCellValueAttr = { indexText: true };
					} else if (cellContent.toLocaleLowerCase() === 'false' || Number(cellContent) === 0) {
						updatedCellContent = 0;
						updatedCellValueAttr = { indexText: false };
					} else {
						incompatibleDataTypes = true;
					}
					break;
				default:
					incompatibleDataTypes = true;
					break;
			}
			break;
		case 'link':
			switch (columnDataType) {
				case 'general':
					incompatibleDataTypes = true;
					break;
				default:
					incompatibleDataTypes = true;
					break;
			}
			break;
		default:
			incompatibleDataTypes = true;
			break;
	}

	return {
		incompatibleDataTypes,
		updatedCellContent,
		updatedCellValueAttr,
	};
}

/**
 * Coerce general text to a number if possible, otherwise return false
 *
 * @since 1.4.9
 *
 * @param {string} cellContent    Value of the cell content to be copied
 * @param {Object} dataTypeFormat Column data settings
 * @return {string|false}         The coerced number or false if conversion is not possible
 */
function coerceNumberFromGeneral(cellContent, dataTypeFormat) {
	const dataFormat = dataTypeFormat?.format;
	const sanitizedNumber = sanitizeNumberInput(
		cellContent,
		dataFormat === 'percent' ? 'number' : dataFormat
	);
	const isValidNumber = isNaN(Number(sanitizedNumber)) ? false : true;

	if (!isValidNumber) {
		return false;
	}

	let nextRawValue = sanitizedNumber;
	let revisedDecimalPlaces = dataTypeFormat?.formatOptions?.decimalPlaces ?? 0;

	if (dataFormat === 'percent') {
		const [integerPart, fractionPart = ''] = sanitizedNumber.split('.');
		const nextEntryValue =
			fractionPart.length > revisedDecimalPlaces
				? `${integerPart}.${fractionPart.slice(0, revisedDecimalPlaces)}`
				: sanitizedNumber;

		revisedDecimalPlaces += 2;
		nextRawValue = fromPercentEntryValue(nextEntryValue);
	}

	return nextRawValue;
}

/**
 * Coerce general text to a number if possible, otherwise return false
 *
 * @since 1.4.9
 *
 * @param {string} cellContent    Value of the cell content to be copied
 * @param {Object} dataTypeFormat Column data settings
 * @return {string|false}         The coerced number or false if conversion is not possible
 */
function coerceDateTimeFromGeneral(cellContent, dataTypeFormat) {
	// Valid values: date | time | datetime-local
	const format = dataTypeFormat?.format;

	const validMonthsSpelled = {
		January: 1,
		Jan: 1,
		February: 2,
		Feb: 2,
		March: 3,
		Mar: 3,
		April: 4,
		Apr: 4,
		May: 5,
		June: 6,
		Jun: 6,
		July: 7,
		Jul: 7,
		August: 8,
		Aug: 8,
		September: 9,
		Sep: 9,
		Sept: 9,
		October: 10,
		Oct: 10,
		November: 11,
		Nov: 11,
		December: 12,
		Dec: 12,
	};

	const validDelimiters = {
		'-': '-',
		'/': '-',
		'.': '-',
	};
	const validTimeDelimiters = {
		':': ':',
		'.': ':',
	};

	// const normalizedDateTime = 'calculate date based on matching replacements and regular expression';

	const normalizedCellContent = htmlToIndexText(String(cellContent ?? ''))
		.replace(/[^\dA-Za-z:./\-\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	if (!normalizedCellContent) {
		return false;
	}

	// Preserve already-valid values, including their existing canonical format.
	const existingRawDateTime = formattedIsoDate(normalizedCellContent, format);
	if (existingRawDateTime) {
		return existingRawDateTime;
	}

	const escapeForCharacterClass = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const dateDelimiterPattern = Object.keys(validDelimiters).map(escapeForCharacterClass).join('');
	const timeDelimiterPattern = Object.keys(validTimeDelimiters)
		.map(escapeForCharacterClass)
		.join('');
	const monthNamePattern = Object.keys(validMonthsSpelled)
		.sort((first, second) => second.length - first.length)
		.join('|');

	/*
	 * A four-digit leading value is treated as ISO year-month-day. Otherwise,
	 * ambiguous pairs are month/day; values greater than 12 identify a day.
	 */
	const numericDatePattern = new RegExp(
		`\\b(?:` +
			`\\d{4}\\s*[${dateDelimiterPattern}]\\s*\\d{1,2}\\s*[${dateDelimiterPattern}]\\s*\\d{1,2}` +
			`|\\d{1,2}\\s*[${dateDelimiterPattern}]\\s*\\d{1,2}` +
			`(?:\\s*[${dateDelimiterPattern}]\\s*(?:\\d{2}|\\d{4}))?` +
			`)\\b`
	);
	const monthFirstDatePattern = new RegExp(
		`\\b(${monthNamePattern})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?` + `(?:\\s+(\\d{2}|\\d{4}))?\\b`,
		'i'
	);
	const dayFirstDatePattern = new RegExp(
		`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNamePattern})\\.?` + `(?:\\s+(\\d{2}|\\d{4}))?\\b`,
		'i'
	);
	const monthFirstShortYearTimePattern = new RegExp(
		`\\b((${monthNamePattern})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?)` +
			`\\s+(\\d{2})(?=\\s*[${timeDelimiterPattern}]\\s*\\d{1,2}\\b)`,
		'i'
	);
	const dayFirstShortYearTimePattern = new RegExp(
		`\\b((\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNamePattern})\\.?)` +
			`\\s+(\\d{2})(?=\\s*[${timeDelimiterPattern}]\\s*\\d{1,2}\\b)`,
		'i'
	);
	const timePattern = new RegExp(
		`(?:^|\\s)(\\d{1,2})` +
			`(?:\\s*([${timeDelimiterPattern}])\\s*(\\d{1,2}))?` +
			`(?:\\s*\\2\\s*(\\d{1,2}))?` +
			`\\s*(a\\.?m\\.?|p\\.?m\\.?)?\\b`,
		'i'
	);

	const normalizedYear = year => {
		if (!year) {
			return new Date().getFullYear();
		}

		const numericYear = Number(year);
		if (String(year).length === 4) {
			return numericYear;
		}

		return numericYear <= TWO_DIGIT_YEAR_CURRENT_CENTURY_END
			? TWO_DIGIT_YEAR_CURRENT_CENTURY + numericYear
			: TWO_DIGIT_YEAR_PREVIOUS_CENTURY + numericYear;
	};

	const padDateTimePart = value => String(value).padStart(2, '0');
	const normalizedMonthNumber = monthName => {
		const monthKey = Object.keys(validMonthsSpelled).find(
			key => key.toLowerCase() === monthName.toLowerCase()
		);
		return validMonthsSpelled[monthKey];
	};
	const createDateValue = (year, month, day) =>
		`${normalizedYear(year)}-${padDateTimePart(month)}-${padDateTimePart(day)}`;

	let normalizedDate = '';
	let matchedDateText = '';
	const numericDateMatch = numericDatePattern.exec(normalizedCellContent);

	/*
	 * Do not interpret "1.30 pm" as a numeric date. It is a time using an
	 * allowed time delimiter.
	 */
	const numericDateIsTime =
		numericDateMatch &&
		/^\s*(?:a\.?m\.?|p\.?m\.?)\b/i.test(
			normalizedCellContent.slice(numericDateMatch.index + numericDateMatch[0].length)
		);

	if (numericDateMatch && !numericDateIsTime) {
		// Process yyyymmdd and mmddyyy date patterns
		const numericDateParts = numericDateMatch[0]
			.replace(
				new RegExp(`[${dateDelimiterPattern}]`, 'g'),
				delimiter => validDelimiters[delimiter]
			)
			.split('-')
			.map(value => value.trim());

		let year;
		let month;
		let day;

		if (numericDateParts[0].length === 4) {
			[year, month, day] = numericDateParts;
		} else {
			const [first, second, suppliedYear] = numericDateParts;

			if (Number(first) > 12 && Number(second) <= 12) {
				[day, month] = [first, second];
			} else {
				[month, day] = [first, second];
			}

			year = suppliedYear;
		}

		normalizedDate = createDateValue(year, month, day);
		matchedDateText = numericDateMatch[0];
	} else {
		const monthFirstShortYearTimeMatch = monthFirstShortYearTimePattern.exec(normalizedCellContent);
		const dayFirstShortYearTimeMatch = dayFirstShortYearTimePattern.exec(normalizedCellContent);
		const monthFirstDateMatch = monthFirstDatePattern.exec(normalizedCellContent);
		const dayFirstDateMatch = dayFirstDatePattern.exec(normalizedCellContent);

		if (monthFirstShortYearTimeMatch) {
			normalizedDate = createDateValue(
				monthFirstShortYearTimeMatch[4],
				normalizedMonthNumber(monthFirstShortYearTimeMatch[2]),
				monthFirstShortYearTimeMatch[3]
			);
			matchedDateText = monthFirstShortYearTimeMatch[1];
		} else if (dayFirstShortYearTimeMatch) {
			normalizedDate = createDateValue(
				dayFirstShortYearTimeMatch[4],
				normalizedMonthNumber(dayFirstShortYearTimeMatch[3]),
				dayFirstShortYearTimeMatch[2]
			);
			matchedDateText = dayFirstShortYearTimeMatch[1];
		} else if (monthFirstDateMatch) {
			normalizedDate = createDateValue(
				monthFirstDateMatch[3],
				normalizedMonthNumber(monthFirstDateMatch[1]),
				monthFirstDateMatch[2]
			);
			matchedDateText = monthFirstDateMatch[0];
		} else if (dayFirstDateMatch) {
			// Process spelled month in second position (ddmmyyyy) date pattern
			normalizedDate = createDateValue(
				dayFirstDateMatch[3],
				normalizedMonthNumber(dayFirstDateMatch[2]),
				dayFirstDateMatch[1]
			);
			matchedDateText = dayFirstDateMatch[0];
		}
	}

	const timeSource = matchedDateText
		? normalizedCellContent.replace(matchedDateText, ' ')
		: normalizedCellContent;
	const timeMatch = timePattern.exec(timeSource);
	let normalizedTime = '';

	if (timeMatch) {
		let hour = Number(timeMatch[1]);
		const minute = Number(timeMatch[3] ?? 0);
		const second = timeMatch[4] === undefined ? null : Number(timeMatch[4]);
		const meridiem = timeMatch[5]?.replace(/\./g, '').toLowerCase();

		if (meridiem) {
			if (hour < 1 || hour > 12) {
				return false;
			}

			hour = (hour % 12) + (meridiem === 'pm' ? 12 : 0);
		}

		const timeDelimiter = validTimeDelimiters[timeMatch[2]] || ':';
		normalizedTime = `${padDateTimePart(hour)}${timeDelimiter}${padDateTimePart(minute)}`;

		if (second !== null) {
			normalizedTime += `${timeDelimiter}${padDateTimePart(second)}`;
		}
	}

	let normalizedDateTime = '';

	if (format === 'date') {
		normalizedDateTime = normalizedDate;
	} else if (format === 'time') {
		normalizedDateTime = normalizedTime;
	} else if (normalizedDate) {
		normalizedDateTime = `${normalizedDate}T${normalizedTime || '00:00'}`;
	}

	if (!normalizedDateTime) {
		return false;
	}

	const rawDateTime = formattedIsoDate(normalizedDateTime, format);

	if (rawDateTime === '') {
		return false;
	}

	return rawDateTime;
}
