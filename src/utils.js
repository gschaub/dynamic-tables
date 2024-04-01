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
        { nbr: 'q', letter: 'Z' }
    ]

    if (letterNumber === 0) {
        console.log('...In Letter = 0')

        return '0'
    }

    var letterLookup = letterNumber.toString(26).split('')
    let letterDigit = ''

    letterLookup.map((value) => {
        letterDigit = letterDigit + letterMap.find(x => x.nbr === value).letter
    })

    return (letterDigit)
}

export function updateArray(arrayIn, key, id, updatedData) {
    console.log('Update Array')
    console.log(arrayIn)
    console.log(key)
    console.log(id)
    console.log(updatedData)
    return arrayIn.map((item) =>
        item[key] === id ? { ...item, ...updatedData } : item
    )
}


export function tableSort(tablePart, tableArray) {

    console.log('SORTING TABLE')
    console.log('Table Part = ' + tablePart)
    console.log(tableArray)

    if (tablePart === 'rows') {
        console.log('...in Rows sort')
        var sortedRows = [...tableArray];
        sortedRows.sort((a, b) => {
            // console.log(number(a.row_id))
            // console.log(number([a.row_id]))
            if (Number([a.row_id]) < Number([b.row_id])) {
                return -1;
            } else {
                return 1;
            }
        })
        return sortedRows;
    }

    if (tablePart === 'columns') {
        console.log('...in Columns sort')
        var sortedColumns = [...tableArray];
        sortedColumns.sort((a, b) => {
            console.log(Number(a.column_id))
            if (Number([a.column_id]) < Number([b.column_id])) {
                return -1
            } else {
                return 1
            }
        })
        console.log(sortedColumns)
        return sortedColumns;
    }

    if (tablePart === 'cells') {
        console.log('...in Cells sort')
        var sortedCells = [...tableArray];
        sortedCells.sort((a, b) => {
            console.log([Number([a.row_id]), Number([a.column_id])])
            console.log([Number([b.row_id]), Number([b.column_id])])
            if (Number([a.row_id]) === Number([b.row_id])) {
                if (Number([a.column_id]) < Number([b.column_id])) {
                    return -1
                } else {
                    return 1
                }
            }

            if (Number([a.row_id]) < Number([b.row_id])) {
                return -1
            } else {
                return 1
            }

            // if ([Number([a.row_id]), Number([a.column_id])] < [Number([b.row_id]), Number([b.column_id])]) {
            //     return -1
            // } else {
            //     return 1
            // }
        })
        console.log(sortedCells)
        return sortedCells;
    }
    console.log('...NO SORT RETURNED')
}

export function generateBlockTableRef() {
    const timestamp = Date.now();
    return timestamp.toString(16);
}

export function initTable(newBlockTableRef, columnCount, rowCount) {

    console.log('FUNCTION - CREATE TABLE')
    console.log('InitialRows - ' + rowCount)
    console.log('InitialColumns - ' + columnCount)

    var tableCells = initTableCells(Number(columnCount), Number(rowCount))
    var rowArray = [];

    for (let i = 1; i <= rowCount; i++) {
        console.log('Row loop - ' + i)
        let row = getDefaultRow('0', i)
        // console.log('...looped row - ' + JSON.stringify(row, null, 4))
        rowArray.push(row)
        // console.log('...row array - ' + JSON.stringify(rowArray, null, 4))
    }

    var columnArray = [];

    for (let i = 1; i <= columnCount; i++) {
        console.log('Column loop - ' + i)
        let column = getDefaultColumn('0', i)
        // console.log('...looped column - ' + JSON.stringify(column, null, 4))
        columnArray.push(column)
        // console.log('...column array - ' + JSON.stringify(columnArray, null, 4))
    }

    const newTable = {
        table: {
            table_id: '0',
            block_table_ref: newBlockTableRef,
            post_id: '0',
            table_status: 'new',
            table_name: 'Test Table',
            table_attributes: getDefaultTableAttributes('table'),
            table_classes: getDefaultTableClasses('table'),
            rows: rowArray,
            columns: columnArray,
            cells: tableCells
        }
    }

    return newTable
}

export function initTableCells(init_num_columns, init_num_rows) {
    console.log(init_num_rows)
    var tableCells = []

    var x = 1
    var y = 1

    while (y <= init_num_rows) {
        while (x <= init_num_columns) {
            let columnLetter = numberToLetter(x)
            if (y == 1) {
                let cell = getDefaultCell('0', String(x), String(y))
                tableCells.push(cell)
            } else {
                let cell = getDefaultCell('0', String(x), String(y))
                tableCells.push(cell)
            }
            x++
        }
        var x = 1
        y++
    }

    return tableCells;
}

export function getDefaultRow(tableId, rowId, rowLocation = 'Body') {
    console.log('In GetDefaultRow')
    console.log('...tableId = ' + tableId)
    console.log('...rowId = ' + rowId)
    console.log('...rowLocation = ' + rowLocation)

    let row
    if (rowLocation === 'Border') {
        row = {
            table_id: String(tableId),
            row_id: String(rowId),
            attributes: getDefaultTableAttributes('rows', rowLocation),
            classes: getDefaultTableClasses('rows')
        }
    } else {
        row = {
            table_id: String(tableId),
            row_id: String(rowId),
            attributes: getDefaultTableAttributes('rows', rowLocation),
            classes: getDefaultTableClasses('rows')
        }
    }

    console.log(row)
    return row;
}


export function getDefaultColumn(tableId, columnId, columnLocation = 'Body') {

    let column
    if (columnLocation === 'Border') {
        column = {
            table_id: String(tableId),
            column_id: String(columnId),
            column_name: 'Border',
            attributes: getDefaultTableAttributes('columns', columnLocation),
            classes: ''
        }
    } else {
        column = {
            table_id: String(tableId),
            column_id: String(columnId),
            column_name: 'Comments',
            attributes: getDefaultTableAttributes('columns', columnLocation),
            classes: getDefaultTableClasses('columns')
        }
    }

    return column;
}

export function getDefaultCell(tableId, columnId, rowId, cellLocation = 'Body') {

    let cell
    let columnLetter = numberToLetter(columnId)
    let borderContent = rowId == 0 ? columnLetter : String(rowId)

    if (cellLocation === 'Border') {
        cell = {
            table_id: String(tableId),
            column_id: String(columnId),
            row_id: String(rowId),
            cell_id: rowId === 0 ? columnLetter + '0' : '0' + String(columnId),
            attributes: getDefaultTableAttributes('cells', cellLocation),
            classes: 'grid-control__cells--border hover',
            content: borderContent
        }
    } else {
        cell = {
            table_id: String(tableId),
            column_id: String(columnId),
            row_id: String(rowId),
            cell_id: columnLetter + rowId,
            attributes: getDefaultTableAttributes('cells', cellLocation),
            classes: getDefaultTableClasses('cells'),
            content: ''
        }
    }
    return cell;
}

export function getDefaultTableAttributes(tableComponent, componentLocation = 'Body') {

    const tableBaseAttributes = {
        showGridLines: false,
        bandedRows: false,
        bandedRowBackgroundColor: '#d8dbda',
        bandedTextColor: '#d8dbda',
        gridLineWidth: 1,
        enableHeaderRow: false,
        headerRowSticky: false,
        horizontalAlignment: 'none',
        verticalAlignment: 'none'
    }

    const columnAttributes = {
        columnWidthType: 'Proportional',
        minWidth: 20,
        minWidthUnits: 'ch',
        maxWidth: 1,
        maxWidthUnits: 'fr',
        fixedWidth: 1,
        fixedWidthUnits: 'fr',
        disableForTablet: false,
        disableForPhone: false,
        isFixedLeftColumnGroup: false,
        horizontalAlignment: 'none'
    }

    const columnBorderAttributes = {
        columnWidthType: 'Fixed',
        minWidth: 0,
        minWidthUnits: '',
        maxWidth: 0,
        maxWidthUnits: '',
        fixedWidth: 20,
        fixedWidthUnits: 'px',
        disableForTablet: false,
        disableForPhone: false,
        isFixedLeftColumnGroup: false,
        horizontalAlignment: 'center'
    }

    const rowAttributes = {
        rowHeightType: 'Auto',
        minHeight: 0,
        minHeightUnits: 'em',
        maxHeight: 0,
        maxHeightUnits: 'em',
        fixedHeight: 0,
        fixedHeightUnits: 'em',
        isHeader: 'false',
        verticalAlignment: 'none'
    }

    const rowBorderAttributes = {
        rowHeightType: 'Auto',
        minHeight: 0,
        minHeightUnits: 'em',
        maxHeight: 0,
        maxHeightUnits: 'em',
        fixedHeight: 0,
        fixedHeightUnits: 'em',
        isHeader: 'false',
        verticalAlignment: 'none'
    }

    const cellAttributes = {
        border: false
    }

    const cellBorderAttributes = {
        border: true
    }

    switch (tableComponent) {
        case 'table':
            return tableBaseAttributes;
            break;

        case 'columns':
            if (componentLocation === 'Border') {
                return columnBorderAttributes;
            }
            return columnAttributes;
            break;

        case 'rows':
            if (componentLocation === 'Border') {
                return rowBorderAttributes;
            }
            return rowAttributes;
            break;

        case 'cells':
            if (componentLocation === 'Border') {
                return cellBorderAttributes;
            }
            return cellAttributes;
            break;

        default:
            return
    }
}

export function getDefaultTableClasses(tableComponent) {


    const tableBaseClasses = ''

    const columnClasses = ''


    const rowClasses = ''

    const cellClasses = ''

    switch (tableComponent) {
        case 'table':
            return tableBaseClasses;
            break;

        case 'columns':
            return columnClasses;
            break;

        case 'rows':
            return rowClasses;
            break;

        case 'cells':
            return cellClasses;
            break;

        default:
            return
    }
}