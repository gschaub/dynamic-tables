/* Internal dependencies */
import TYPES from './action-types';
import { numberToLetter, updateArray, tableSort } from '../utils';

const {
	CREATE_TABLE,
	INSERT_COLUMN,
	INSERT_ROW,
	DELETE_TABLE,
	DELETE_COLUMN,
	DELETE_ROW,
	CHANGE_TABLE_ID,
	UPDATE_TABLE_PROP,
	REMOVE_TABLE_PROP,
	UPDATE_ROW,
	UPDATE_COLUMN,
	UPDATE_CELL,
	RECEIVE_HYDRATE,
	PROCESS_BORDERS,
} = TYPES;

/**
 * Dynamic Table reducer helper for a single table.
 *
 * @since    1.0.0
 *
 * @param {Object} state  Current table
 * @param {Object} action Action activity to be performed
 * @return {Object} Updated table
 */
const table = (
	state = {
		table: {},
	},
	action
) => {
	console.log('      Reducer. state: ' + JSON.stringify(state));
	console.log('      Reducer. type: ' + action.type);

	switch (action.type) {
		case CREATE_TABLE:
			return {
				table: {
					...action.table,
				},
			};

		case CHANGE_TABLE_ID:
			console.log('In Reducer CHANGE_TABLE_ID');
			const newTableIdState = { ...state };
			const rowsWithNewId_ChangeId = [];
			const columnsWithNewId_ChangeId = [];
			const cellsWithNewId_ChangeId = [];

			console.log(newTableIdState.rows);
			newTableIdState.rows.forEach(row => {
				console.log(row);
				const newRow_ChangeId = {
					...row,
					table_id: action.newTableId,
				};
				rowsWithNewId_ChangeId.push(newRow_ChangeId);
			});

			newTableIdState.columns.forEach(column => {
				const newColumn_ChangeId = {
					...column,
					table_id: action.newTableId,
				};
				columnsWithNewId_ChangeId.push(newColumn_ChangeId);
			});

			newTableIdState.cells.forEach(cell => {
				const newCell_ChangeId = {
					...cell,
					table_id: action.newTableId,
				};
				cellsWithNewId_ChangeId.push(newCell_ChangeId);
			});

			const updatedTableId = {
				...state,
				table_id: action.newTableId,
				rows: [...rowsWithNewId_ChangeId],
				columns: [...columnsWithNewId_ChangeId],
				cells: [...cellsWithNewId_ChangeId],
			};
			console.log(updatedTableId);

			return {
				table: updatedTableId,
			};

		case UPDATE_TABLE_PROP:
			console.log('In Reducer UPDATE_TABLE_PROP');

			const updatedTable = {
				...state,
				[action.attribute]: action.value,
			};
			console.log(updatedTable);

			return {
				table: updatedTable,
			};

		case REMOVE_TABLE_PROP:
			const tablePropRemoved = { ...state };
			// const removedAttribute = action.attribute
			delete tablePropRemoved[action.attribute];

			return {
				table: tablePropRemoved,
			};

		case INSERT_COLUMN:
			console.log('In Reducer INSERT_COLUMN');
			const insertColumnState = { ...state };

			/**
			 * Insert new column and update existing column_id's
			 */
			const columnsWithNewId_InsertColumn = [];
			insertColumnState.columns.forEach(column => {
				if (Number(column.column_id) < Number(action.columnId)) {
					columnsWithNewId_InsertColumn.push(column);
				} else {
					const newColumn_InsertColumn = {
						table_id: column.table_id,
						column_id: String(Number(column.column_id) + 1),
						column_name: column.column_name,
						attributes: column.attributes,
						classes: column.classes,
					};
					columnsWithNewId_InsertColumn.push(newColumn_InsertColumn);
				}
			});
			columnsWithNewId_InsertColumn.push(action.newColumn);
			const sortedColumns_InsertColumn = tableSort('columns', columnsWithNewId_InsertColumn);

			/**
			 * Insert new cells and update existing column_id's
			 */
			const cellsWithNewId_InsertColumn = [];
			insertColumnState.cells.forEach(cell => {
				if (cell.column_id < action.columnId) {
					cellsWithNewId_InsertColumn.push(cell);
				} else {
					const newColumnId_InsertColumn = String(Number(cell.column_id) + 1);
					const columnLetter_InsertColumn = numberToLetter(newColumnId_InsertColumn);
					const cellContent_InsertColumn =
						Number(cell.row_id) == 0 ? columnLetter_InsertColumn : cell.content;
					const newCell_InsertColumn = {
						table_id: cell.table_id,
						column_id: newColumnId_InsertColumn,
						row_id: cell.row_id,
						cell_id: columnLetter_InsertColumn + cell.row_id,
						attributes: cell.attributes,
						classes: cell.classes,
						content: cellContent_InsertColumn,
					};
					cellsWithNewId_InsertColumn.push(newCell_InsertColumn);
				}
			});

			const allNewColumnCells_InsertColumn = [
				...cellsWithNewId_InsertColumn,
				...action.columnCells,
			];
			const sortedCells_InsertColumn = tableSort('cells', allNewColumnCells_InsertColumn);

			const returnedTableNewColumn_InsertColumn = {
				...insertColumnState,
				rows: [...insertColumnState.rows],
				columns: [...sortedColumns_InsertColumn],
				cells: [...sortedCells_InsertColumn],
			};

			console.log(returnedTableNewColumn_InsertColumn);

			return {
				table: returnedTableNewColumn_InsertColumn,
			};

		case INSERT_ROW:
			console.log('In Reducer INSERT_ROW');
			const insertRowState = { ...state };
			console.log(insertRowState);

			/**
			 * Insert new row and update existing row_id's
			 */
			const rowsWithNewId_InsertRow = [];
			insertRowState.rows.forEach(row => {
				if (Number(row.row_id) < Number(action.rowId)) {
					rowsWithNewId_InsertRow.push(row);
				} else {
					const newRow_InsertRow = {
						table_id: row.table_id,
						row_id: String(Number(row.row_id) + 1),
						attributes: row.attributes,
						classes: row.classes,
					};
					rowsWithNewId_InsertRow.push(newRow_InsertRow);
				}
			});
			rowsWithNewId_InsertRow.push(action.newRow);
			console.log(rowsWithNewId_InsertRow);

			const sortedRows = tableSort('rows', rowsWithNewId_InsertRow);
			console.log(sortedRows);

			/**
			 * Insert new cells and update existing column_id's
			 */
			const cellsWithNewId_InsertRow = [];
			insertRowState.cells.forEach(cell => {
				console.log(cell);
				if (Number(cell.row_id) < Number(action.rowId)) {
					cellsWithNewId_InsertRow.push(cell);
				} else {
					const newRowId_InsertRow = String(Number(cell.row_id) + 1);
					const columnLetter_InsertRow =
						cell.column_id == '0' ? '0' : numberToLetter(cell.column_id);
					const cellContent_InsertRow =
						Number(cell.column_id) == 0 ? newRowId_InsertRow : cell.content;
					const newCell_InsertRow = {
						table_id: cell.table_id,
						column_id: cell.column_id,
						row_id: newRowId_InsertRow,
						cell_id: columnLetter_InsertRow + newRowId_InsertRow,
						attributes: cell.attributes,
						classes: cell.classes,
						content: cellContent_InsertRow,
					};
					cellsWithNewId_InsertRow.push(newCell_InsertRow);
				}
			});

			const allNewRowCells = [...cellsWithNewId_InsertRow, ...action.rowCells];
			const sortedCells_InsertRow = tableSort('cells', allNewRowCells);

			const returnedTableNewRow_InsertRow = {
				...insertRowState,
				rows: [...sortedRows],
				columns: [...insertRowState.columns],
				cells: [...sortedCells_InsertRow],
			};

			return {
				table: returnedTableNewRow_InsertRow,
			};

		case DELETE_COLUMN:
			console.log('In Reducer DELETE_COLUMN');
			const deleteColumnState = { ...state };

			/**
			 * Delete new column and update existing column_id's
			 */
			const columnsWithNewId_DeleteColumn = [];
			deleteColumnState.columns.forEach(column => {
				if (Number(column.column_id) < Number(action.columnId)) {
					columnsWithNewId_DeleteColumn.push(column);
				} else if (Number(column.column_id) > Number(action.columnId)) {
					const newColumn_DeleteColumn = {
						table_id: column.table_id,
						column_id: String(Number(column.column_id) - 1),
						column_name: column.column_name,
						attributes: column.attributes,
						classes: column.classes,
					};
					columnsWithNewId_DeleteColumn.push(newColumn_DeleteColumn);
				}
			});

			/**
			 * Delete new cells and update existing column_id's
			 */
			const cellsWithNewId_DeleteColumn = [];
			deleteColumnState.cells.forEach(cell => {
				if (Number(cell.column_id) < Number(action.columnId)) {
					cellsWithNewId_DeleteColumn.push(cell);
				} else if (Number(cell.column_id) > Number(action.columnId)) {
					const newColumnId_DeleteColumn = String(Number(cell.column_id) - 1);
					const columnLetter_DeleteColumn = numberToLetter(newColumnId_DeleteColumn);
					const cellContent_DeleteColumn =
						Number(cell.row_id) == 0 ? columnLetter_DeleteColumn : cell.content;
					const newCell_DeleteColumn = {
						table_id: cell.table_id,
						column_id: newColumnId_DeleteColumn,
						row_id: cell.row_id,
						cell_id: columnLetter_DeleteColumn + cell.row_id,
						attributes: cell.attributes,
						classes: cell.classes,
						content: cellContent_DeleteColumn,
					};
					cellsWithNewId_DeleteColumn.push(newCell_DeleteColumn);
				}
			});

			const returnedTableNewColumn_DeleteColumn = {
				...deleteColumnState,
				rows: [...deleteColumnState.rows],
				columns: [...columnsWithNewId_DeleteColumn],
				cells: [...cellsWithNewId_DeleteColumn],
			};

			console.log(returnedTableNewColumn_DeleteColumn);

			return {
				table: returnedTableNewColumn_DeleteColumn,
			};

		case DELETE_ROW:
			console.log('In Reducer DELETE_ROW');
			const deleteRowState = { ...state };

			/**
			 * Delete new column and update existing column_id's
			 */
			const rowsWithNewId_DeleteRow = [];
			console.log(deleteRowState);
			deleteRowState.rows.forEach(row => {
				if (Number(row.row_id) < Number(action.rowId)) {
					rowsWithNewId_DeleteRow.push(row);
				} else if (Number(row.row_id) > Number(action.rowId)) {
					const newRow_DeleteRow = {
						table_id: row.table_id,
						row_id: String(Number(row.row_id) - 1),
						attributes: row.attributes,
						classes: row.classes,
					};
					rowsWithNewId_DeleteRow.push(newRow_DeleteRow);
				}
			});
			// rowsWithNewId_DeleteRow.push(action.newColumn)
			// var sortedRows= tableSort('rows', rowsWithNewId_DeleteRow)

			/**
			 * Delete new cells and update existing row_id's
			 */
			const cellsWithNewId_DeleteRow = [];
			console.log(deleteRowState.cells);
			deleteRowState.cells.forEach(cell => {
				if (Number(cell.row_id) < Number(action.rowId)) {
					cellsWithNewId_DeleteRow.push(cell);
				} else if (Number(cell.row_id) > Number(action.rowId)) {
					const newRowId_DeleteRow = String(Number(cell.row_id) - 1);
					const columnLetter_DeleteRow =
						cell.column_id == '0' ? '0' : numberToLetter(cell.column_id);
					const cellContent_DeleteRow =
						Number(cell.column_id) == 0 ? newRowId_DeleteRow : cell.content;
					const newCell_DeleteRow = {
						table_id: cell.table_id,
						column_id: cell.column_id,
						row_id: newRowId_DeleteRow,
						cell_id: columnLetter_DeleteRow + cell.row_id,
						attributes: cell.attributes,
						classes: cell.classes,
						content: cellContent_DeleteRow,
					};
					cellsWithNewId_DeleteRow.push(newCell_DeleteRow);
				}
			});

			// var allNewColumnCells = [...cellsWithNewId_DeleteRow, ...action.columnCells]
			// var sortedCells = tableSort('cells', allNewColumnCells)

			const returnedTableNewRow_DeleteRow = {
				...deleteRowState,
				rows: [...rowsWithNewId_DeleteRow],
				columns: [...deleteRowState.columns],
				cells: [...cellsWithNewId_DeleteRow],
			};

			console.log(returnedTableNewRow_DeleteRow);

			return {
				table: returnedTableNewRow_DeleteRow,
			};

		case UPDATE_ROW:
			console.log('In Reducer UPDATE_ROW');

			let transformedValue_UpdateRow = ' "' + action.value + '"';

			if (action.attribute === 'attributes') {
				transformedValue_UpdateRow = JSON.stringify(action.value);
			}
			console.log();

			const newRowsState = { ...state };
			const updatedRowData = JSON.parse(
				'{ "' + action.attribute + '" :' + transformedValue_UpdateRow + '}'
			);
			console.log(newRowsState);
			console.log(newRowsState.rows);
			const updatedRows = updateArray(newRowsState.rows, 'row_id', action.rowId, updatedRowData);

			console.log(updatedRowData);
			console.log(updatedRows);

			const returnedUpdatedTableRow = {
				...newRowsState,
				rows: [...updatedRows],
				columns: [...newRowsState.columns],
				cells: [...newRowsState.cells],
			};
			return {
				table: returnedUpdatedTableRow,
			};

		case UPDATE_COLUMN:
			console.log('In Reducer UPDATE_COLUMN');

			let transformedValue_UpdateColumn = ' "' + action.value + '"';

			if (action.attribute === 'attributes') {
				transformedValue_UpdateColumn = JSON.stringify(action.value);
			}

			console.log(transformedValue_UpdateColumn);
			const newColumnsState = { ...state };
			const updatedColumnData = JSON.parse(
				'{ "' + action.attribute + '" :' + transformedValue_UpdateColumn + '}'
			);
			console.log(newColumnsState);
			console.log(newColumnsState.columns);
			const updatedColumns = updateArray(
				newColumnsState.columns,
				'column_id',
				action.columnId,
				updatedColumnData
			);

			console.log(updatedColumnData);
			console.log(updatedColumns);

			const returnedUpdatedTableColumn = {
				...newColumnsState,
				rows: [...newColumnsState.rows],
				columns: [...updatedColumns],
				cells: [...newColumnsState.cells],
			};
			return {
				table: returnedUpdatedTableColumn,
			};

		case UPDATE_CELL:
			console.log('In Reducer UPDATE_CELL');
			const newCellsState = { ...state };
			console.log(state);
			console.log(newCellsState);
			const updatedCellData = JSON.parse('{ "' + action.attribute + '" : "' + action.value + '"}');
			const updatedCells = updateArray(
				newCellsState.cells,
				'cell_id',
				action.cellId,
				updatedCellData
			);

			const returnedCellState = {
				...state,
				rows: [...newCellsState.rows],
				columns: [...newCellsState.columns],
				cells: [...updatedCells],
			};
			console.log(returnedCellState);
			return {
				table: returnedCellState,
			};

		case PROCESS_BORDERS:
			console.log('In Reducer PROCESS_BORDERS');
			const newBaseTableState = { ...state };

			const returnedBorderState = {
				...newBaseTableState,
				rows: tableSort('rows', [...action.rows]),
				columns: tableSort('columns', [...action.columns]),
				cells: tableSort('cells', [...action.cells]),
			};

			console.log(newBaseTableState);
			console.log(returnedBorderState);

			return {
				table: returnedBorderState,
			};

		case RECEIVE_HYDRATE:
			console.log('RECEIVE_HYDATE...');
			console.log(state);
			console.log(action.table);

			return {
				table: {
					...state.table,
					...action.table,
				},
			};

		default:
			return state;
	}
};

/**
 * Main Dynamic Tables reducer for all tables in block.
 *
 * @since    1.0.0
 *
 * @param {Object} state  Current table state
 * @param {Object} action Dispatched option
 * @return  {Object} Updated state
 */
const reducer = (
	state = {
		tables: {},
	},
	action
) => {
	// console.log('MAIN REDUCER');
	// console.log(state);
	// console.log('  Action Table ID = ' + action.tableId);
	// console.log(action);

	const tableKey = action.tableId;
	// console.log(state.tables[tableKey]);

	// Updated state for the single table being acted upon
	const newTableState = table(state.tables[tableKey], action);
	// let returnedTable = {
	// 	[action.tableId]: newTableState.table,
	// };

	// Return original state if the updated table is empty
	if (JSON.stringify(newTableState.table) === '{}') {
		return state;
	}
	// console.log(returnedTable);

	const newTablesState = { ...state.tables };
	// let newTablesStateKeys = Object.keys(state.tables)

	switch (action.type) {
		case CHANGE_TABLE_ID:
			console.log('In Reducer CHANGE_TABLE_ID for state');

			const returnedTableNewId = {
				[action.newTableId]: newTableState.table,
			};
			console.log(returnedTableNewId);

			const filteredTablesState = Object.keys(state.tables).reduce((acc, key) => {
				console.log(state.tables[key]);
				if (state.tables[key].table_id !== action.tableId) {
					acc[key] = { ...state.tables[key] };
				}
				return acc;
			}, {});
			// const filteredTablesState = Object.keys(state.tables)
			// .filter((key) =>
			//     state.tables[key] !== '0'
			// )
			console.log(filteredTablesState);

			return {
				tables: {
					...filteredTablesState,
					...returnedTableNewId,
				},
			};

		case DELETE_TABLE:
			console.log('In Reducer DELETE_TABLE...');

			const deleteTablesState = Object.keys(state.tables).reduce((acc, key) => {
				console.log('Reducer key = ' + key);
				console.log('TableId to delete = ' + String(action.tableId));
				console.log(acc);
				if (key !== String(action.tableId)) {
					acc[key] = {
						...state.tables[key],
						rows: [...state.tables[key].rows],
						columns: [...state.tables[key].columns],
						cells: [...state.tables[key].cells],
					};
				}
				return acc;
			}, {});

			console.log(deleteTablesState);
			return {
				tables: {
					...deleteTablesState,
				},
			};

		default:
			console.log('In Reducer Default State Handling');
			const returnedTableDefault = {
				[action.tableId]: newTableState.table,
			};

			return {
				tables: {
					...newTablesState,
					...returnedTableDefault,
				},
			};
	}
};

export default reducer;
