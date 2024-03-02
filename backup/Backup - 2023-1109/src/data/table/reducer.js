import TYPES from "./action-types";
import { updateArray } from '../../utils';

const { CREATE, PERSIST, PERSIST_TABLE_START, PERSIST_TABLE_FINISH, UPDATE_COLUMN, UPDATE_CELL, DELETE, RECEIVE_HYDRATE } = TYPES;

const reducer = (
    state = { table: {} },
    action) => {

    //=> {
    //state = { table: {} },
    // { table: id, control, columns, rows, cells, type }) => {

    console.log('      Reducer. state: ' + JSON.stringify(state));
    console.log('      Reducer. type: ' + action.type);
    switch (action.type) {
        case CREATE:
            return {
                table: state.table
            };

        case PERSIST_TABLE_START:
        case PERSIST_TABLE_FINISH:
            return {
                ...state,
                [action.id]: {
                    pending:
                        action.type === PERSIST_TABLE_START,
                    error: action.error,
                    //                    isAutosave: action.isAutosave,
                },
            };

        case PERSIST:
            console.log('Post Result...')
            console.log(action.putTable);

            return {
                ...state,
                restPut: {
                    ...action.putTable,
                }
            }

        case UPDATE_COLUMN:
            console.log('In Reducer UPDATE_COLUMN')
            let newColumnsState = { ...state }
            let updatedColumnData = JSON.parse('{ "' + action.attribute + '" : "' + action.value + '"}')
            let updatedColumns = updateArray(newState.cells, 'column_id', action.columnId, updatedColumnData)

            return {
                ...newColumnsState,
                columns: [...updatedColumns],
                cells: [...newColumnsState.columns]
            }
        case UPDATE_CELL:
            console.log('In Reducer UPDATE_CELL')
            let newCellsState = { ...state }
            let updatedCellData = JSON.parse('{ "' + action.attribute + '" : "' + action.value + '"}')
            let updatedCells = updateArray(newCellsState.cells, 'cell_id', action.cellId, updatedCellData)

            return {
                ...newCellsState,
                columns: [...newCellsState.columns],
                cells: [...updatedCells]
            }
        case DELETE:
            return {
                table: state.table
            };
        case RECEIVE_HYDRATE:
            console.log('RECEIVE_HYDATE...')
            console.log(state);
            console.log(action.table);
            //console.log(table);
            return action.table
        default:
            return state;
    }
};

export default reducer;


