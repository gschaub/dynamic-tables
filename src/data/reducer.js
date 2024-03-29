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
    CHANGE_TABLE_ID,
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

        case CHANGE_TABLE_ID:
            console.log('In Reducer UPDATE_TABLE_PROP')
            const newTableIdState = { ...state }
            var rowsWithNewId = []
            var columnsWithNewId = []
            var cellsWithNewId = []

            newTableIdState.rows.foreach((row) => {
                let newRow = {
                    ...row,
                    table_id: action.newTableId,
                }
                rowsWithNewId.push(newRow)
            })

            newTableIdState.columns.foreach((column) => {
                let newColumn = {
                    ...column,
                    table_id: action.newTableId,
                }
                columnsWithNewId.push(newColumn)
            })

            newTableIdState.cells.foreach((cell) => {
                let newCell = {
                    ...cell,
                    table_id: action.newTableId,
                }
                cellsWithNewId.push(newCellRow)
            })

            const updatedTableId = {
                ...state,
                table_id: action.newTableId,
                rows: [...rowsWithNewId],
                columns: [...columnsWithNewId],
                cells: [...cellsWithNewId]
            }
            console.log(updatedTableId)

            return {
                table: updatedTableId
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
            let insertColumnState = { ...state }

            /**
             * Insert new column and update existing column_id's
             */
            var columnsWithNewId = []
            insertColumnState.columns.forEach((column) => {
                if (Number(column.column_id) < Number(action.columnId)) {
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
                    let cellContent = Number(cell.row_id) == 0 ? columnLetter : cell.content
                    let newCell = {
                        table_id: cell.table_id,
                        column_id: newColumnId,
                        row_id: cell.row_id,
                        cell_id: columnLetter + cell.row_id,
                        attributes: cell.attributes,
                        classes: cell.classes,
                        content: cellContent
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
            console.log('In Reducer INSERT_ROW')
            let insertRowState = { ...state }

            /**
             * Insert new row and update existing row_id's
             */
            var rowsWithNewId = []
            insertRowState.rows.forEach((row) => {
                if (Number(row.row_id) < Number(action.rowId)) {
                    rowsWithNewId.push(row)
                } else {
                    let newRow = {
                        table_id: row.table_id,
                        row_id: String(Number(row.row_id) + 1),
                        attributes: row.attributes,
                        classes: row.classes
                    }
                    rowsWithNewId.push(newRow)
                }
            })
            rowsWithNewId.push(action.newRow)
            console.log(rowsWithNewId)

            var sortedRows = tableSort('rows', rowsWithNewId)
            console.log(sortedRows)

            /**
             * Insert new cells and update existing column_id's
             */
            var cellsWithNewId = []
            insertRowState.cells.forEach((cell) => {
                console.log(cell)
                if (Number(cell.row_id) < Number(action.rowId)) {
                    cellsWithNewId.push(cell)
                } else {

                    let newRowId = String(Number(cell.row_id) + 1)
                    let columnLetter = cell.column_id == '0' ? '0' : numberToLetter(cell.column_id)
                    let cellContent = Number(cell.column_id) == 0 ? newRowId : cell.content
                    let newCell = {
                        table_id: cell.table_id,
                        column_id: cell.column_id,
                        row_id: newRowId,
                        cell_id: columnLetter + newRowId,
                        attributes: cell.attributes,
                        classes: cell.classes,
                        content: cellContent
                    }
                    cellsWithNewId.push(newCell)
                }
            })

            var allNewRowCells = [...cellsWithNewId, ...action.rowCells]
            var sortedCells = tableSort('cells', allNewRowCells)

            var returnedTableNewRow =
            {
                ...insertRowState,
                rows: [...sortedRows],
                columns: [...insertRowState.columns],
                cells: [...sortedCells]
            }

            return {
                table: returnedTableNewRow
            }

        case DELETE_COLUMN:
            console.log('In Reducer DELETE_COLUMN')
            let deleteColumnState = { ...state }

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
                    let cellContent = Number(cell.row_id) == 0 ? columnLetter : cell.content
                    let newCell = {
                        table_id: cell.table_id,
                        column_id: newColumnId,
                        row_id: cell.row_id,
                        cell_id: columnLetter + cell.row_id,
                        attributes: cell.attributes,
                        classes: cell.classes,
                        content: cellContent
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
            console.log('In Reducer DELETE_COLUMN')
            let deleteRowState = { ...state }

            /**
             * Delete new column and update existing column_id's
             */
            var rowsWithNewId = []
            console.log(deleteRowState)
            deleteRowState.rows.forEach((row) => {
                if (row.row_id < action.rowId) {
                    rowsWithNewId.push(row)
                } else if (row.row_id > action.rowId) {
                    let newRow = {
                        table_id: row.table_id,
                        row_id: String(Number(row.row_id) - 1),
                        attributes: row.attributes,
                        classes: row.classes
                    }
                    rowsWithNewId.push(newRow)
                }
            })
            // rowsWithNewId.push(action.newColumn)
            // var sortedRows= tableSort('rows', rowsWithNewId)

            /**
             * Delete new cells and update existing row_id's
             */
            var cellsWithNewId = []
            console.log(deleteRowState.cells)
            deleteRowState.cells.forEach((cell) => {
                if (cell.row_id < action.rowId) {
                    cellsWithNewId.push(cell)
                } else if (cell.row_id > action.rowId) {
                    let newRowId = String(Number(cell.row_id) - 1)
                    let columnLetter = cell.column_id == '0' ? '0' : numberToLetter(cell.column_id)
                    let cellContent = Number(cell.column_id) == 0 ? newRowId : cell.content
                    let newCell = {
                        table_id: cell.table_id,
                        column_id: cell.column_id,
                        row_id: newRowId,
                        cell_id: columnLetter + cell.row_id,
                        attributes: cell.attributes,
                        classes: cell.classes,
                        content: cellContent
                    }
                    cellsWithNewId.push(newCell)
                }
            })

            // var allNewColumnCells = [...cellsWithNewId, ...action.columnCells]
            // var sortedCells = tableSort('cells', allNewColumnCells)

            var returnedTableNewRow =
            {
                ...deleteRowState,
                rows: [...rowsWithNewId],
                columns: [...deleteRowState.columns],
                cells: [...cellsWithNewId]
            }

            console.log(returnedTableNewRow)

            return {
                table: returnedTableNewRow
            }

        case UPDATE_ROW:
            console.log('In Reducer UPDATE_COLUMN')
            let newRowsState = { ...state }
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
            let newColumnsState = { ...state }
            let updatedColumnData = JSON.parse('{ "' + action.attribute + '" :' + transformedValue + '}')
            console.log(newColumnsState);
            console.log(newColumnsState.columns);
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
                rows: tableSort('rows', [...action.rows]),
                columns: tableSort('columns', [...action.columns]),
                cells: tableSort('cells', [...action.cells])
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
    console.log('MAIN REDUCER')
    console.log(state)
    console.log('  Action Table ID = ' + action.tableId)
    console.log(action)

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

    const newTablesState = { ...state.tables }
    // let newTablesStateKeys = Object.keys(state.tables)

    switch (action.type) {
        case CHANGE_TABLE_ID:
            console.log('In Reducer CHANGE_TABLE_ID for state')

            const returnedTableNewId =
            {
                [action.newTableId]:
                    newTableState.table
            }
            console.log(returnedTableNewId)

            const filteredTablesState = Object.keys(state.tables)
                .reduce((acc, key) => {
                    console.log(state.tables[key])
                    if (state.tables[key].table_id !== action.tableId) {
                        acc[key] = { ...state.tables[key] }
                    }
                    return acc
                }, {})
            // const filteredTablesState = Object.keys(state.tables)
            // .filter((key) =>
            //     state.tables[key] !== '0'
            // )
            console.log(filteredTablesState)

            return {
                tables: {
                    ...filteredTablesState,
                    ...returnedTableNewId
                }
            }

        case DELETE_TABLE:
            console.log('In Reducer DELETE_TABLE...')

            const deleteTablesState = Object.keys(state.tables)
                .reduce((acc, key) => {
                    console.log('Reducer key = ' + key)
                    console.log('TableId to delete = ' + String(action.tableId))
                    console.log(acc)
                    if (key !== String(action.tableId)) {
                        acc[key] = {
                            ...state.tables[key],
                            rows: [...state.tables[key].rows],
                            columns: [...state.tables[key].columns],
                            cells: [...state.tables[key].cells],
                        }
                    }
                    return acc
                }, {})

            console.log(deleteTablesState)
            return {
                tables: {
                    ...deleteTablesState
                }
            }

        default:
            console.log('In Reducer Default State Handling')
            const returnedTableDefault =
            {
                [action.tableId]:
                    newTableState.table
            }

            return {
                tables: {
                    ...newTablesState,
                    ...returnedTableDefault
                }
            }
    }



    // if (action.type === 'UPDATE_TABLE_PROP' && action.attribute === 'table_id') {
    //     newTablesState = Object.keys(state.tables)
    //         .filter((key) =>
    //             state.tables[key] !== '0'
    //         )
    // }

    // if (action.type === 'DELETE_TABLE') {
    //     console.log('DELETE_TABLE...')

    //     const deleteTablesState = Object.keys(state.tables)
    //         .reduce((acc, key) => {
    //             console.log('Reducer key = ' + key)
    //             console.log('TableId to delete = ' + String(action.tableId))
    //             console.log(acc)
    //             if (key !== String(action.tableId)) {
    //                 acc[key] = {
    //                     ...state.tables[key],
    //                     rows: [...state.tables[key].rows],
    //                     columns: [...state.tables[key].columns],
    //                     cells: [...state.tables[key].cells],
    //                 }
    //             }
    //             return acc
    //         }, {})

    //     console.log(deleteTablesState)
    //     return {
    //         tables: {
    //             ...deleteTablesState
    //         }
    //     }
    // }

    // if (action.type === 'PERSIST') {
    //     console.log('PERSIST...')
    // console.log('...Deleted table key = ' + JSON.stringify(newTablesState, null, 4))

    // }
}

export default reducer;
