/* External dependencies */
import { dateI18n } from '@wordpress/date';

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

/**
 * Convert a column number to a string of letters.
 *
 * @since    1.0.0
 * @since    1.1.0 Refactored
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
 * Update one attribute value inside the array.
 *
 * @since    1.0.0
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

/**
 * Sort table part array by the natural identifier assigned at design time.
 *
 * @since    1.0.0
 *
 * @param {string} tablePart  Table part to be sorted (columns | rows | cells)
 * @param {Array}  tableArray Array of all attributes of the table part being sorted
 * @return Sorted tableArray based on the ID of each object in the array
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
 * @since    1.0.0
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
 * @since    1.0.0
 * @since	 1.1.0 Moved from resolvers.js to utils.js
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
 * Set content for borders occuring in rows (integers) and columns (letters).
 *
 * @since    1.0.0
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
 * @since    1.0.0
 *
 * @param {boolean} columnMenuVisible Whether the column menu should be visible based on current state of processing
 * @param {number}  openColumnRow     The column id or row id that should be open
 * @param {number}  column_id         Current column id
 * @return  {boolean} Show the current column menu?
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
 * @since    1.0.0
 *
 * @param {boolean} rowMenuVisible Whether the row menu should be visible based on current state of processing
 * @param {number}  openColumnRow  The column id or row id that should be open
 * @param {number}  row_id         Current row id
 * @return  {boolean} Show the current row menu?
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
	// console.log('Consolidate to one columnDataType shape')
	// console.log('...Inbound Data Type', columnDataType)
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
 * @since 1.2
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

function isValidTime(value) {
	// 00:00 to 23:59, optional :ss (00-59)
	const m = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(value);
	return !!m;
}

/**
 * Test whether a data is formatted as a valid ISO date-time string
 *
 * @since 1.2
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
		// console.log('invalidly formatted date - ' + date);
		// console.log('Valid Date = ' + isValidISODate(date));
		// console.log('Valid Datetime = ' + isValidISODatetime(date));
		// console.log('Valid Time = ' + isValidTime(date));
		return '';
	}

	if (format === 'date') {
		// console.log('Return Date');
		return dateI18n('n/j/Y', date);
	}
	if (format === 'time') {
		// console.log('Return Time from ' + date);

		const [hh, mm] = date.split(':').map(Number);
		if (!Number.isInteger(hh) || !Number.isInteger(mm)) return '';

		const ampm = hh >= 12 ? 'pm' : 'am';
		const h12 = ((hh + 11) % 12) + 1;
		return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
	}
	if (format === 'datetime-local') {
		// console.log('Return Date/Time');
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

export function countCaretTokens(value, caretIndex) {
	return (value.slice(0, caretIndex).match(/[\d.-]/g) ?? []).length;
}

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

export function getFirstNumericIndex(value) {
	return value.search(/\d/);
}

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
 * @since    1.2.4
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

	// console.log('Replace brackets with minus sign');

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

export function toPercentEntryValue(rawValue) {
	return shiftDecimalString(rawValue, 2);
}

export function fromPercentEntryValue(rawValue) {
	return shiftDecimalString(rawValue, -2);
}

/**
 * Strip formatting characters from numeric display string
 *
 * @since    1.2.4
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
	// showCurrencySymbol = dataTypeFormat === 'currency',
	bracketNegative = false
) {
	// console.log('In Formatted Number');
	// console.log('...Number format = ', dataTypeFormat)
	const sanitizedNumber = sanitizeNumberInput(rawValue, dataTypeFormat);
	// console.log('...Sanitized number = ' + sanitizedNumber);

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

	// console.log('Thousands Separator = ' + thousandSeparator);

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

	// console.log('Formatted Option = ', formatOptions);
	const limitedFraction = fractionPart.slice(0, Math.max(0, revisedDecimalPlaces));
	// console.log('  Limited fraction =  ' + limitedFraction);
	const decimalFragment = hasDecimal ? `.${limitedFraction}` : '';
	// console.log('  Decimal fragment =  ' + decimalFragment);
	const rawNumberString = `${integerPart}${decimalFragment}`;
	// console.log('  Raw Number =  ' + rawNumberString);

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
