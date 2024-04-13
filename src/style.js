/**
 * Establish grid css grid-template-columns based upon attributes associated with columns
 * 
 * @param {*} isNewBlock 
 * @param {*} tableIsResolving 
 * @param {*} columns 
 * @returns 
 */
export function processColumns(isNewBlock, tableIsResolving, columns) {
    if (isNewBlock || tableIsResolving) {
        return undefined
    }

    let newGridColumnStyle = ''
    {
        columns.map(({ column_id, column_name, attributes, classes }) => {
            console.log('Column ID - ' + newGridColumnStyle)
            console.log(attributes)
            const { columnWidthType,
                minWidth,
                minWidthUnits,
                maxWidth,
                maxWidthUnits,
                fixedWidth,
                fixedWidthUnits,
                disableForTablet,
                disableForPhone,
                isFixedLeftColumnGroup,
                horizontalAlignment
            } = attributes;

            let sizing = '';

            if (column_id === '1') {
                newGridColumnStyle = newGridColumnStyle + '40px '
            }
            switch (columnWidthType) {
                case 'Proportional':
                    {
                        if (minWidth > 0) {
                            sizing = 'minmax(' + minWidth + minWidthUnits + ', ' + maxWidth + 'fr) '
                        } else (
                            // sizing = '1fr '
                            sizing = maxWidth + 'fr '
                        )
                        newGridColumnStyle = newGridColumnStyle + sizing;
                        break;
                    }
                case 'Auto':
                    {
                        newGridColumnStyle = newGridColumnStyle + 'auto ';
                        break;
                    }
                case 'Fixed':
                    {
                        newGridColumnStyle = newGridColumnStyle + fixedWidth + fixedWidthUnits + ' ';
                        break;
                    }
                case 'Custom':
                    {
                        sizing = 'minmax(' + minWidth + minWidthUnits + ', ' + maxWidth + maxWidthUnits + ') '
                        newGridColumnStyle = newGridColumnStyle + sizing;
                        break;
                    }
                default:
                    console.log('Unrecognized Attibute Type')
            }

            // if (column_id === '0') {
            // 	newGridColumnStyle = newGridColumnStyle + '20px ';
            // } else {
            // 	newGridColumnStyle = newGridColumnStyle + 'auto ';
            // }
        })
    }
    console.log('grid-template-columns = ' + newGridColumnStyle)
    // setTableStale(false)
    return newGridColumnStyle
}

/**
 * Establish grid css grid-template-rowss based upon attributes associated with rows
 * 
 * @param {*} isNewBlock 
 * @param {*} tableIsResolving 
 * @param {*} rows 
 * @returns 
 */
export function processRows(isNewBlock, tableIsResolving, rows) {
    if (isNewBlock || tableIsResolving) {
        return undefined
    }

    let newGridRowStyle = ''
    {
        rows.map(({ row_id, attributes, classes }) => {
            console.log('Row ID - ' + newGridRowStyle)
            if (row_id === '0') {
                newGridRowStyle = newGridRowStyle + '25px ';
            } else {
                newGridRowStyle = newGridRowStyle + 'auto ';
            }
        })
    }
    // setTableStale(false)
    return newGridRowStyle
}

/**
 * Establish grid css grid-template-rowss based upon attributes associated with rows
 * 
 * @param {*} isNewBlock 
 * @param {*} tableIsResolving 
 * @param {*} rows 
 * @returns 
 */
export function processTableBodyRows(isNewBlock, tableIsResolving, rows) {
    if (isNewBlock || tableIsResolving) {
        return undefined
    }

    let newGridRowStyle = ''
    {
        rows.filter(row => row.attributes.isHeader !== true && row.row_id !== '0')
            .map(({ row_id, attributes, classes }) => {
                console.log('Row ID - ' + newGridRowStyle)
                newGridRowStyle = newGridRowStyle + 'auto ';
            })
    }
    // setTableStale(false)
    return newGridRowStyle
}

/**
 * Create Styling Variable for showing inner grid borders/lines
  * 
  * @param {*} isNewBlock 
  * @param {*} tableIsResolving 
  * @param {*} showGridLines 
  * @returns 
  */
export function gridBandedRowTextColorStyle(isNewBlock, tableIsResolving, color) {
    if (isNewBlock || tableIsResolving) {
        return undefined;
    };
    return color;
}

export function gridBandedRowBackgroundColorStyle(isNewBlock, tableIsResolving, color) {
    if (isNewBlock || tableIsResolving) {
        return undefined;
    };
    return color;
}

/**
* Create Styling Variable for showing inner grid borders/lines
* 
* @param {*} isNewBlock 
* @param {*} tableIsResolving 
* @param {*} showGridLines 
* @returns 
*/
export function getGridHeaderBackgroundColorStyle(isNewBlock, tableIsResolving, tableColor, blockColor) {
    if (isNewBlock || tableIsResolving) {
        return undefined;
    };

    if (tableColor) {
        return tableColor;
    };

    return blockColor;
}


/**
 * Create Styling Variable for showing inner grid borders/lines
  * 
  * @param {*} isNewBlock 
  * @param {*} tableIsResolving 
  * @param {*} showGridLines 
  * @returns 
  */
export function gridInnerBorderStyle(isNewBlock, tableIsResolving, showGridLines) {
    if (isNewBlock || tableIsResolving) {
        return undefined;
    };
    console.log('show grid lines = ' + showGridLines)
    if (showGridLines) {
        return 'solid';
    };

    return 'hidden';
}

/**
* Create Styling Variable for inner grid borders/lines width
* 
* @param {*} isNewBlock 
* @param {*} tableIsResolving 
* @param {*} showGridLines 
* @returns 
*/
export function gridInnerBorderWidthStyle(isNewBlock, tableIsResolving, showGridLines, gridLineWidth) {
    if (isNewBlock || tableIsResolving) {
        return undefined;
    };

    if (!showGridLines) {
        return '0px';
    };

    return String(gridLineWidth) + 'px';
}

export function startGridBodyRowNbr(enableHeader, showBorders) {
    let startGridLine = 1
    startGridLine = enableHeader ? startGridLine + 1 : startGridLine
    startGridLine = showBorders ? startGridLine + 1 : startGridLine

    return startGridLine;
}

export function endGridBodyRowNbr(startGridLine, numRows, enableHeader, enableFooter) {
    let endGridLine = startGridLine + numRows
    endGridLine = enableHeader ? endGridLine - 1 : endGridLine
    endGridLine = enableFooter ? endGridLine - 1 : endGridLine

    return endGridLine;
}

export function getHeaderTextAlignmentStyle(isNewBlock, tableIsResolving, textAlignment) {
    if (isNewBlock || tableIsResolving) {
        return undefined;
    };

    return textAlignment;
}



/**
 * The BorderBoxControl stores the syle values as a flat object (simple) or as nested objects
 * (complex).  We evaluate the object value to determine which type it is.
 * 
 * @param {*} headerBorder 
 * @returns 
 */
export function getHeaderBorderStyleType(headerBorder) {
    if (headerBorder) {
        const borderWrapper = Object.entries(headerBorder);
        for (var i = 0; i < borderWrapper.length; i++) {
            if (borderWrapper[i].some(value => { return typeof value == "object" })) {
                console.log(borderWrapper[i]);
                return 'split'
            }
        }
        return 'flat';
    };
    return 'unknown';
}

/**
 * Get Style value for the specified border segment and attribute
 * 
 * @param {*} headerBorder 
 * @param {*} borderLocation 
 * @param {*} borderAttribute 
 * @param {*} borderType 
 * @returns 
 */
export function getHeaderBorderStyle(headerBorder, borderLocation, borderAttribute, borderType) {
    if (borderType === 'split') {
        return headerBorder[borderLocation][borderAttribute]
    }

    if (borderType === 'flat') {
        return headerBorder[borderAttribute]
    }

    return 'unknown'
}
