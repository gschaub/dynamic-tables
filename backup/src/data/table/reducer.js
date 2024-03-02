import TYPES from "./action-types";

const { CREATE, UPDATE, DELETE, HYDRATE } = TYPES;

const reducer = (
    state = { table: [] },
    { table: table, tableId, type }) => {
    console.log('      Reducer. type: ' + type);
    switch (type) {
        case CREATE:
            return {
                table: state.table
            };
        case UPDATE:
            return {
                table: state.table
            };
        case DELETE:
            return {
                table: state.table
            };
        case HYDRATE:
            console.log('         Reducer Hydrate Called')
            return {
                table: table
            };
        default:
            return state;
    }
};

export default reducer;


