/**
 * Establish grid css grid-template-columns based upon attributes associated with columns
 *
 * @since    1.0.0
 *
 * @param {boolean}      isNewBlock           Has the block been newly created and not yet persisted?
 * @param {boolean}      tableIsResolving     Are we still waiting for table to finish resolving?
 * @param {boolean}      enableFutureFeatures Include features intended for a future release?
 * @param {Array|Object} columns              Table columns
 * @return {string} Value for grid-template-columns css attribute
 */

export function processColumns(isNewBlock, tableIsResolving, enableFutureFeatures, columns) {
	if (isNewBlock || tableIsResolving) {
		return undefined;
	}

	let newGridColumnStyle = '';
	{
		columns.map(({ column_id, column_name, attributes, classes }) => {
			const {
				columnWidthType,
				minWidth,
				minWidthUnits,
				maxWidth,
				maxWidthUnits,
				fixedWidth,
				fixedWidthUnits,
				disableForTablet,
				disableForPhone,
			} = attributes;

			let sizing = '';

			if (column_id === '1' && enableFutureFeatures) {
				newGridColumnStyle = newGridColumnStyle + '40px ';
			}
			switch (columnWidthType) {
				case 'Proportional': {
					if (minWidth > 0) {
						sizing = 'minmax(' + minWidth + minWidthUnits + ', ' + maxWidth + 'fr) ';
					} else
						// sizing = '1fr '
						sizing = maxWidth + 'fr ';
					newGridColumnStyle = newGridColumnStyle + sizing;
					break;
				}
				case 'Auto': {
					newGridColumnStyle = newGridColumnStyle + 'auto ';
					break;
				}
				case 'Fixed': {
					newGridColumnStyle = newGridColumnStyle + fixedWidth + fixedWidthUnits + ' ';
					break;
				}
				case 'Custom': {
					sizing = 'minmax(' + minWidth + minWidthUnits + ', ' + maxWidth + maxWidthUnits + ') ';
					newGridColumnStyle = newGridColumnStyle + sizing;
					break;
				}
				default:
					console.log('Unrecognized Attibute Type');
			}
		});
	}
	return newGridColumnStyle;
}

/**
 * Establish grid css grid-template-rows based upon attributes associated with header row(s).
 *
 * @since    1.0.0
 *
 * @param {boolean}      isNewBlock       Has the block been newly created and not yet persisted?
 * @param {boolean}      tableIsResolving Are we still waiting for table to finish resolving?
 * @param {Array|Object} rows             Table rows
 * @return {string} Value for grid-template-rows css attribute in header rows
 */
export function processHeaderRow(isNewBlock, tableIsResolving, rows) {
	if (isNewBlock || tableIsResolving) {
		return undefined;
	}

	let newGridRowStyle = '';
	{
		rows.map(({ row_id, attributes, classes }) => {
			const {
				rowHeightType,
				minHeight,
				minHeightUnits,
				maxHeight,
				maxHeightUnits,
				fixedHeight,
				fixedHeightUnits,
				isHeader,
			} = attributes;

			let sizing = '';

			if (isHeader) {
				switch (rowHeightType) {
					case 'Auto': {
						newGridRowStyle = newGridRowStyle + 'auto ';
						break;
					}
					case 'Fixed': {
						newGridRowStyle = newGridRowStyle + fixedHeight + fixedHeightUnits + ' ';
						break;
					}
					case 'Custom': {
						sizing =
							'minmax(' + minHeight + minHeightUnits + ', ' + maxHeight + maxHeightUnits + ') ';
						newGridRowStyle = newGridRowStyle + sizing;
						break;
					}
					default:
						console.log('Unrecognized Attibute Type');
				}
			}
		});
	}
	return newGridRowStyle;
}

/**
 * Establish grid css grid-template-rows based upon attributes associated with body row(s).
 *
 * @since    1.0.0
 *
 * @param {boolean}      isNewBlock       Has the block been newly created and not yet persisted?
 * @param {boolean}      tableIsResolving Are we still waiting for table to finish resolving?
 * @param {Array|Object} rows             Table rows
 * @return {string} Value for grid-template-rows css attribute in body rows
 */
export function processBodyRows(isNewBlock, tableIsResolving, rows) {
	if (isNewBlock || tableIsResolving) {
		return undefined;
	}

	let newGridRowStyle = '';
	{
		rows.map(({ row_id, attributes, classes }) => {
			const {
				rowHeightType,
				minHeight,
				minHeightUnits,
				maxHeight,
				maxHeightUnits,
				fixedHeight,
				fixedHeightUnits,
				isHeader,
			} = attributes;

			let sizing = '';

			if (!isHeader) {
				switch (rowHeightType) {
					case 'Auto': {
						newGridRowStyle = newGridRowStyle + 'auto ';
						break;
					}
					case 'Fixed': {
						newGridRowStyle = newGridRowStyle + fixedHeight + fixedHeightUnits + ' ';
						break;
					}
					case 'Custom': {
						sizing =
							'minmax(' + minHeight + minHeightUnits + ', ' + maxHeight + maxHeightUnits + ') ';
						newGridRowStyle = newGridRowStyle + sizing;
						break;
					}
					default:
						console.log('Unrecognized Attibute Type');
				}
			}
		});
	}
	return newGridRowStyle;
}

/**
 * Create Styling Variable for the text color in banded rows.
 *
 * @since    1.0.0
 *
 * @param {boolean} isNewBlock       Has the block been newly created and not yet persisted?
 * @param {boolean} tableIsResolving Are we still waiting for table to finish resolving?
 * @param {string}  color            Color code associated with the banded row text
 * @return {string} CSS color code
 */
export function gridBandedRowTextColorStyle(isNewBlock, tableIsResolving, color) {
	if (isNewBlock || tableIsResolving) {
		return undefined;
	}
	return color;
}

/**
 * Create Styling Variable for the background color in banded rows.
 *
 * @since    1.0.0
 *
 * @param {boolean} isNewBlock       Has the block been newly created and not yet persisted?
 * @param {boolean} tableIsResolving Are we still waiting for table to finish resolving?
 * @param {string}  color            Color code associated with the banded row background color
 * @return {string} CSS color code
 */
export function gridBandedRowBackgroundColorStyle(isNewBlock, tableIsResolving, color) {
	if (isNewBlock || tableIsResolving) {
		return undefined;
	}
	return color;
}

/**
 * Create Styling Variable for the header background color.
 *
 * @since    1.0.0
 *
 * @param {boolean} isNewBlock       Has the block been newly created and not yet persisted?
 * @param {boolean} tableIsResolving Are we still waiting for table to finish resolving?
 * @param {string}  tableColor       Color code associated with table header color if populated
 * @param {string}  blockColor       Color code associated with block
 * @return {string} Value for header background-color
 */
export function getGridHeaderBackgroundColorStyle(
	isNewBlock,
	tableIsResolving,
	tableColor,
	blockColor
) {
	if (isNewBlock || tableIsResolving) {
		return undefined;
	}

	if (tableColor) {
		return tableColor;
	}

	return blockColor;
}

/**
 * Create Styling Variable for showing inner grid borders/lines.
 *
 * @since    1.0.0
 *
 * @param {boolean} isNewBlock       Has the block been newly created and not yet persisted?
 * @param {boolean} tableIsResolving Are we still waiting for table to finish resolving?
 * @param {boolean} showGridLines    Do we render grid lines
 * @return {string} CSS value to show vs. hide table inside grid (border) lines
 */
export function gridInnerBorderStyle(isNewBlock, tableIsResolving, showGridLines) {
	if (isNewBlock || tableIsResolving) {
		return undefined;
	}
	if (showGridLines) {
		return 'solid';
	}

	return 'hidden';
}

/**
 * Create Styling Variable for inner grid borders/lines width.
 *
 * @since    1.0.0
 *
 * @param {boolean} isNewBlock       Has the block been newly created and not yet persisted?
 * @param {boolean} tableIsResolving Are we still waiting for table to finish resolving?
 * @param {boolean} showGridLines    Do we render grid lines
 * @param {string}  gridLineWidth    Number of pixels for grid line width
 * @return  {string} CSS value for border width
 */
export function gridInnerBorderWidthStyle(
	isNewBlock,
	tableIsResolving,
	showGridLines,
	gridLineWidth
) {
	if (isNewBlock || tableIsResolving) {
		return undefined;
	}

	if (!showGridLines) {
		return '0px';
	}

	return String(gridLineWidth) + 'px';
}

/**
 * CSS starting grid row line number for body rows.
 *
 * @since    1.0.0
 *
 * @param {boolean} enableHeader Does the table contain a header row?
 * @param {boolean} showBorders  Are borders to be displayed?
 * @return  {number} First body row number
 */
export function startGridRowNbr(enableHeader, showBorders) {
	let startGridLine = 1;
	startGridLine = enableHeader ? startGridLine + 1 : startGridLine;
	startGridLine = showBorders ? startGridLine + 1 : startGridLine;

	return startGridLine;
}

/**
 * CSS ending grid row line number.
 *
 * @since    1.0.0
 *
 * @param {number}  startGridLine Starting line number for the row group
 * @param {string}  rowGroup      Header or Body
 * @param {number}  numRows       Total number of grid rows in this row group
 * @param {boolean} enableHeader  Does the table contain a header row(s)?
 * @param {boolean} showBorders   Are borders to be displayed?
 * @param {boolean} enableFooter  Does the table contain a footer row(s)?
 * @return  {number} Line number of ending grid row
 */
export function endGridRowNbr(
	startGridLine,
	rowGroup,
	numRows,
	enableHeader,
	showBorders,
	enableFooter // Always false.  Reserved for future functionality
) {
	let endGridLine;

	switch (rowGroup) {
		case 'Header': {
			endGridLine = 2;
			endGridLine = showBorders ? endGridLine++ : endGridLine;
			break;
		}
		case 'Body': {
			endGridLine = startGridLine + numRows;
			endGridLine = showBorders ? endGridLine++ : endGridLine;
			endGridLine = enableHeader ? endGridLine - 1 : endGridLine;
			endGridLine = enableFooter ? endGridLine - 1 : endGridLine;
			break;
		}
		default:
			console.log('Unknown row type');
	}

	return endGridLine;
}

export function getHeaderTextAlignmentStyle(isNewBlock, tableIsResolving, textAlignment) {
	if (isNewBlock || tableIsResolving) {
		return undefined;
	}

	return textAlignment;
}

/**
 * Determine whether the border is styled differently or the same for each side of the border.
 *
 * The BorderBoxControl stores the syle values as a flat object (simple) or as nested objects
 * (complex).  We evaluate the object value to determine which type it is.
 *
 * @since    1.0.0
 *
 * @param {Object} border Border style definition
 * @return {string} Border type (flat vs. split)
 */
export function getBorderStyleType(border) {
	if (border) {
		const borderWrapper = Object.entries(border);
		for (let i = 0; i < borderWrapper.length; i++) {
			if (
				borderWrapper[i].some(value => {
					return typeof value == 'object';
				})
			) {
				return 'split';
			}
		}
		return 'flat';
	}
	return 'unknown';
}

/**
 * Get the border style, color, and width of the specified border segment.
 *
 * @since    1.0.0
 *
 * @param {Object} border          Border style definition
 * @param {string} borderLocation  The specified border segment (top | right | bottom | left)
 * @param {string} borderAttribute The attribute to be styled (style | color | width)
 * @param {string} borderType      Whether the border is the same on all side (flat) or different (split)
 * @return {string} CSS value for the requested attribute
 */
export function getBorderStyle(border, borderLocation, borderAttribute, borderType) {
	switch (borderType) {
		case 'split': {
			return border[borderLocation][borderAttribute];
		}

		case 'flat': {
			return border[borderAttribute];
		}

		default: {
			switch (borderAttribute) {
				case 'color': {
					return 'black';
				}

				case 'style': {
					return 'solid';
				}

				case 'width': {
					return '1px';
				}
			}
		}
	}
}
