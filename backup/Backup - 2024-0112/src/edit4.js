/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import apiFetch from "@wordpress/api-fetch"
import { useSelect } from "@wordpress/data";
import { useState, useEffect } from "@wordpress/element"
import { __ } from '@wordpress/i18n';
import { useEntityProp } from "@wordpress/core-data"
import {
    TextControl, Panel, PanelBody, PanelRow, TabbableContainer, Spinner,
    __experimentalNumberControl as NumberControl
} from '@wordpress/components';
import { RichText, AlignmentToolbar, InspectorControls, BlockControls, useBlockProps } from '@wordpress/block-editor';

/**
 *  * Internal Dependencies
 */

export default function Edit(props) {
    const blockProps = useBlockProps({
        className: "dynamic-table-edit-block"
    })

    const [render, setRender] = useState(0);
    const [countDetails, setCountDetails] = useState(1)
    const storeInfo = 'Store detail count - ' + countDetails

    function updateClickCount() {
        setCountDetails(countDetails + 1)
    }

    useEffect(() => {
        setRender(render + 1)
        //        console.log('RENDER - ' + render)
    }, [countDetails])

    return (
        <div {...blockProps} >
            <p>Store Loaded</p>
            <p>{storeInfo}</p>
            <button onClick={updateClickCount}>Push Me</button>

            <p> Total Renders = {render}</p>
        </div >)
}

