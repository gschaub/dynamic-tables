/**
 * Convert a column number to a string of letters.
 *
 * @since    1.0.0
 *
 * @param {number} letterNumber Integer
 * @return  {string} Column letter
 */
export function numberToLetter(letterNumber) {
	const letterMap = [
		{ nbr: '1', letter: 'A' },
		{ nbr: '2', letter: 'B' },
		{ nbr: '3', letter: 'C' },
		{ nbr: '4', letter: 'D' },
		{ nbr: '5', letter: 'E' },
		{ nbr: '6', letter: 'F' },
		{ nbr: '7', letter: 'G' },
		{ nbr: '8', letter: 'H' },
		{ nbr: '9', letter: 'I' },
		{ nbr: 'a', letter: 'J' },
		{ nbr: 'b', letter: 'k' },
		{ nbr: 'c', letter: 'L' },
		{ nbr: 'd', letter: 'M' },
		{ nbr: 'e', letter: 'N' },
		{ nbr: 'f', letter: 'O' },
		{ nbr: 'g', letter: 'P' },
		{ nbr: 'h', letter: 'Q' },
		{ nbr: 'i', letter: 'R' },
		{ nbr: 'j', letter: 'S' },
		{ nbr: 'k', letter: 'T' },
		{ nbr: 'l', letter: 'U' },
		{ nbr: 'm', letter: 'V' },
		{ nbr: 'n', letter: 'W' },
		{ nbr: 'o', letter: 'X' },
		{ nbr: 'p', letter: 'Y' },
		{ nbr: 'q', letter: 'Z' },
	];

	if (letterNumber === 0) {
		return '0';
	}

	const letterLookup = letterNumber.toString(26).split('');
	let letterDigit = '';

	letterLookup.map(value => {
		letterDigit = letterDigit + letterMap.find(x => x.nbr === value).letter;
	});

	return letterDigit;
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
 * Strip any HTML tags.
 *
 * @param {string} str String to evaluate
 * @return  {string} String with any embedded tages removed
 * @since    1.0.0
 */
export function removeTags(str) {
	if (str === null || str === '') return false;
	str = str.toString();

	// Regular expression to identify HTML tags in
	// the input string. Replacing the identified
	// HTML tag with a null string.
	return str.replace(/(<([^>]+)>)/gi, '');
}
