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

export function setBorderContent(row, column, content) {
    if (row === '0' && column === '0') {
        return ''
    } else {
        return content
    }
}

export function openCurrentColumnMenu(columnMenuVisible, openColumnRow, column_id) {
    if (columnMenuVisible && openColumnRow === column_id) {
        return true
    }
    return false
}

export function openCurrentRowMenu(rowMenuVisible, openColumnRow, row_id) {
    if (rowMenuVisible && openColumnRow === row_id) {
        return true
    }
    return false
}


