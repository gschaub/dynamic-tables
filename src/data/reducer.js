import TYPES from "./action-types";
import {
    numberToLetter,
    updateArray,
    tableSort
} from '../utils';

const {
    CREATE_TABLE,
    INSERT_COLUMN,
    INSERT_ROW,
    DELETE_TABLE,
    DELETE_COLUMN,
    DELETE_ROW,
    UPDATE_TABLE_PROP,
    REMOVE_TABLE_PROP,
    UPDATE_ROW,
    UPDATE_COLUMN,
    UPDATE_CELL,
    RECEIVE_HYDRATE,
    RECEIVE_HYDRATE_TEST,
    PERSIST,
    PROCESS_BORDERS
} = TYPES;

const table = (
    state = {
        table: {}
    },

    action) => {

    console.log('      Reducer. state: ' + JSON.stringify(state));
    console.log('      Reducer. type: ' + action.type);

    switch (action.type) {
        case CREATE_TABLE:
            console.log('In Reducer CREATE_TABLE')
            console.log(action.table)

            return {
                table: {
                    ...action.table
                }
            }

        case UPDATE_TABLE_PROP:
            console.log('In Reducer UPDATE_TABLE_PROP')
            const updatedTable = {
                ...state,
                [action.attribute]: action.value
            }
            console.log(updatedTable)

            return {
                table: updatedTable
            }

        case REMOVE_TABLE_PROP:
            const tablePropRemoved = { ...state }
            // const removedAttribute = action.attribute
            delete tablePropRemoved[action.attribute]

            return {
                table: tablePropRemoved
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
            return returnedTableNewColumn;

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
            return returnedTableNewColumn;

        case DELETE_ROW:
            return state

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
            console.log(state)
            console.log(newCellsState)
            let updatedCellData = JSON.parse('{ "' + action.attribute + '" : "' + action.value + '"}')
            let updatedCells = updateArray(newCellsState.cells, 'cell_id', action.cellId, updatedCellData)

            let returnedCellState =
            {
                ...state,
                rows: [...newCellsState.rows],
                columns: [...newCellsState.columns],
                cells: [...updatedCells]
            }
            console.log(returnedCellState)
            return {
                table: returnedCellState
            }

        case PROCESS_BORDERS:
            console.log('In Reducer PROCESS_BORDERS')
            const newBaseTableState = { ...state }

            let returnedBorderState =
            {
                ...newBaseTableState,
                rows: [...action.rows],
                columns: [...action.columns],
                cells: [...action.cells]
            }

            console.log(newBaseTableState)
            console.log(returnedBorderState)

            return {
                table: returnedBorderState
            }

        case RECEIVE_HYDRATE:
            console.log('RECEIVE_HYDATE...')
            console.log(state);
            console.log(action.table);

            return {
                table: {
                    ...state.table,
                    ...action.table
                }
            }

        default:
            return state;
    }
};

const reducer = (
    state = {
        tables: {}
    },
    action) => {
    // console.log('MAIN REDUCER')
    // console.log(state)
    // console.log('  Action Table ID = ' + action.tableId)
    // console.log(action)

    let tableKey = action.tableId
    console.log(state.tables[tableKey])
    let newTableState = table(state.tables[tableKey], action)
    let returnedTable =
    {
        [action.tableId]:
            newTableState.table
    }

    if (JSON.stringify(newTableState.table) === '{}') {
        return state
    }
    console.log(returnedTable)

    let newTablesState = { ...state.tables }
    let newTablesStateKeys = Object.keys(state.tables)
    if (action.type === 'UPDATE_TABLE_PROP' && action.attribute === 'table_id') {
        newTablesState = Object.keys(state.tables)
            .filter((key) =>
                state.tables[key] !== '0'
            )
    }

    if (action.type === 'DELETE_TABLE') {
        console.log('DELETE_TABLE...')

        const deleteTablesState = Object.keys(state.tables)
            .reduce((acc, key) => {
                console.log('Reducer key = ' + key)
                console.log('TableId to delete = ' + String(action.tableId))
                console.log(acc)
                if (key !== String(action.tableId)) {
                    acc[key] = {
                        [key]: {
                            ...state.tables[key],
                            rows: [...state.tables[key].rows],
                            columns: [...state.tables[key].columns],
                            cells: [...state.tables[key].cells],
                        }
                    }
                }
                return acc
            }, {})

        console.log(deleteTablesState)
    }

    if (action.type === 'PERSIST') {
        console.log('PERSIST...')
        // console.log('...Deleted table key = ' + JSON.stringify(newTablesState, null, 4))

    }

    return {
        tables: {
            ...state.tables,
            ...returnedTable
        }
    }
}

export default reducer;
