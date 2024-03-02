export function getTable(state, id) {
console.log('In GetTable')
    return state.table
}



// export const getTable = (state, id) => {
//     console.log('   In Selector');
//     const table = state;
//     console.log(state);
//     return state.table;
//     //       return state.find(table => table.id === id)
// };
