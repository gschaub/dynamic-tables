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
		console.log('Return Time from ' + date);

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
		if (!isValidISODate(date) && !isValidISODatetime(date) && !isValidTime(date)) {
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
