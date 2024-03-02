/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { useState} from "@wordpress/element"
//import { useState, useEffect } from "@wordpress/element"
import { __ } from '@wordpress/i18n';
import { useEntityProp } from "@wordpress/core-data"
import {
    TextControl, Panel, PanelBody, PanelRow, TabbableContainer, Spinner,
    __experimentalNumberControl as NumberControl
} from '@wordpress/components';
import { RichText, AlignmentToolbar, InspectorControls, BlockControls, useBlockProps } from '@wordpress/block-editor';

import numberToLetter from './number-to-letter';
import './editor.scss';

export default function Edit(props) {
    const blockProps = useBlockProps({
        className: "dynamic-table-edit-block"
    })

    // const [render, setRender] = useState(0);
    const [table, setTable] = useState([]);
    const [tableId, setTableId] = useState('');
    const [tablePostId, setTablePostId] = useState('');
    const [tableClasses, setTableClasses] = useState('');
    const [tableName, setTableName] = useState('');
    const [renders, setRenders] = useState(0);



    const [isFetchingData, setIsFetchingData] = useState(false)
    const [gridStyle, setGridStyle] = useState('');
    const [numColumns, setNumColumns] = useState(1);
    const [numRows, setNumRows] = useState(1);
    //    const [gridCells, setGridCells] = useState([])

    const [gridCells, setGridCells] = useState([
        {
            cellRow: '0',
            cellColumn: '0',
            cellId: '00',
            componentClass: 'header',
            cellValue: 'Column A'
        }
    ]);


    // Set Table Name
    const updateTableName = (e) => {
        setTableName(e)
    }

    // Process changes to the number of columns
    const defineColumns = (num_columns) => {
        console.log('Init Columns')
        setNumColumns(Number(num_columns))
        initTableCells(Number(num_columns), Number(numRows))
        initGridStyle(Number(num_columns))
        //		console.log(JSON.stringify(dynamicStyles, null, 4))
    }

    // Process changes to the number of rows
    const defineRows = (num_rows) => {
        console.log('Init Rows')
        setNumRows(Number(num_rows))
        initTableCells(numColumns, num_rows)
    }

    function debugSetGridCells(cell) {
        let transformedCell = {
            cellRow: cell[0],
            cellColumn: cell[1],
            cellId: cell[2],
            componentClass: cell[3],
            cellValue: cell[4]
        }

        console.log(JSON.stringify(transformedCell, null, 4))
        LoadTableCells(transformedCell)
        console.log('Update Cell')
    }

    function getRndInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Create grid array
    function initTableCells(init_num_columns, init_num_rows) {
        console.log(init_num_rows)
        var tableCells = []

        var x = 1
        var y = 1

        while (y <= init_num_rows) {
            while (x <= init_num_columns) {
                let columnLetter = numberToLetter(x)
                if (y == 1) {
                    let cell = {
                        cellRow: String(y),
                        cellColumn: String(x),
                        cellId: columnLetter + y,
                        componentClass: 'header',
                        cellValue: 'Cell' + columnLetter + y
                    }
                    tableCells.push(cell)
                } else {
                    let cell = {
                        cellRow: String(y),
                        cellColumn: String(x),
                        cellId: columnLetter + y,
                        componentClass: 'body',
                        cellValue: 'Cell' + columnLetter + y
                    }
                    tableCells.push(cell)
                }
                x++
            }
            var x = 1
            y++
        }

        setGridCells(tableCells)
        console.log(JSON.stringify(tableCells, null, 4))
    }

    function LoadTableCells(updatedCell) {
        var tableCells = gridCells

        console.log('Updated Cell ID: ' + updatedCell.cellId)
        console.log('Find Match: ' + JSON.stringify(tableCells.find(x => x.cellId === updatedCell.cellId), null, 4))

        if (tableCells.find(x => x.cellId === updatedCell.cellId)) {
            var filtered = tableCells.filter(x => x.cellId !== updatedCell.cellId)
            tableCells = filtered
        }
        // push
        tableCells.push(updatedCell)
        //console.log(tableCells.cellId)
        //console.log(tableCells.map(x => x.cellId))
        tableCells.sort((a, b) => {
            if ([[a.cellRow], [a.cellColumn]] < [[b.cellRow], [b.cellColumn]]) {
                return -1
            } else {
                return 1
            }
        })
        //tableCells.sort((a, b) => a.map(x => x.cellId) - b.map(x => x.cellId))
        setGridCells(tableCells)


        console.log(JSON.stringify(updatedCell))
        console.log(tableCells)
        console.log(JSON.stringify(tableCells, null, 4))
    }

    // Set grid column css
    function initGridStyle(init_num_columns) {

        let newGridStyle = ''
        var i = 1

        while (i <= init_num_columns) {
            if (i == 1) {
                newGridStyle = newGridStyle + "auto"
            } else {
                newGridStyle = newGridStyle + " auto"
            }
            i++
        }
        setGridStyle(newGridStyle)

    }

    function logEvent(e) {
        console.log('EVENT...')
        console.log(e)
        //console.log(JSON.stringify(event, null, 4))
    }

    console.log(JSON.stringify(gridCells, null, 4))

    // useEffect(() => {
    //     setRender(render + 1)
    //     //       console.log('RENDER - ' + render)

    // }, [])


    return (
        <div {...blockProps} >

            <InspectorControls>
                <Panel header="Table Definition head">
                    <PanelBody title="Table Definition" initialOpen={true}>
                        <PanelRow>
                            <TextControl label="Table Name" value={tableName} onChange={(e) => updateTableName(e)} />
                        </PanelRow>

                        <PanelRow>
                            <NumberControl label="Table Columns" value={numColumns} labelPosition="side" onChange={(e) => defineColumns(e)} />
                        </PanelRow>

                        <PanelRow>
                            <NumberControl label="Table Rows" value={numRows} labelPosition="side" onChange={(e) => defineRows(e)} />
                        </PanelRow>
                    </PanelBody>
                </Panel>
            </InspectorControls>

            {isFetchingData === true && (<Spinner></Spinner>)}

            <div>{tableName}</div>
            <TabbableContainer>
                <div className="grid-control" style={{ "--gridTemplateColumns": gridStyle }}>

                    {gridCells.map(({ cellRow, cellColumn, cellId, componentClass, cellValue }) => {
                        return (
                            <RichText
                                className={componentClass}
                                tabIndex="0"
                                tagName="div"
                                id={cellId}
                                //allowedFormats={['core/bold', 'core/italic']}
                                //onChange={cellContent => setGridCells([col, row, cellId, componentClass, cellContent])}
                                onChange={e => debugSetGridCells([cellRow, cellColumn, cellId, componentClass, e])}
                                value={cellValue}>
                            </RichText>
                        );
                    })}
                </div>
            </TabbableContainer>
        </div >)
}