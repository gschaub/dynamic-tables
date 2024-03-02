import TYPES from "./action-types";
import {
    numberToLetter,
    updateArray,
    tableSort
} from '../../utils';

const {
    CREATE,
    INSERT_COLUMN,
    INSERT_ROW,
    DELETE,
    DELETE_COLUMN,
    DELETE_ROW,
    UPDATE_TABLE_PROP,
    UPDATE_ROW,
    UPDATE_COLUMN,
    UPDATE_CELL,
    RECEIVE_HYDRATE,
    RECEIVE_HYDRATE_TEST,
    PROCESS_BORDERS
} = TYPES;

const reducer = (
    state = {
        table: {
            table_id: '',
            post_id: '',
            table_name: '',
            table_classes: '',
            rows: [],
            columns: [],
            cells: []

        }
    },
    action) => {

    console.log('      Reducer. state: ' + JSON.stringify(state));
    console.log(state);
    console.log('      Reducer. type: ' + action.type);
    switch (action.type) {
        case CREATE:
            return action.table;

        case UPDATE_TABLE_PROP:
            console.log('In Reducer UPDATE_TABLE_PROP')
            return {
                ...state.table,
                [action.attribute]: action.value
            }


        case INSERT_COLUMN:

            console.log('In Reducer INSERT_COLUMN')
            let insertColumnState = { ...state.table }

            /**
             * Insert new column and update existing column_id's
             */
            var columnsWithNewId = []
            insertColumnState.columns.forEach((column) => {
                if (column.column_id < action.columnId) {
                    columnsWithNewId.push(column)
                } else {
                    let newColumn = {
                        table_id: column.table_id,
                        column_id: String(Number(column.column_id) + 1),
                        column_name: column.column_name,
                        attributes: column.attributes,
                        classes: column.classes
                    }
                    columnsWithNewId.push(newColumn)
                }
            })
            columnsWithNewId.push(action.newColumn)
            var sortedColumns = tableSort('columns', columnsWithNewId)

            /**
             * Insert new cells and update existing column_id's
             */
            var cellsWithNewId = []
            insertColumnState.cells.forEach((cell) => {
                if (cell.column_id < action.columnId) {
                    cellsWithNewId.push(cell)
                } else {

                    let newColumnId = String(Number(cell.column_id) + 1)
                    let columnLetter = numberToLetter(newColumnId)
                    let newCell = {
                        table_id: cell.table_id,
                        column_id: newColumnId,
                        row_id: cell.row_id,
                        cell_id: columnLetter + cell.row_id,
                        attributes: cell.attributes,
                        classes: cell.classes,
                        content: cell.content
                    }
                    cellsWithNewId.push(newCell)
                }
            })

            var allNewColumnCells = [...cellsWithNewId, ...action.columnCells]
            var sortedCells = tableSort('cells', allNewColumnCells)

            var returnedTableNewColumn =
            {
                ...insertColumnState,
                rows: [...insertColumnState.rows],
                columns: [...sortedColumns],
                cells: [...sortedCells]
            }

            console.log(returnedTableNewColumn)
            return {
                table: returnedTableNewColumn
            }

        case INSERT_ROW:

        case DELETE_COLUMN:
            console.log('In Reducer DELETE_COLUMN')
            let deleteColumnState = { ...state.table }

            /**
             * Delete new column and update existing column_id's
             */
            var columnsWithNewId = []
            deleteColumnState.columns.forEach((column) => {
                if (column.column_id < action.columnId) {
                    columnsWithNewId.push(column)
                } else if (column.column_id > action.columnId) {
                    let newColumn = {
                        table_id: column.table_id,
                        column_id: String(Number(column.column_id) - 1),
                        column_name: column.column_name,
                        attributes: column.attributes,
                        classes: column.classes
                    }
                    columnsWithNewId.push(newColumn)
                }
            })
            // columnsWithNewId.push(action.newColumn)
            // var sortedColumns = tableSort('columns', columnsWithNewId)

            /**
             * Delete new cells and update existing column_id's
             */
            var cellsWithNewId = []
            deleteColumnState.cells.forEach((cell) => {
                if (cell.column_id < action.columnId) {
                    cellsWithNewId.push(cell)
                } else if (cell.column_id > action.columnId) {
                    let newColumnId = String(Number(cell.column_id) - 1)
                    let columnLetter = numberToLetter(newColumnId)
                    let newCell = {
                        table_id: cell.table_id,
                        column_id: newColumnId,
                        row_id: cell.row_id,
                        cell_id: columnLetter + cell.row_id,
                        attributes: cell.attributes,
                        classes: cell.classes,
                        content: cell.content
                    }
                    cellsWithNewId.push(newCell)
                }
            })

            // var allNewColumnCells = [...cellsWithNewId, ...action.columnCells]
            // var sortedCells = tableSort('cells', allNewColumnCells)

            var returnedTableNewColumn =
            {
                ...deleteColumnState,
                rows: [...deleteColumnState.rows],
                columns: [...columnsWithNewId],
                cells: [...cellsWithNewId]
            }

            console.log(returnedTableNewColumn)
            return {
                table: returnedTableNewColumn
            }
        case DELETE_ROW:

        case UPDATE_ROW:
            console.log('In Reducer UPDATE_COLUMN')
            let newRowsState = { ...state.table }
            let updatedRowData = JSON.parse('{ "' + action.attribute + '" : "' + action.value + '"}')
            let updatedRows = updateArray(newRowsState.rows, 'row_id', action.rowId, updatedRowData)

            var returnedUpdatedTableRow =
            {
                ...newRowsState,
                rows: [...updatedRows],
                columns: [...newRowsState.columns],
                cells: [...newRowsState.cells]
            }
            return {
                table: returnedUpdatedTableRow
            }

        case UPDATE_COLUMN:
            console.log('In Reducer UPDATE_COLUMN')

            let transformedValue = ' "' + action.value + '"';

            if (action.attribute === 'attributes') {
                transformedValue = JSON.stringify(action.value)
            }

            console.log(transformedValue)
            let newColumnsState = { ...state.table }
            let updatedColumnData = JSON.parse('{ "' + action.attribute + '" :' + transformedValue + '}')
            let updatedColumns = updateArray(newColumnsState.columns, 'column_id', action.columnId, updatedColumnData)

            console.log(updatedColumnData)
            console.log(updatedColumns)

            var returnedUpdatedTableColumn =
            {
                ...newColumnsState,
                rows: [...newColumnsState.rows],
                columns: [...updatedColumns],
                cells: [...newColumnsState.cells]
            }

            return {
                table: returnedUpdatedTableColumn
            }


        case UPDATE_CELL:
            console.log('In Reducer UPDATE_CELL')
            let newCellsState = { ...state }
            let updatedCellData = JSON.parse('{ "' + action.attribute + '" : "' + action.value + '"}')
            let updatedCells = updateArray(newCellsState.cells, 'cell_id', action.cellId, updatedCellData)

            let returnedCellState =
            {
                ...newCellsState,
                rows: [...newCellsState.rows],
                columns: [...newCellsState.columns],
                cells: [...updatedCells]
            }

            return {
                table: returnedCellState
            }

        case PROCESS_BORDERS:

            let newTableState = { ...state.table }

            let returnedBorderState =
            {
                ...newTableState,
                rows: [...action.rows],
                columns: [...action.columns],
                cells: [...action.cells]
            }

            return {
                table: returnedBorderState
            }

        case DELETE:
            return {
                table: state.table
            };

        case RECEIVE_HYDRATE:
            console.log('RECEIVE_HYDATE...')
            console.log(state);
            console.log(action.table);
            return {
                table: action.table
            }

        case RECEIVE_HYDRATE_TEST:
            console.log('RECEIVE_HYDATE TEST...')
            console.log(state);
            console.log(action.tableTable);
            //console.log(table);
            return {
                ...state,
                ...action.testTable
            }
        default:
            return state;
    }
};

export default reducer;


