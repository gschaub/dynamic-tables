/* External dependencies */
import { useSelect, useDispatch, dispatch } from '@wordpress/data';
import { useState, useEffect, useRef, useMemo, Fragment } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';
import { store as noticeStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import {
	Panel,
	PanelBody,
	PanelRow,
	Button,
	Spinner,
	Placeholder,
	CheckboxControl,
	TextControl,
	__experimentalInputControl as InputControl,
	BorderBoxControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';

import {
	RichText,
	useBlockProps,
	useSettings,
	BlockIcon,
	AlignmentControl,
	InspectorControls,
	BlockControls,
	BlockAlignmentToolbar,
	PanelColorSettings,
} from '@wordpress/block-editor';
import { create, getTextContent } from '@wordpress/rich-text';
import { search, blockTable as icon } from '@wordpress/icons';

/* Internal dependencies */
import { store as tableStore } from './data';
import { usePostChangesSaved, useEditorIdentity, useNotInInserterPreview } from './hooks';

import {
	tableSort,
	generateBlockTableRef,
	setBorderContent,
	formatedDisplayDate,
	formattedIsoDate,
} from './utils';

import { initTable, getDefaultRow, getDefaultColumn, getDefaultCell } from './table-defaults';
import {
	processColumns,
	processHeaderRow,
	processBodyRows,
	gridBandedRowTextColorStyle,
	gridBandedRowBackgroundColorStyle,
	gridInnerBorderStyle,
	gridInnerBorderWidthStyle,
	startGridRowNbr,
	endGridRowNbr,
	getGridHeaderBackgroundColorStyle,
	getHeaderTextAlignmentStyle,
	getBorderStyleType,
	getBorderStyle,
} from './style';

import {
	RowMenu,
	RowHeightModal,
	ColumnMenu,
	ColumnWidthModal,
	ColumnDataTypeModal,
} from './components';
import './editor.scss';

/* Create Dynamic Tables entity in WordPress core-data */
dispatch('core').addEntities([
	{
		name: 'table',
		kind: 'dynamic-table-blocks',
		baseURL: '/dynamic-table-blocks/v1/tables',
		baseURLParams: { context: 'edit' },
		plural: 'tables',
		label: __('Table'),
		getTitle: record => record?.title || __('Unnamed Table'),
	},
]);

/**
 * Exports main logic for Dynamic Tables block.
 *
 * @since    1.0.0
 *
 * @param {Object} props
 */
export default function Edit(props) {
	const blockProps = useBlockProps({
		className: 'dynamic-table-edit-block',
	});
	/* Esternal Store Action useDispatch declarations */
	const { lockPostSaving, unlockPostSaving, lockPostAutosaving, unlockPostAutosaving } =
		useDispatch(editorStore);
	const SAVE_LOCK_KEY = 'dtbk-save-lock';

	/* Table Store Action useDispatch declarations */
	const { receiveNewTable } = useDispatch(tableStore);
	const { cloneTable } = useDispatch(tableStore);
	const { createTableEntity } = useDispatch(tableStore);
	const { saveTableEntity } = useDispatch(tableStore);
	const { addColumn } = useDispatch(tableStore);
	const { addRow } = useDispatch(tableStore);
	const { removeColumn } = useDispatch(tableStore);
	const { removeRow } = useDispatch(tableStore);
	const { moveRow } = useDispatch(tableStore);
	const { updateTableProp } = useDispatch(tableStore);
	const { updateRow } = useDispatch(tableStore);
	const { updateColumn } = useDispatch(tableStore);
	const { updateCell } = useDispatch(tableStore);
	const { updateTableEntity } = useDispatch(tableStore);
	const { updateTableBorder } = useDispatch(tableStore);
	const { processUnmountedTables } = useDispatch(tableStore);
	const { processDeletedTables } = useDispatch(tableStore);
	const { createNotice, removeNotice } = useDispatch(noticeStore);

	/* Local State declarations */
	const [isTableStale, setTableStale] = useState(true);
	const [showBorders, setShowBorders] = useState(false);
	const [tableName, setTableName] = useState('');
	const [numColumns, setNumColumns] = useState(1);
	const [numRows, setNumRows] = useState(1);
	const [awaitingTableEntityCreation, setAwaitingTableEntityCreation] = useState(false);
	const [editingCellId, setEditingCellId] = useState(null);

	// ToDo: Move to Utils
	const htmlToText = (html = '') => getTextContent(create({ html })).replace(/\s+/g, ' ').trim();

	// Location of border cell last clicked
	const lastInvokerElRef = useRef(null);

	/**
	 * Support column border drop down menu and settings
	 * dialog boxes
	 */
	const [rowMenu, setRowMenu] = useState({
		isOpen: false,
		anchorEl: null,
		rowId: null,
		rowLabel: '',
		rowAttributes: null,
	});

	const openRowMenu = (e, rowId, rowLabel, rowAttributes) => {
		e?.preventDefault?.();
		e?.stopPropagation?.();

		// Capture a real element, not the synthetic event
		const el = e?.currentTarget || null;
		lastInvokerElRef.current = el;

		setRowMenu({
			isOpen: true,
			anchorEl: el,
			rowId,
			rowLabel,
			rowAttributes,
		});
	};

	const closeRowMenu = () => {
		setRowMenu(prev => ({ ...prev, isOpen: false, anchorEl: null }));

		// restore focus to the invoker (menu trigger)
		window.requestAnimationFrame(() => lastInvokerElRef.current?.focus?.());
	};

	const [rowHeightModal, setRowHeightModal] = useState({
		isOpen: false,
		rowId: null,
		rowLabel: '',
		rowAttributes: null,
	});

	/**
	 * Open row height configuration dialog page.
	 *
	 * Description: Responds to clicked row menu item to update the row height configuration.
	 *
	 * @since    1.2.0
	 *
	 * @param {Object} e             row menu click event
	 * @param {number} rowId         Row number to update
	 * @param {string} rowLabel      Display label at top of dialog
	 * @param {Object} rowAttributes Row attributes that control row height, among other things
	 */
	const openRowHeightModal = (e, rowId, rowLabel, rowAttributes) => {
		e?.preventDefault?.();
		e?.stopPropagation?.();

		// Capture a real element, not the synthetic event
		const el = e?.currentTarget || null;
		lastInvokerElRef.current = el;

		setRowHeightModal({
			isOpen: true,
			// anchorEl: el,
			rowId,
			rowLabel,
			rowAttributes,
		});
	};

	/**
	 * Close row height configuration dialog page.
	 *
	 * @since    1.2.0
	 */
	const closeRowHeightModal = () => {
		setRowHeightModal(prev => ({ ...prev, isOpen: false }));

		// restore focus to the invoker (menu trigger)
		window.requestAnimationFrame(() => lastInvokerElRef.current?.focus?.());
	};

	/**
	 * Support column border drop down menu and settings
	 * dialog boxes
	 */
	const [columnMenu, setColumnMenu] = useState({
		isOpen: false,
		anchorEl: null,
		columnId: null,
		columnLabel: '',
		columnAttributes: null,
	});

	const openColumnMenu = (e, columnId, columnLabel, columnAttributes) => {
		e?.preventDefault?.();
		e?.stopPropagation?.();

		// Capture a real element, not the synthetic event
		const el = e?.currentTarget || null;
		lastInvokerElRef.current = el;

		setColumnMenu({
			isOpen: true,
			anchorEl: el,
			columnId,
			columnLabel,
			columnAttributes,
		});
	};

	const closeColumnMenu = () => {
		setColumnMenu(prev => ({ ...prev, isOpen: false, anchorEl: null }));

		// restore focus to the invoker (menu trigger)
		window.requestAnimationFrame(() => lastInvokerElRef.current?.focus?.());
	};

	const [columnWidthModal, setColumnWidthModal] = useState({
		isOpen: false,
		columnId: null,
		columnLabel: '',
		columnAttributes: null,
	});

	const [columnDataTypeModal, setColumnDataTypeModal] = useState({
		isOpen: false,
		columnId: null,
		columnLabel: '',
		columnAttributes: null,
	});

	/**
	 * Open column data type configuration dialog page.
	 *
	 * Description: Responds to clicked column menu item to update the column height configuration.
	 *
	 * @since    1.2.0
	 *
	 * @param {Object} e                Column menu click event
	 * @param {number} columnId         Column number to update
	 * @param {string} columnLabel      Display label at top of dialog
	 * @param {Object} columnAttributes Column attributes that control column height, among other things
	 */
	const openColumnDataTypeModal = (e, columnId, columnLabel, columnAttributes) => {
		e?.preventDefault?.();
		e?.stopPropagation?.();

		// Capture a real element, not the synthetic event
		const el = e?.currentTarget || null;
		lastInvokerElRef.current = el;

		setColumnDataTypeModal({
			isOpen: true,
			columnId,
			columnLabel: columnLabel,
			columnAttributes,
		});
	};

	/**
	 * Close column data type configuration dialog page.
	 *
	 * @since    1.2.0
	 */
	const closeColumnDataTypeModal = () => {
		setColumnDataTypeModal(prev => ({ ...prev, isOpen: false }));

		// restore focus to the invoker (menu trigger)
		window.requestAnimationFrame(() => lastInvokerElRef.current?.focus?.());
	};

	/**
	 * Open column width configuration dialog page.
	 *
	 * Description: Responds to clicked column menu item to update the column height configuration.
	 *
	 * @since    1.2.0
	 *
	 * @param {Object} e                Column menu click event
	 * @param {number} columnId         Column number to update
	 * @param {string} columnLabel      Display label at top of dialog
	 * @param {Object} columnAttributes Column attributes that control column height, among other things
	 */
	const openColumnWidthModal = (e, columnId, columnLabel, columnAttributes) => {
		e?.preventDefault?.();
		e?.stopPropagation?.();

		// Capture a real element, not the synthetic event
		const el = e?.currentTarget || null;
		lastInvokerElRef.current = el;

		setColumnWidthModal({
			isOpen: true,
			columnId,
			columnLabel: columnLabel,
			columnAttributes,
		});
	};

	/**
	 * Close column width configuration dialog page.
	 *
	 * @since    1.2.0
	 */
	const closeColumnWidthModal = () => {
		setColumnWidthModal(prev => ({ ...prev, isOpen: false }));

		// restore focus to the invoker (menu trigger)
		window.requestAnimationFrame(() => lastInvokerElRef.current?.focus?.());
	};

	// Support table creation and cloning
	const cloneLatchRef = useRef(new Set());

	// Support keyboard navigation in table
	const [focusedCell, setFocusedCell] = useState({ col: 0, row: 0 });
	const gridRef = useRef(null);

	/* Current future features: Zoom to details */
	const enableFutureFeatures = false;
	const enableProFeatures = false;

	const { table_id, block_table_ref, original_post_type, original_post_id, block_alignment } =
		props.attributes;
	const themeColors = useSettings('color.palette');
	const borderBoxColors = themeColors[0].map(({ color, name }) => {
		return { color, name };
	});

	/**
	 * Get Current Table Id.
	 *
	 * @type     {*}
	 * @since    1.0.0
	 *
	 * @return Table Id
	 */

	/**
	 * Identify current table id by its block table reference
	 *
	 * @since 1.1.0
	 *
	 * @type  {number} Object of all table id's that are currently unmounted
	 */
	const { currentTableId } = useSelect(select => {
		const { getTableIdByBlock } = select(tableStore);
		const currentTableId = getTableIdByBlock(block_table_ref);

		return {
			currentTableId: currentTableId,
		};
	});

	/**
	 * Set Table ID for newly created tables
	 *
	 * @since    1.0.0
	 *
	 * @return {boolean} Was Table Changed?
	 */
	const setTableIdChanged = () => {
		if (awaitingTableEntityCreation && Number(currentTableId) !== Number(table_id)) {
			return true;
		}
		return false;
	};

	const isTableIdChanged = setTableIdChanged();

	/**
	 * Lookup table attribute value.
	 *
	 * @since    1.0.0
	 *
	 * @param {Array}  tableAttributes
	 * @param {string} attributeName
	 * @return {*} Attribute value
	 */
	function getTablePropAttribute(tableAttributes, attributeName) {
		const attributeValue = tableAttributes?.[attributeName];
		return attributeValue;
	}

	/**
	 * Identify unmounted tables
	 *
	 * Table blocks are unmounted when entering the code editor AND when deleted.  However,
	 * we don't know whether the table was deleted when an unmount is detected.  Therefore,
	 * we mark them as unmounted at that time, and can identify whether the block was
	 * truly deleted on the subsequent render.
	 *
	 * We mark tables as deleted if they do not identify that the block has been remounted
	 *
	 * @since 1.0.0
	 *
	 * @type  {Object} Object of all table id's that are currently unmounted
	 */
	const { unmountedTables } = useSelect(select => {
		const { getUnmountedTables } = select(tableStore);
		return {
			unmountedTables: getUnmountedTables(),
		};
	});

	if (Object.keys(unmountedTables).length > 0) {
		processUnmountedTables(unmountedTables);
	}

	/**
	 * Retrive table id's of all tables in a status of deleted.
	 *
	 * @since  1.0.0
	 *
	 * @type   {Object} Object of all table id's for tables with a 'deleted' status
	 */
	const { deletedTables } = useSelect(select => {
		const { getDeletedTables } = select(tableStore);
		return {
			deletedTables: getDeletedTables(),
		};
	});

	/**
	 * Identifies when the post which was being saved has completed the
	 * save.
	 *
	 * @since    1.0.0
	 *
	 * @type     {boolean} Post changes have been saved
	 */
	const postChangesAreSaved = usePostChangesSaved();

	/**
	 * Fires when posts have just finished saving and when a change is detected in
	 * unmounted tables.
	 */
	useEffect(() => {
		if (postChangesAreSaved) {
			/**
			 * Remove deleted tables from persisted store
			 */
			if (Object.keys(deletedTables).length > 0) {
				processDeletedTables(deletedTables);
			}

			/**
			 * Tables are persisted when they are created, but should only remain
			 * if the underlying post is saved.  Here we update the status of new
			 * tables from "new" to "saved" once the post is saved.
			 */
			if (table.table_status == 'new') {
				setTableAttributes(table.table_id, 'table_status', '', 'PROP', 'saved');
				saveTableEntity(table.table_id);
			}
		}
	}, [postChangesAreSaved, unmountedTables]);

	/**
	 * Set Block Table Status
	 *
	 * @since    1.0.0
	 *
	 * @return  {("None" | "New" | "Stale" | "Saved")}  Table Status
	 */
	const setBlockTableStatus = () => {
		if (block_table_ref === '') {
			return 'None';
		}

		if (table_id === '0') {
			return 'New';
		}

		if (isTableStale) {
			return 'Stale';
		}

		return 'Saved';
	};

	/**
	 * Summary. (use period). <break> Description. (use period).
	 *
	 * @since    1.0.0
	 *
	 * @return  {boolean} Is this a new dybamic table block?
	 */
	const setNewBlock = () => {
		if (block_table_ref === '') {
			return true;
		}
		return false;
	};

	/**
	 * Set lock for saving.
	 *
	 * @since    1.0.0
	 */
	const setSaveLock = () => {
		lockPostSaving(SAVE_LOCK_KEY);
		lockPostAutosaving(SAVE_LOCK_KEY);
	};

	/**
	 * Remove lock for saving.
	 *
	 * @since    1.0.0
	 */
	const setClearSaveLock = () => {
		unlockPostSaving(SAVE_LOCK_KEY);
		unlockPostAutosaving(SAVE_LOCK_KEY);
	};

	const isNewBlock = setNewBlock();
	const blockTableStatus = setBlockTableStatus();
	const { postId, postType } = useEditorIdentity(props);
	const inInserterBlock = !useNotInInserterPreview();

	/**
	 * Prepare for New Block
	 */
	if (isNewBlock) {
		setSaveLock();
	}

	/**
	 * Retrieve table entity from table webservice and load table store.
	 *
	 * @since    1.0.0
	 */
	const {
		table,
		tableStatus,
		tableHasStartedResolving,
		tableHasFinishedResolving,
		tableIsResolving,
	} = useSelect(
		select => {
			const {
				getTable,
				getTableIdByBlock,
				hasStartedResolution,
				hasFinishedResolution,
				isResolving,
			} = select(tableStore);
			const selectorArgs = [table_id, isTableStale];

			if (block_table_ref === '') {
				return {
					table: {},
					tableStatus: '',
					tableHasStartedResolving: false,
					tableHasFinishedResolving: false,
					tableIsResolving: false,
				};
			}

			const getBlockTable = (table_id, isTableStale, block_table_ref) => {
				let selectedTable = getTable(table_id, isTableStale);

				if (
					(selectedTable.block_table_ref === '' ||
						(selectedTable.block_table_ref !== block_table_ref &&
							Number(getTableIdByBlock(block_table_ref)) > 0)) &&
					awaitingTableEntityCreation
				) {
					const newTableId = getTableIdByBlock(block_table_ref);
					selectedTable = getTable(newTableId, isTableStale);

					// Must sync post_id here for new table because "resolving" attributes are not available
					if (String(postId) !== selectedTable.post_id && String(postId) !== '0') {
						setTableAttributes(selectedTable.table_id, 'post_id', '', 'PROP', String(postId));
					}

					setAwaitingTableEntityCreation(false);
					setClearSaveLock();
					props.setAttributes({ original_post_type: postType });
					props.setAttributes({ original_post_id: Number(postId) });
					props.setAttributes({ table_id: Number(selectedTable.table_id) });
				}
				return selectedTable;
			};

			const blockTable = getBlockTable(table_id, isTableStale, block_table_ref);
			const tableHasStartedResolving = hasStartedResolution('getTable', selectorArgs);
			const tableHasFinishedResolving = hasFinishedResolution('getTable', selectorArgs);
			const tableIsResolving = isResolving('getTable', selectorArgs);

			if (tableHasFinishedResolving) {
				setTableStale(() => false);
			}

			return {
				table: blockTable,
				tableStatus: blockTable.table_status,
				tableHasStartedResolving: tableHasStartedResolving,
				tableHasFinishedResolving: tableHasFinishedResolving,
				tableIsResolving: tableIsResolving,
			};
		},
		[table_id, isTableIdChanged, isTableStale, block_table_ref, awaitingTableEntityCreation]
	);

	/**
	 * Determine if table has been loaded.
	 *
	 * @since    1.1.0
	 *
	 * @return {boolean}  Table loaded?
	 */
	const setTableLoaded = () => {
		if (!!table.block_table_ref && blockTableStatus !== 'None') return true;
		return false;
	};

	const tableLoaded = setTableLoaded();

	/**
	 * Create a latch key before clone to identify the specific block being cloned. The block
	 * will not be cloned if it is currently locked for cloning.
	 *
	 * @since    1.1.0
	 *
	 * @param {string} clientId - Current Block Identifier to be cloned
	 * @param {string} postId   - Current post id of post in which the block appears
	 * @param {string} tableId  - Current table id of table in block
	 * @return {boolean} lock - Is the table currently being cloned
	 */
	function acquireCloneLatch({ clientId, postId, tableId }) {
		const key = [clientId || 'no-client', postId || 0, tableId || 0].join(':');

		// If we already cloned for this key, deny.
		if (cloneLatchRef.current.has(key)) {
			return { locked: true };
		}

		// Otherwise lock it now.
		cloneLatchRef.current.add(key);
		return { locked: false };
	}

	/**
	 * Determine Dynamic Tables block originated from a non-sync pattern, and if so,
	 * clone the block and its related table
	 *
	 * @since    1.1.0
	 *
	 * @param {boolean} tableLoaded
	 * @param {Object}  table
	 * @param {string}  postId
	 * @param {boolean} inInserterBlock
	 */
	function checkDuplicateTable(tableLoaded, table, postId, inInserterBlock) {
		const patternName = props.attributes?.metadata?.patternName;
		const isBlockFromPattern = !!patternName;

		// Exit if table is not loaded
		if (!tableLoaded) {
			return false;
		}

		// Exit if table is being created manually
		if (isNewBlock) {
			return false;
		}

		// Inserted post type is not a pattern
		if (original_post_type !== 'wp_block') {
			return false;
		}

		// Inserted Patterns have meta and pattern meta does not load in preview inserter
		if (!isBlockFromPattern) {
			return false;
		}

		if (Number(original_post_id) === Number(postId) && Number(table.post_id) > 0) {
			return false;
		}

		if (inInserterBlock) {
			return false;
		}

		if (Number(table.post_id) === Number(postId)) {
			return false;
		}

		const { locked } = acquireCloneLatch({
			clientId: props.clientId,
			postId,
			tableId: table.table_id,
		});

		if (locked) {
			return false;
		}

		// Verified that this is a clone operation.  Proceed with clone.
		setSaveLock();
		setTableStale(false);
		const cloneBlockTableRef = generateBlockTableRef();
		props.setAttributes({ block_table_ref: cloneBlockTableRef });

		cloneTable(table.table_id, postId, cloneBlockTableRef);
		setAwaitingTableEntityCreation(true);
		return true;
	}

	// Set block original post type if not populated
	if (original_post_type === '') {
		props.setAttributes({ original_post_type: postType });
	}

	// Set block original post id if not populated
	if (Number(original_post_id) === 0) {
		props.setAttributes({ original_post_id: postId });
	}

	const newClonedTableId = checkDuplicateTable(tableLoaded, table, postId, inInserterBlock);

	/**
	 * Synchronize PostId
	 *
	 * Post ID is assigned a value of '0' upon table creation and can change over the life of a post.
	 * props.context is authoritative for Post ID so we ensure the table is sync'd to that.
	 *
	 * @since    1.0.0
	 */
	if (
		tableHasStartedResolving &&
		tableHasFinishedResolving &&
		!awaitingTableEntityCreation &&
		Number(props.context.postId) !== 0 &&
		Number(table.post_id) === 0
	) {
		setTableAttributes(table.table_id, 'post_id', '', 'PROP', String(props.context.postId));
		saveTableEntity(table.table_id);
	}

	/**
	 * Perform clean-up when the block unmounts so that we can reattach it based on the block's
	 * client ID.  We can also determine if the block was deleted if the client no longer exists
	 * when the block is re-mounted.
	 *
	 * This all occurs immediately prior to unmounting the block.
	 */
	const currentStatus = useRef(tableStatus);
	currentStatus.current = tableStatus;

	useEffect(() => {
		return () => {
			// Process table clean-up only if table was loaded
			if (tableLoaded && !isNewBlock && Number(table.table_id) > 0) {
				if (inInserterBlock || original_post_type === 'wp_block') {
					// Set table's prior status to the current status before unmounting
					setTableAttributes(table.table_id, 'isPattern', '', 'PROP', true);
				} else {
					// Set table's prior status to the current status before unmounting
					setTableAttributes(table.table_id, 'prior_status', '', 'PROP', currentStatus.current);

					// Set the table's block identifier so that we can reattach it on remount and update
					// its status to unknown to signify that we won't know what is happening during the
					// time the block is unmounted
					setTableAttributes(table.table_id, 'unmounted_block', '', 'PROP', true);

					// Persist the table with its "unknown" status
					saveTableEntity(table.table_id);
				}
			}
		};
	}, [tableLoaded, inInserterBlock, isNewBlock, original_post_type]);

	const tableColumnLength =
		JSON.stringify(table.table) === '{}' || blockTableStatus == 'None' ? 0 : table.columns.length;
	const tableRowLength =
		JSON.stringify(table.table) === '{}' || blockTableStatus == 'None' ? 0 : table.rows.length;

	/**
	 * Set the initial focus cell when the dynamic table receives focus
	 *
	 * @since    1.1.1
	 */
	useEffect(() => {
		// Only initial focus when table is loaded and nothing focused yet
		if (!gridRef.current) return;

		// If editor already focused something inside, don't steal focus
		if (gridRef.current.contains(document.activeElement)) return;

		focusCell(1, 1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tableLoaded]);

	/**
	 * Set state for number of columns and rows when the number of table rows has changes
	 *
	 * TODO: Verify this is still needed following update to table store to track all tables in editor
	 */
	useEffect(() => {
		if (!isNewBlock) {
			if (tableColumnLength != numColumns) {
				setNumColumns(tableColumnLength);
			}
			if (tableRowLength != numRows) {
				setNumRows(tableRowLength);
			}
		}
	}, [tableColumnLength, tableRowLength]);

	/**
	 * Extract and unpack table attributes
	 */
	const showGridLines = getTablePropAttribute(table.attributes, 'showGridLines');
	const allowHorizontalScroll = getTablePropAttribute(table.attributes, 'allowHorizontalScroll');
	const enableHeaderRow = getTablePropAttribute(table.attributes, 'enableHeaderRow');
	const headerAlignment = getTablePropAttribute(table.attributes, 'headerAlignment');
	const gridHeaderBackgroundColor = getTablePropAttribute(
		table.attributes,
		'tableHeaderBackgroundColor'
	);
	const headerRowSticky = getTablePropAttribute(table.attributes, 'headerRowSticky');
	const headerBorder = getTablePropAttribute(table.attributes, 'headerBorder');
	const bodyAlignment = getTablePropAttribute(table.attributes, 'bodyAlignment');
	const bodyBorder = getTablePropAttribute(table.attributes, 'bodyBorder');
	const bandedRows = getTablePropAttribute(table.attributes, 'bandedRows');
	const bandedTextColor = getTablePropAttribute(table.attributes, 'bandedTextColor');
	const bandedRowBackgroundColor = getTablePropAttribute(
		table.attributes,
		'bandedRowBackgroundColor'
	);
	const gridLineWidth = getTablePropAttribute(table.attributes, 'gridLineWidth');
	const gridAlignment = block_alignment;
	const horizontalAlignment = getTablePropAttribute(table.attributes, 'horizontalAlignment');
	const verticalAlignment = getTablePropAttribute(table.attributes, 'verticalAlignment');
	const hideTitle = getTablePropAttribute(table.attributes, 'hideTitle');

	const defaultDataType = {
		type: 'general',
	};

	const columnDataTypes = useMemo(() => {
		const map = {};

		if (!isNewBlock) {
			table.columns.forEach(({ column_id, attributes }) => {
				map[column_id] = attributes?.columnDataType ? attributes.columnDataType : defaultDataType;
			});
		}
		return map;
	}, [table.columns]);

	/**
	 * Insert a new column in the table.
	 *
	 * @since    1.0.0
	 *
	 * @param {number} tableId  Identifier key for the table
	 * @param {number} columnId Identifier for the table column
	 * @return {Object} Dynamic Table
	 */
	function insertColumn(tableId, columnId) {
		const newColumn = getDefaultColumn(tableId, columnId);
		const tableCells = [];

		for (let i = 0; i < numRows; i++) {
			if (i === 0) {
				const cell = getDefaultCell(tableId, columnId, i, 'Border');
				tableCells.push(cell);
			} else {
				const cell = getDefaultCell(tableId, columnId, i);
				tableCells.push(cell);
			}
		}

		addColumn(tableId, columnId, newColumn, tableCells);
		setTableStale(false);
		return updateTableEntity(tableId);
	}

	/**
	 * Insert a new row in the table.
	 *
	 * @since    1.0.0
	 *
	 * @param {number} tableId Identifier key for the table
	 * @param {number} rowId   Identifier for the table row
	 * @return {Object} Dynamic Table
	 */
	function insertRow(tableId, rowId) {
		const newRow = getDefaultRow(tableId, rowId);
		const tableCells = [];

		for (let i = 0; i < numColumns; i++) {
			if (i === 0) {
				const cell = getDefaultCell(tableId, i, rowId, 'Border');
				// cell.content =
				tableCells.push(cell);
			} else {
				const cell = getDefaultCell(tableId, i, rowId);
				tableCells.push(cell);
			}
		}

		addRow(tableId, rowId, newRow, tableCells);
		setTableStale(false);
		return updateTableEntity(tableId);
	}

	/**
	 * Delete a column from the table
	 *
	 * @param {number} tableId  Identifier key for the table
	 * @param {number} columnId Identifier for the table column
	 * @return {Object} Dynamic Table
	 */
	function deleteColumn(tableId, columnId) {
		removeColumn(tableId, columnId);
		setTableStale(false);
		return updateTableEntity(tableId);
	}

	/**
	 * Delete a column from the table
	 *
	 * @since    1.0.0
	 *
	 * @param {*} tableId
	 * @param {*} rowId
	 * @return {Object} Dynamic Table
	 */
	function deleteRow(tableId, rowId) {
		removeRow(tableId, rowId);
		setTableStale(false);
		return updateTableEntity(tableId);
	}

	/**
	 * Update table store to reflect changes made to EXISTING table attributes.
	 *
	 * @since    1.0.0
	 *
	 * @param {number}                  tableId        Identifier key for the table
	 * @param {string}                  attribute      (table, column, row, cell)
	 * @param {number | null}           id             Column and/or row id
	 * @param {string}                  type           (CONTENT, ATTRIBUTES, CLASSES, PROP)
	 * @param {string | number | Array} value          New value that will replace existing config
	 * @param {boolean}                 [persist=true] Update table entity (not just the table store)
	 */
	function setTableAttributes(tableId, attribute, id, type, value, persist = true) {
		switch (type) {
			case 'CONTENT': {
				if (attribute === 'cell') {
					updateCell(tableId, id, 'content', value);
				}
				break;
			}
			case 'ATTRIBUTES': {
				if (attribute === 'cell') {
					updateCell(tableId, id, 'attributes', value);
				} else if (attribute === 'row') {
					updateRow(tableId, id, 'attributes', value);
				} else if (attribute === 'column') {
					// setColumnAttributes(value);
					updateColumn(tableId, id, 'attributes', value);
				} else if (attribute === 'table') {
					updateTableProp(tableId, 'attributes', value);
				}
				break;
			}
			case 'CLASSES': {
				if (attribute === 'cell') {
					updateCell(tableId, id, 'classes', value);
				} else if (attribute === 'column') {
					updateColumn(tableId, id, 'classes', value);
				}
				break;
			}
			case 'PROP': {
				if (attribute === 'column_name') {
					updateColumn(tableId, id, attribute, value);
				} else {
					updateTableProp(tableId, attribute, value);
					if (attribute === 'prior_status') {
						updateTableEntity(tableId, 'unknown');
					}
				}
				break;
			}

			default:
				console.log('Unrecognized Attibute Type');
		}
		setTableStale(false);

		/**
		 * Update Table Status only. Table change is for status and the
		 * call must bypass the regular persist (persist === false)
		 */
		if (persist) {
			return updateTableEntity(tableId);
		}
	}

	/**
	 * Show or hide column and row borders to support updates to them.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object}  table     Dynamic Table
	 * @param {boolean} isChecked Are borders being toggled on?
	 */
	function onToggleBorders(table, isChecked) {
		let updatedRows;
		let updatedColumns;
		let updatedCells;

		/**
		 * Remove borders if unchecked
		 */
		if (isChecked === false) {
			setNumColumns(prev => prev - 1);
			setNumRows(prev => prev - 1);

			updatedRows = table.rows.filter(row => row.row_id !== '0');
			updatedColumns = table.columns.filter(column => column.column_id !== '0');
			updatedCells = table.cells.filter(cell => cell.row_id !== '0' && cell.column_id !== '0');
			updateTableBorder(table.table_id, updatedRows, updatedColumns, updatedCells);
		} else {
			/**
			 * Create borders if checked
			 */
			setNumColumns(prev => prev + 1);
			setNumRows(prev => prev + 1);

			/**  Create header row border at top of table */
			const rowBorder = [];
			rowBorder.push(getDefaultRow(table_id, 0, 'Border'));

			const rowCells = [];
			for (let i = 0; i <= numColumns; i++) {
				const cell = getDefaultCell(table_id, i, 0, 'Border');
				rowCells.push(cell);
			}

			/** Create column border down left side of table */
			const columnBorder = [];
			columnBorder.push(getDefaultColumn(table_id, 0, 'Border'));

			const columnCells = [];
			for (let i = 1; i <= numRows; i++) {
				const cell = getDefaultCell(table_id, 0, i, 'Border');
				columnCells.push(cell);
			}

			/** Sort table parts */
			updatedRows = tableSort('rows', [...table.rows, ...rowBorder]);
			updatedColumns = tableSort('columns', [...table.columns, ...columnBorder]);
			updatedCells = tableSort('cells', [...table.cells, ...rowCells, ...columnCells]);

			updateTableBorder(table.table_id, updatedRows, updatedColumns, updatedCells);
		}
		setShowBorders(isChecked);
		setTableStale(false);
	}

	/**
	 * Create new table and related table entity.
	 *
	 * @since    1.0.0
	 *
	 * @param {number} columnCount Number of columns in table
	 * @param {number} rowCount    Number of rows in table
	 * @param {string} tableName   Name of new table
	 */
	function createTable(columnCount, rowCount, tableName) {
		setTableStale(false);
		const newBlockTableRef = generateBlockTableRef();
		const newTable = initTable(newBlockTableRef, columnCount, rowCount, tableName);

		props.setAttributes({ block_table_ref: newBlockTableRef });
		receiveNewTable(newTable);
		setAwaitingTableEntityCreation(true);
		createTableEntity();
	}

	/**
	 * Process event to create new table.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} event Table Creation Event
	 */
	function onCreateTable(event) {
		event.preventDefault();
		createTable(numColumns, numRows, tableName);
	}

	/**
	 * Process changes for the column count when defining a new table creation.
	 *
	 * @since    1.0.0
	 *
	 * @param {number} num_columns Number of columns entered in form
	 */
	function onChangeInitialColumnCount(num_columns) {
		let newNumColumns = num_columns;
		if (num_columns < 1 || num_columns > 50) {
			const errorText =
				'Cannot have ' +
				num_columns +
				' columns.  You must have at least 1 and no more than 50 columns.';
			createNotice('error', errorText, {
				id: 'invalidNumColumns',
				isDismissible: true,
				politeness: 'assertive',
			});

			newNumColumns = Number(numColumns);
		} else {
			removeNotice('invalidNumColumns');
		}
		setNumColumns(newNumColumns);
	}

	/**
	 * Process changes for the row count when defining a new table creation.
	 *
	 * @since    1.0.0
	 *
	 * @param {number} num_rows Number of rows entered in form
	 */
	function onChangeInitialRowCount(num_rows) {
		let newNumRows = num_rows;
		if (num_rows < 1 || num_rows > 1000) {
			const errorText =
				'Cannot have ' + num_rows + ' rows.  You must have at least 1 and no more than 1,000 rows.';
			createNotice('error', errorText, {
				id: 'invalidNumRows',
				isDismissible: true,
				politeness: 'assertive',
			});

			newNumRows = Number(numRows);
		} else {
			removeNotice('invalidNumRows');
		}
		setNumRows(newNumRows);
	}

	/**
	 * Update cell data when changed.
	 *
	 * @since 1.2.0
	 *
	 * @param {number} table_id Current table id
	 * @param {number} cell_id  Updated cell id
	 * @param {Object} patch    Update payload to store
	 */
	function onChangeCellData(table_id, cell_id, patch) {
		setTableAttributes(table_id, 'cell', cell_id, 'CONTENT', patch.content);
		setTableAttributes(table_id, 'cell', cell_id, 'ATTRIBUTES', patch.attributes);
	}

	/**
	 * Sets the focused cell state when a cell in the dynamic table receives focus.
	 *
	 * @since    1.1.1
	 *
	 * @param {Object} event onFocusCapture event
	 * @return {void}
	 */
	function onGridFocusCapture(event) {
		const el = event.target.closest?.('[data-cell-id]');
		if (!el) return;

		const col = Number(el.dataset.col);
		const row = Number(el.dataset.row);
		if (!Number.isFinite(col) || !Number.isFinite(row)) return;

		// Only sync highlight; do not move focus, do not gate with pending flags
		setFocusedCell(prev => (prev.col === col && prev.row === row ? prev : { col, row }));

		// If focus moved to another cell wrapper, stop editing.
		const nextCellId = el.getAttribute('data-cell-id');
		if (editingCellId && String(editingCellId) !== String(nextCellId)) {
			setEditingCellId(null);
		}
	}

	/**
	 * Set focus to specified cell coordinates in the dynamic table.
	 *
	 * @since    1.1.1
	 *
	 * @param {number} col Column number of the cell in which the focus action occured
	 * @param {number} row Row number of the cell in which the focus action occured
	 * @return {boolean} Was focus successful?
	 */
	function focusCell(col, row) {
		const root = gridRef.current;
		if (!root) return false;

		const el = root.querySelector(`[data-cell-id][data-col="${col}"][data-row="${row}"]`);
		if (!el) return false;

		// roving tabindex
		root.querySelectorAll('[data-cell-id][tabindex="0"]').forEach(node => {
			if (node !== el) node.tabIndex = -1;
		});
		el.tabIndex = 0;

		// keep highlight in sync with intended focus target
		setFocusedCell(prev => (prev.col === col && prev.row === row ? prev : { col, row }));

		// Focusing on next frame helps if DOM is mid-rerender
		window.requestAnimationFrame(() => {
			el.focus();
		});

		return true;
	}

	const navMaxCol = useMemo(() => {
		// exclude border column 0
		return Math.max(
			1,
			...table.columns.map(c => Number(c.column_id)).filter(n => Number.isFinite(n) && n > 0)
		);
	}, [table.columns]);

	const navMaxRow = useMemo(() => {
		// exclude border row 0
		return Math.max(
			1,
			...table.rows.map(r => Number(r.row_id)).filter(n => Number.isFinite(n) && n > 0)
		);
	}, [table.rows]);

	/**
	 * Handle keyboard navigation within the active dynamic table block and updates focus appropriately
	 *
	 * @since    1.1.1
	 *
	 * @param {Object} event onKeyDown event
	 * @return {void}
	 */
	function onCellKeyDown(event) {
		// If editing, only handle Escape here; let the editor handle arrows, delete, etc.
		console.log('ENTERING KEY DOWN');
		if (editingCellId) {
			if (event.key === 'Escape') {
				event.preventDefault();
				event.stopPropagation();
				setEditingCellId(null);
				window.requestAnimationFrame(() => {
					const wrapper = gridRef.current?.querySelector(`[data-cell-id][tabindex="0"]`);
					wrapper?.focus?.();
				});
			}
			return;
		}

		const root = gridRef.current;
		if (!root) return;

		const doc = root.ownerDocument || document;
		const active = doc.activeElement;
		const activeCellEl = active?.closest?.('[data-cell-id]');

		if (!activeCellEl || !root.contains(activeCellEl)) return;

		let col = Number(activeCellEl.dataset.col);
		let row = Number(activeCellEl.dataset.row);
		if (!Number.isFinite(col) || !Number.isFinite(row)) return;

		const navKeys = new Set([
			'ArrowUp',
			'ArrowDown',
			'ArrowLeft',
			'ArrowRight',
			'Tab',
			'Enter',
			'F2',
			'Escape',
			'Delete',
			'Backspace',
		]);

		console.log('Column Data Type');
		const columnDataType = columnDataTypes[col].type;
		// const isHeaderRow = table.rows[Number(row)].attributes.isHeader;
		const isHeaderRow = table.rows.find(r => Number(r.row_id) === row).attributes.isHeader;
		console.log('Is Header Cell ? ', isHeaderRow);

		// Allow direct edit for printable keys
		if (!navKeys.has(event.key) && isPrintableKey(event)) {
			if (columnDataType === 'general' || isHeaderRow) {
				// Enter edit mode
				console.log('Coordinates: col/row = ' + col + '/' + row);
				onCellKeyDownEditing(event, activeCellEl, event.key);
				return;
			}
		}

		// Enter edit mode
		if (event.key === 'Enter' || event.key === 'F2') {
			event.preventDefault();
			event.stopPropagation();
			const id = activeCellEl.getAttribute('data-cell-id');
			setEditingCellId(id);
			window.requestAnimationFrame(() => {
				activeCellEl?.querySelector?.('[contenteditable="true"], input, textarea')?.focus?.();
			});
			return;
		}

		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			// no-op when not editing
			return;
		}

		// Delete/backspace clears cell
		if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();
			event.stopPropagation();

			const cellData = table.cells.find(
				c => Number(c.column_id) === col && Number(c.row_id) === row
			);
			if (cellData) {
				const attrs = {
					...(cellData.attributes || {}),
					value: { ...((cellData.attributes && cellData.attributes.value) || {}) },
				};
				setTableAttributes(table_id, 'cell', cellData.cell_id, 'CONTENT', '');
				setTableAttributes(table_id, 'cell', cellData.cell_id, 'ATTRIBUTES', attrs);
			}
			return;
		}

		// console.log('current coordinates: col = ' + col + ', row = ' + row);

		// Intercept navigation
		event.preventDefault();
		event.stopPropagation();

		switch (event.key) {
			case 'ArrowUp':
				row = Math.max(1, row - 1);
				break;
			case 'ArrowDown':
				row = Math.min(navMaxRow, row + 1);
				break;
			case 'ArrowLeft':
				col = Math.max(1, col - 1);
				break;
			case 'ArrowRight':
				col = Math.min(navMaxCol, col + 1);
				break;
			case 'Tab':
				if (event.shiftKey) {
					if (col > 1) col -= 1;
					else if (row > 1) {
						row -= 1;
						col = navMaxCol;
					}
				} else {
					// eslint-disable-next-line no-lonely-if
					if (col < navMaxCol) {
						col = Math.min(navMaxCol, col + 1);
					} else if (col === navMaxCol && row < navMaxRow) {
						row += 1;
						col = 1;
					}
				}
				break;

			default:
				console.log('Key Code = ' + event.key);
				return;
		}

		console.log('new coordinates: col = ' + col + ', row = ' + row);
		focusCell(col, row);
	}

	/**
	 * Identify if key press was a printable character
	 *
	 * @since    1.2.0
	 *
	 * @param {Object} event onKeyDown event
	 * @return {boolean}     Is Key Press a printable character?
	 */
	function isPrintableKey(event) {
		// Ignore modifier combos and IME composition
		if (event.ctrlKey || event.metaKey || event.altKey) return false;
		if (event.isComposing || event.key === 'Process') return false;

		// Printable characters are usually length 1 (includes space)
		return typeof event.key === 'string' && event.key.length === 1;
	}

	/**
	 * Handle transition from navigation to editing on grid cell
	 *
	 * @since    1.2.0
	 *
	 * @param {Object} event        onKeyDown event
	 * @param {Object} activeCellEl Current cell element
	 * @param {string} char         Key pressed
	 */
	function onCellKeyDownEditing(event, activeCellEl, char) {
		event.preventDefault();
		event.stopPropagation();

		const id = activeCellEl.getAttribute('data-cell-id');
		setEditingCellId(id);

		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => {
				console.log('Processing edit key stroke');
				const doc = activeCellEl.ownerDocument;
				const editable = activeCellEl.querySelector('[contenteditable="true"]');
				const input = activeCellEl.querySelector('input, textarea');
				console.log('doc');
				console.log(doc);
				console.log('input');
				console.log(input);

				if (editable) {
					console.log('Processing Editable');
					editable.focus();

					// Move caret to END of contenteditable
					const sel = doc.getSelection();
					const range = doc.createRange();
					range.selectNodeContents(editable);
					range.collapse(false);
					sel.removeAllRanges();
					sel.addRange(range);

					// Insert text at caret
					// execCommand is deprecated but still the most compatible for contenteditable insertion
					if (doc.queryCommandSupported?.('insertText')) {
						doc.execCommand('insertText', false, char);
					} else {
						range.insertNode(doc.createTextNode(char));
						range.collapse(false);
						sel.removeAllRanges();
						sel.addRange(range);
					}
					return;
				}

				if (input) {
					console.log('Input');
					input.focus();

					const v = input.value ?? '';
					input.value = v + char;

					// Make React/Gutenberg notice the change
					input.dispatchEvent(new Event('input', { bubbles: true }));

					// Caret to end
					const end = input.value.length;
					input.setSelectionRange?.(end, end);
				}
			});
		});
	}

	/**
	 * Process updates (insert, update, delete) to a table column.
	 *
	 * @since    1.0.0
	 * @since    1.1.1  Updated to support row menu refactor.
	 *
	 * @param {Object} e                       Table Creation Event
	 * @param {string} updateType              attribute (Update), insert, delete
	 * @param {string} columnName              Column name
	 * @param {number} tableId                 Identifier key for the table
	 * @param {number} columnId                Identifier for the table column
	 * @param {Array}  updatedColumnAttributes New column attribute values
	 */
	function onUpdateColumn(
		e,
		updateType,
		tableId,
		columnId,
		updatedColumnAttributes,
		columnName = ''
	) {
		switch (updateType) {
			case 'attributes': {
				if (!updatedColumnAttributes) {
					const clickedColumn = table.columns.find(c => c.column_id === columnId);
					const attrs = clickedColumn?.attributes || {};
					const columnLabel = clickedColumn?.column_name || String(columnId);
					openColumnWidthModal(e, columnId, columnLabel, attrs);
				} else {
					setTableAttributes(tableId, 'column', columnId, 'ATTRIBUTES', updatedColumnAttributes);
				}
				break;
			}
			case 'dataType': {
				if (!updatedColumnAttributes) {
					const clickedColumn = table.columns.find(c => c.column_id === columnId);
					const attrs = clickedColumn?.attributes || {};
					const columnLabel = clickedColumn?.column_name || String(columnId);
					openColumnDataTypeModal(e, columnId, columnLabel, attrs);
				} else {
					setTableAttributes(tableId, 'column', columnId, 'ATTRIBUTES', updatedColumnAttributes);
					setTableAttributes(tableId, 'column_name', columnId, 'PROP', columnName);
				}
				break;
			}
			case 'insert': {
				insertColumn(tableId, columnId);
				break;
			}
			case 'delete': {
				deleteColumn(tableId, columnId);
				break;
			}
			default:
				console.log('Unrecognized Column Update Type');
		}
	}

	/**
	 * Update table row based on row menu actions.
	 *
	 * Descrption: Current actions include row insert, delete, update height.
	 *
	 * @since    1.0.0
	 * @since    1.1.1  Updated to support row menu refactor.
	 * @since    1.2.2  Added actions to move a row up or down
	 *
	 * @param {Object} e                    Table Creation Event
	 * @param {string} updateType           attribute (Update), insert, delete
	 * @param {number} tableId              Identifier key for the table
	 * @param {number} rowId                Identifier for the table row
	 * @param {Array}  updatedRowAttributes New row attribute values
	 */
	function onUpdateRow(e, updateType, tableId, rowId, updatedRowAttributes) {
		switch (updateType) {
			case 'attributes': {
				if (!updatedRowAttributes) {
					const clickedRow = table.rows.find(r => r.row_id === rowId);
					const attrs = clickedRow?.attributes || {};
					openRowHeightModal(e, rowId, String(rowId), attrs);
				} else {
					setTableAttributes(tableId, 'row', rowId, 'ATTRIBUTES', updatedRowAttributes);
				}
				break;
			}
			case 'insert': {
				insertRow(tableId, rowId);
				break;
			}
			case 'delete': {
				deleteRow(tableId, rowId);
				break;
			}
			case 'move-up': {
				moveRow(tableId, rowId, 'up');
				break;
			}
			case 'move-down': {
				moveRow(tableId, rowId, 'down');
				break;
			}
			default:
				console.log('Unrecognized Row Update Type');
		}
	}

	/**
	 * Process mouse clicks on the table borders.
	 *
	 * @since    1.0.0
	 *
	 * @param {number} column_id Identifier for the table column
	 * @param {number} row_id    Identifier for the table row
	 * @param {Object} table     Dynamic Table
	 * @param {Object} e         Mouse Click Event
	 */
	function onMouseBorderClick(column_id, row_id, table, e) {
		e?.preventDefault?.();
		e?.stopPropagation?.();

		if (row_id === '0' && column_id !== '0') {
			const clickedColumn = table.columns.find(c => c.column_id === column_id);
			const attrs = clickedColumn?.attributes || {};
			openColumnMenu(e, column_id, String(column_id), attrs);
		}

		if (row_id !== '0' && column_id === '0') {
			const clickedRow = table.rows.find(r => r.row_id === row_id);
			const attrs = clickedRow?.attributes || {};
			openRowMenu(e, row_id, String(row_id), attrs);
		}
		setTableStale(false);
	}

	/**
	 * Process request to prevent the table title from displaying
	 *
	 * @since    1.0.0
	 *
	 * @param {Object}  table     Dynamic Table
	 * @param {boolean} isChecked Is the table title being hidden?
	 */
	function onHideTitle(table, isChecked) {
		const updatedTableAttributes = {
			...table.attributes,
			hideTitle: isChecked,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process request to allow the table to scroll horizontally
	 *
	 * @since    1.0.0
	 *
	 * @param {Object}  table     Dynamic Table
	 * @param {boolean} isChecked Show horizontal scroll bar if appropriate?
	 */
	function onAllowHorizontalScroll(table, isChecked) {
		const updatedTableAttributes = {
			...table.attributes,
			allowHorizontalScroll: isChecked,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process request to show banded even numbered table rows
	 *
	 * @since    1.0.0
	 *
	 * @param {Object}  table     Dynamic Table
	 * @param {boolean} isChecked Show banded table rows?
	 */
	function onShowBandedRows(table, isChecked) {
		const updatedTableAttributes = {
			...table.attributes,
			bandedRows: isChecked,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process requests for specific background and text colors on banded table rows
	 *
	 * @param {Object} table Dynamic Table
	 * @param {string} type  Attribute to be colored (background, text)
	 * @param {string} color New color code (hex)
	 */
	function onBandedRowColor(table, type, color) {
		let updatedTableAttributes = '';
		if (type == 'background') {
			updatedTableAttributes = {
				...table.attributes,
				bandedRowBackgroundColor: color,
			};
			setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
		}

		if (type == 'text') {
			updatedTableAttributes = {
				...table.attributes,
				bandedTextColor: color,
			};
			setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
		}
	}

	/**
	 * Process request create a header row from the first table row.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object}  table     Dynamic Table
	 * @param {boolean} isChecked Create a header row
	 */
	function onEnableHeaderRow(table, isChecked) {
		const updatedTableAttributes = {
			...table.attributes,
			enableHeaderRow: isChecked,
			headerRowSticky: false,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);

		const updatedRowAttributes = {
			...table.rows.find(x => x.row_id === '1').attributes,
			isHeader: isChecked ? true : false,
		};
		setTableAttributes(table.table_id, 'row', '1', 'ATTRIBUTES', updatedRowAttributes);
	}

	/**
	 * Process request to align header column content horizontally.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} table     Dynamic Table
	 * @param {string} alignment The alignment position (left, center, right)
	 */
	function onAlignHeader(table, alignment) {
		const updatedTableAttributes = {
			...table.attributes,
			headerAlignment: alignment,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process request to syle header row borders.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} table  Dynamic Table
	 * @param {Array}  border Outside header border color, width, style
	 */
	function onHeaderBorder(table, border) {
		const updatedTableAttributes = {
			...table.attributes,
			headerBorder: border,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process request to make the header row sticky with vertical scroll.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object}  table     Dynamic Table
	 * @param {boolean} isChecked Make header row sticky
	 */
	function onHeaderRowSticky(table, isChecked) {
		const updatedTableAttributes = {
			...table.attributes,
			headerRowSticky: isChecked,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process request to align body column content horizontally.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} table     Dynamic Table
	 * @param {string} alignment The alignment position (left, center, right)
	 */
	function onAlignBody(table, alignment) {
		const updatedTableAttributes = {
			...table.attributes,
			bodyAlignment: alignment,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process request to syle body row borders.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} table  Dynamic Table
	 * @param {Array}  border Outside body border color, width, style
	 */
	function onBodyBorder(table, border) {
		const updatedTableAttributes = {
			...table.attributes,
			bodyBorder: border,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process request to show inner body row grid lines.
	 *
	 * @since    1.0.0
	 *
	 * @param {Object}  table     Dynamic Table
	 * @param {boolean} isChecked Show inner body row grid lines
	 */
	function onShowGridLines(table, isChecked) {
		const updatedTableAttributes = {
			...table.attributes,
			showGridLines: isChecked,
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Process request to set grid line width
	 *
	 * @since    1.0.0
	 *
	 * @param {Object} table         Dynamic Table
	 * @param {string} gridLineWidth Width of grid lines in pixels
	 */
	function onGridLineWidth(table, gridLineWidth) {
		const updatedTableAttributes = {
			...table.attributes,
			gridLineWidth: Number(gridLineWidth),
		};
		setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
	}

	/**
	 * Set variables used to render the dynamic table
	 */
	const gridColumnStyle = processColumns(
		isNewBlock,
		tableIsResolving,
		enableFutureFeatures,
		table.columns
	);

	const gridHeaderRowStyle = processHeaderRow(isNewBlock, tableIsResolving, table.rows);
	const gridBodyRowStyle = processBodyRows(isNewBlock, tableIsResolving, table.rows);
	const startGridHeaderRowNbrStyle = showBorders ? 2 : 1;

	const endGridHeaderRowNbrStyle = endGridRowNbr(
		1,
		'Header',
		numRows,
		enableHeaderRow,
		showBorders,
		false
	);

	const startGridBodyRowNbrStyle = startGridRowNbr(enableHeaderRow, showBorders);

	const endGridBodyRowNbrStyle = endGridRowNbr(
		startGridBodyRowNbrStyle,
		'Body',
		numRows,
		enableHeaderRow,
		showBorders,
		false
	);

	const horizontalScrollStyle = allowHorizontalScroll ? 'auto' : 'hidden';

	const gridBandedRowTextColor = gridBandedRowTextColorStyle(
		isNewBlock,
		tableIsResolving,
		bandedTextColor
	);

	const gridBandedRowBackgroundColor = gridBandedRowBackgroundColorStyle(
		isNewBlock,
		tableIsResolving,
		bandedRowBackgroundColor
	);

	const gridShowInnerLines = gridInnerBorderStyle(isNewBlock, tableIsResolving, showGridLines);

	const gridInnerLineWidth = gridInnerBorderWidthStyle(
		isNewBlock,
		tableIsResolving,
		showGridLines,
		gridLineWidth
	);

	const headerRowStickyStyle = headerRowSticky ? 'auto' : 'hidden';
	const headerRowStickyClass = headerRowSticky ? 'grid-control__header--sticky ' : '';

	const gridHeaderBackgroundColorStyle = getGridHeaderBackgroundColorStyle(
		isNewBlock,
		tableIsResolving,
		gridHeaderBackgroundColor,
		blockProps.style.backgroundColor
	);

	/**
	 * Header Styling
	 */
	const headerTextAlignmentStyle = getHeaderTextAlignmentStyle(
		isNewBlock,
		tableIsResolving,
		headerAlignment
	);
	const headerBorderStyleType = getBorderStyleType(headerBorder);

	// Top header border
	const headerBorderTopColor = getBorderStyle(headerBorder, 'top', 'color', headerBorderStyleType);
	const headerBorderTopStyle = getBorderStyle(headerBorder, 'top', 'style', headerBorderStyleType);
	const headerBorderTopWidth = getBorderStyle(headerBorder, 'top', 'width', headerBorderStyleType);

	// Right header border
	const headerBorderRightColor = getBorderStyle(
		headerBorder,
		'right',
		'color',
		headerBorderStyleType
	);
	const headerBorderRightStyle = getBorderStyle(
		headerBorder,
		'right',
		'style',
		headerBorderStyleType
	);
	const headerBorderRightWidth = getBorderStyle(
		headerBorder,
		'right',
		'width',
		headerBorderStyleType
	);

	// Bottom header border
	const headerBorderBottomColor = getBorderStyle(
		headerBorder,
		'bottom',
		'color',
		headerBorderStyleType
	);
	const headerBorderBottomStyle = getBorderStyle(
		headerBorder,
		'bottom',
		'style',
		headerBorderStyleType
	);
	const headerBorderBottomWidth = getBorderStyle(
		headerBorder,
		'bottom',
		'width',
		headerBorderStyleType
	);

	// Left header border
	const headerBorderLeftColor = getBorderStyle(
		headerBorder,
		'left',
		'color',
		headerBorderStyleType
	);
	const headerBorderLeftStyle = getBorderStyle(
		headerBorder,
		'left',
		'style',
		headerBorderStyleType
	);
	const headerBorderLeftWidth = getBorderStyle(
		headerBorder,
		'left',
		'width',
		headerBorderStyleType
	);

	/**
	 * Body Styling
	 */
	const bodyTextAlignmentStyle = getHeaderTextAlignmentStyle(
		isNewBlock,
		tableIsResolving,
		bodyAlignment
	);
	const bodyBorderStyleType = getBorderStyleType(bodyBorder);
	// Top body border
	const bodyBorderTopColor = getBorderStyle(bodyBorder, 'top', 'color', bodyBorderStyleType);
	const bodyBorderTopStyle = getBorderStyle(bodyBorder, 'top', 'style', bodyBorderStyleType);
	const bodyBorderTopWidth = getBorderStyle(bodyBorder, 'top', 'width', bodyBorderStyleType);

	// Right body border
	const bodyBorderRightColor = getBorderStyle(bodyBorder, 'right', 'color', bodyBorderStyleType);
	const bodyBorderRightStyle = getBorderStyle(bodyBorder, 'right', 'style', bodyBorderStyleType);
	const bodyBorderRightWidth = getBorderStyle(bodyBorder, 'right', 'width', bodyBorderStyleType);

	// Bottom body border
	const bodyBorderBottomColor = getBorderStyle(bodyBorder, 'bottom', 'color', bodyBorderStyleType);
	const bodyBorderBottomStyle = getBorderStyle(bodyBorder, 'bottom', 'style', bodyBorderStyleType);
	const bodyBorderBottomWidth = getBorderStyle(bodyBorder, 'bottom', 'width', bodyBorderStyleType);

	// Left body border
	const bodyBorderLeftColor = getBorderStyle(bodyBorder, 'left', 'color', bodyBorderStyleType);
	const bodyBorderLeftStyle = getBorderStyle(bodyBorder, 'left', 'style', bodyBorderStyleType);
	const bodyBorderLeftWidth = getBorderStyle(bodyBorder, 'left', 'width', bodyBorderStyleType);

	/**
	 * Render clickable row menu
	 *
	 * @since 1.2.0
	 */
	const renderRowMenu = (
		<>
			{rowMenu.isOpen && rowMenu.anchorEl && (
				<RowMenu
					anchor={rowMenu.anchorEl}
					table={table}
					rowId={rowMenu.rowId}
					rowLabel={rowMenu.rowLabel}
					rowAttributes={rowMenu.rowAttributes}
					updatedRow={onUpdateRow}
					onRequestClose={closeRowMenu}
				/>
			)}
		</>
	);

	/**
	 * Render row height dialog box
	 *
	 * @since 1.2.0
	 */
	const renderRowHeightModal = (
		<>
			{rowHeightModal.isOpen && (
				<RowHeightModal
					tableId={table_id}
					rowId={rowHeightModal.rowId}
					rowLabel={rowHeightModal.rowLabel}
					rowAttributes={rowHeightModal.rowAttributes}
					updatedRow={onUpdateRow}
					onRequestClose={closeRowHeightModal}
				/>
			)}
		</>
	);

	/**
	 * Render clickable column menu
	 *
	 * @since 1.2.0
	 */
	const renderColumnMenu = (
		<>
			{columnMenu.isOpen && columnMenu.anchorEl && (
				<ColumnMenu
					debugSource="EDIT_TOP_LEVEL"
					anchor={columnMenu.anchorEl}
					tableId={table_id}
					columnId={columnMenu.columnId}
					columnLabel={columnMenu.columnLabel}
					columnAttributes={columnMenu.columnAttributes}
					updatedColumn={onUpdateColumn}
					onRequestClose={closeColumnMenu}
				/>
			)}
		</>
	);

	/**
	 * Render column data content type menu
	 *
	 * @since 1.2.0
	 */
	const renderColumnDataTypeModal = (
		<>
			{columnDataTypeModal.isOpen && (
				<ColumnDataTypeModal
					tableId={table_id}
					columnId={columnDataTypeModal.columnId}
					columnLabel={columnDataTypeModal.columnLabel}
					columnAttributes={columnDataTypeModal.columnAttributes}
					enableProFeatures={enableProFeatures}
					updatedColumn={onUpdateColumn}
					onRequestClose={closeColumnDataTypeModal}
				/>
			)}
		</>
	);

	/**
	 * Render column width dialog box
	 *
	 * @since 1.2.0
	 */
	const renderColumnWidthModal = (
		<>
			{columnWidthModal.isOpen && (
				<ColumnWidthModal
					tableId={table_id}
					columnId={columnWidthModal.columnId}
					columnLabel={columnWidthModal.columnLabel}
					columnAttributes={columnWidthModal.columnAttributes}
					enableProFeatures={enableProFeatures}
					updatedColumn={onUpdateColumn}
					onRequestClose={closeColumnWidthModal}
				/>
			)}
		</>
	);

	/**
	 * Render inspector controls side panel
	 *
	 * @since 1.2.0
	 *
	 * @param {Object} e Change event
	 */
	const renderControls = (
		<>
			<BlockControls>
				<BlockAlignmentToolbar
					value={block_alignment}
					onChange={e => props.setAttributes({ block_alignment: e })}
				/>
			</BlockControls>

			<InspectorControls>
				<Panel>
					<PanelBody title="Definition" initialOpen={true}>
						<PanelRow>
							<div className="grid-control__inspector-controls--read-only">
								<span className="grid-control__inspector-controls--read-only-label">
									Table Name:
								</span>
								{htmlToText(table.table_name)}
							</div>
						</PanelRow>

						<PanelRow>
							<div className="grid-control__inspector-controls--read-only">
								<span className="grid-control__inspector-controls--read-only-label">
									Table Columns/Rows:
								</span>
								{numColumns}/{numRows}
							</div>
						</PanelRow>

						<PanelRow>
							<CheckboxControl
								label="Show table borders"
								__nextHasNoMarginBottom
								checked={showBorders}
								onChange={e => onToggleBorders(table, e)}
							/>
						</PanelRow>

						<PanelRow>
							<CheckboxControl
								label="Hide Table Title"
								__nextHasNoMarginBottom
								checked={hideTitle}
								onChange={e => onHideTitle(table, e)}
							/>
						</PanelRow>
					</PanelBody>

					<PanelBody title="Table Header" initialOpen={false}>
						<PanelRow>
							<CheckboxControl
								label="First Row as Header?"
								__nextHasNoMarginBottom
								checked={enableHeaderRow}
								onChange={e => onEnableHeaderRow(table, e)}
							/>
						</PanelRow>

						<PanelRow>
							<CheckboxControl
								label="Freeze Header Row?"
								__nextHasNoMarginBottom
								disabled={!enableHeaderRow}
								checked={headerRowSticky}
								onChange={e => onHeaderRowSticky(table, e)}
							/>
						</PanelRow>

						<PanelRow>
							<span className="inspector-controls-menu__header-alignment--middle">
								<AlignmentControl
									id="header-alignment"
									value={headerAlignment}
									onChange={e => onAlignHeader(table, e)}
								/>
								<label
									className="inspector-controls-nemu__label--left-margin"
									htmlFor="header-alignment"
								>
									Text Alignment
								</label>
							</span>
						</PanelRow>

						<PanelRow>
							<BorderBoxControl
								className="border-box-workaround"
								__next40pxDefaultSize
								__experimentalIsRenderedInSidebar
								label="Borders"
								// hideLabelFromVision="false"
								isCompact="true"
								colors={borderBoxColors}
								value={headerBorder}
								onChange={e => onHeaderBorder(table, e)}
							/>
						</PanelRow>
					</PanelBody>

					<PanelBody title="Table Body" initialOpen={false}>
						<PanelRow>
							<CheckboxControl
								label="Allow Horizontal Acroll?"
								__nextHasNoMarginBottom
								checked={allowHorizontalScroll}
								onChange={e => onAllowHorizontalScroll(table, e)}
							/>
						</PanelRow>

						<PanelRow>
							<span className="inspector-controls-menu__header-alignment--middle">
								<AlignmentControl
									id="body-alignment"
									value={bodyAlignment}
									onChange={e => onAlignBody(table, e)}
								/>
								<label
									className="inspector-controls-menu__label--left-margin"
									htmlFor="body-alignment"
								>
									Text Alignment
								</label>
							</span>
						</PanelRow>

						<PanelRow>
							<BorderBoxControl
								className="border-box-workaround"
								label="Borders"
								hideLabelFromVision="false"
								isCompact="true"
								colors={borderBoxColors}
								value={bodyBorder}
								onChange={e => onBodyBorder(table, e)}
							/>
						</PanelRow>
					</PanelBody>
				</Panel>
			</InspectorControls>

			<InspectorControls group="styles">
				<PanelBody title="Banded Table Rows" initialOpen={false}>
					<PanelRow>
						<CheckboxControl
							label="Display Banded Rows"
							__nextHasNoMarginBottom
							checked={bandedRows}
							// checked={true}
							onChange={e => onShowBandedRows(table, e)}
						/>
					</PanelRow>
					<PanelColorSettings
						__experimentalIsRenderedInSidebar
						title={'Banded Row Color'}
						colors={themeColors}
						colorSettings={[
							{
								value: bandedTextColor,
								onChange: newColor => onBandedRowColor(table, 'text', newColor),
								label: 'Text',
							},
							{
								value: bandedRowBackgroundColor,
								onChange: newColor => onBandedRowColor(table, 'background', newColor),
								label: 'Background',
							},
						]}
					/>
				</PanelBody>

				<PanelBody title="Grid Lines" initialOpen={false}>
					<PanelRow>
						<CheckboxControl
							label="Display Inner Grid Lines"
							__nextHasNoMarginBottom
							checked={showGridLines}
							onChange={e => onShowGridLines(table, e)}
						/>
					</PanelRow>

					<PanelRow>
						<NumberControl
							label="Inner Grid Line Width"
							value={gridLineWidth}
							labelPosition="side"
							onChange={e => onGridLineWidth(table, e)}
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			<InspectorControls group="typography"></InspectorControls>
		</>
	);

	return (
		<div {...blockProps}>
			{/* Render an existing table after it has been fetched  */}
			{!isNewBlock && !tableIsResolving && (
				<>
					{renderRowMenu}
					{renderRowHeightModal}
					{renderColumnMenu}
					{renderColumnDataTypeModal}
					{renderColumnWidthModal}
					{renderControls}

					<div style={{ display: 'block' }}>
						{!hideTitle && (
							<RichText
								id="tableTitle"
								style={{ '--gridAlignment': gridAlignment }}
								tagName="p"
								allowedFormats={['core/bold', 'core/italic']}
								onChange={e => setTableAttributes(table_id, 'table_name', '', 'PROP', e)}
								value={table.table_name}
							></RichText>
						)}

						<div
							ref={gridRef}
							onKeyDownCapture={onCellKeyDown} // <-- capture phase
							onFocusCapture={onGridFocusCapture}
							tabIndex={0}
						>
							<div
								className="grid-scroller"
								style={{
									'--headerRowSticky': headerRowStickyStyle,
									// "--startGridBodyRowNbr": startGridBodyRowNbrStyle,
									// "--endGridBodyRowNbr": endGridBodyRowNbrStyle
								}}
							>
								<div
									className={'grid-control ' + headerRowStickyClass}
									style={{
										'--gridTemplateColumns': gridColumnStyle,
										'--horizontalScroll': horizontalScrollStyle,
										'--headerRowSticky': headerRowStickyStyle,
										'--gridNumColumns': numColumns,
										'--gridNumRows': numRows,
										'--gridAlignment': gridAlignment,
									}}
								>
									{/* Render Table Border Row if present */}
									{showBorders && (
										<div className={'grid-control__border'}>
											{table.cells
												.filter(cell => cell.attributes.border && cell.row_id === '0')
												.map(
													({
														table_id,
														row_id,
														column_id,
														cell_id,
														content,
														attributes,
														classes,
													}) => {
														const borderContent = setBorderContent(row_id, column_id, content);
														const isFirstColumn = column_id === '1' ? true : false;
														return (
															<Fragment key={`border-row:${cell_id}`}>
																{/* Show zoom to details column */}
																{isFirstColumn && enableFutureFeatures && (
																	<div className={'grid-control__border-cells'} />
																)}

																<Cell
																	cellType="border"
																	dataFormat={columnDataTypes[column_id]}
																	cell_id={cell_id}
																	table={table}
																	table_id={table_id}
																	row_id={row_id}
																	column_id={column_id}
																	content={borderContent}
																	attributes={attributes}
																	className={classes}
																	onMouseDown={onMouseBorderClick}
																></Cell>
															</Fragment>
														);
													}
												)}
										</div>
									)}

									{/* Render Table Header Row if present */}
									{table.rows
										.filter(row => row.attributes.isHeader === true)
										.map(({ row_id }) => {
											const renderedRow = row_id;
											return (
												<div
													key={`header-row:${row_id}`}
													className="grid-control__header"
													style={{
														'--gridTemplateHeaderRows': gridHeaderRowStyle,
														'--startGridHeaderRowNbr': startGridHeaderRowNbrStyle,
														'--endGridHeaderRowNbr': endGridHeaderRowNbrStyle,
														'--headerBorderTopColor': headerBorderTopColor,
														'--headerBorderTopStyle': headerBorderTopStyle,
														'--headerBorderTopWidth': headerBorderTopWidth,
														'--headerBorderRightColor': headerBorderRightColor,
														'--headerBorderRightStyle': headerBorderRightStyle,
														'--headerBorderRightWidth': headerBorderRightWidth,
														'--headerBorderBottomColor': headerBorderBottomColor,
														'--headerBorderBottomStyle': headerBorderBottomStyle,
														'--headerBorderBottomWidth': headerBorderBottomWidth,
														'--headerBorderLeftColor': headerBorderLeftColor,
														'--headerBorderLeftStyle': headerBorderLeftStyle,
														'--headerBorderLeftWidth': headerBorderLeftWidth,
														'--headerTextAlignment': headerTextAlignmentStyle,
													}}
												>
													{table.cells
														.filter(cell => cell.row_id === renderedRow)
														.map(
															({
																table_id,
																row_id,
																column_id,
																cell_id,
																content,
																attributes,
																classes,
															}) => {
																let calculatedClasses = '';
																const isFirstColumn = column_id === '1' ? true : false;
																const isBorder = attributes.border;
																const borderContent = setBorderContent(row_id, column_id, content);
																const showGridLinesCSS = gridShowInnerLines;
																const gridLineWidthCSS = gridInnerLineWidth;

																const isFocused =
																	focusedCell.col === Number(column_id) &&
																	focusedCell.row === Number(row_id);

																if (isFocused) {
																	calculatedClasses =
																		calculatedClasses + 'grid-control__body-cells--focused ';
																}

																return (
																	<Fragment key={`header-cell:${cell_id}`}>
																		{/* Show zoom to details column */}
																		{isFirstColumn && isBorder && enableFutureFeatures && (
																			<div className={'grid-control__border-cells'} />
																		)}

																		{isBorder && (
																			<Cell
																				cellType="border"
																				dataFormat={columnDataTypes[column_id]}
																				cell_id={cell_id}
																				table={table}
																				table_id={table_id}
																				row_id={row_id}
																				column_id={column_id}
																				content={borderContent}
																				attributes={attributes}
																				className={classes}
																				onMouseDown={onMouseBorderClick}
																			></Cell>
																		)}

																		{/* Show zoom to details column */}
																		{isFirstColumn && enableFutureFeatures && (
																			<div
																				className={'grid-control__header-cells'}
																				style={{
																					'--showGridLines': showGridLinesCSS,
																					'--gridLineWidth': gridLineWidthCSS,
																				}}
																			></div>
																		)}
																		{!isBorder && (
																			<Cell
																				cellType={'header'}
																				dataFormat={columnDataTypes[column_id]}
																				cell_id={cell_id}
																				table_id={table_id}
																				row_id={row_id}
																				column_id={column_id}
																				content={content}
																				attributes={attributes}
																				isFocused={isFocused}
																				className={
																					'grid-control__header-cells ' +
																					'grid-control__cellEditor ' +
																					classes +
																					calculatedClasses
																				}
																				showGridLinesCSS={showGridLinesCSS}
																				gridLineWidthCSS={gridLineWidthCSS}
																				isEditing={editingCellId === cell_id}
																				onRequestFocus={(col, row) => {
																					setFocusedCell(prev =>
																						prev.col === col && prev.row === row
																							? prev
																							: { col, row }
																					);
																					focusCell(col, row);
																				}}
																				onRequestEdit={id => {
																					setEditingCellId(id);
																					window.requestAnimationFrame(() => {
																						const wrapper = gridRef.current?.querySelector(
																							`[data-cell-id="${CSS.escape(id)}"]`
																						);
																						wrapper
																							?.querySelector?.(
																								'[contenteditable="true"], input, textarea'
																							)
																							?.focus?.();
																					});
																				}}
																				onRequestStopEdit={() => {
																					setEditingCellId(null);
																					window.requestAnimationFrame(() =>
																						focusCell(Number(column_id), Number(row_id))
																					);
																				}}
																				onChange={onChangeCellData}
																			></Cell>
																		)}
																	</Fragment>
																);
															}
														)}
												</div>
											);
										})}

									{/* Render Table Body */}
									<div
										className={'grid-control__body'}
										style={{
											'--gridTemplateBodyRows': gridBodyRowStyle,
											'--startGridBodyRowNbr': startGridBodyRowNbrStyle,
											'--endGridBodyRowNbr': endGridBodyRowNbrStyle,
											'--bodyBorderTopColor': bodyBorderTopColor,
											'--bodyBorderTopStyle': bodyBorderTopStyle,
											'--bodyBorderTopWidth': bodyBorderTopWidth,
											'--bodyBorderRightColor': bodyBorderRightColor,
											'--bodyBorderRightStyle': bodyBorderRightStyle,
											'--bodyBorderRightWidth': bodyBorderRightWidth,
											'--bodyBorderBottomColor': bodyBorderBottomColor,
											'--bodyBorderBottomStyle': bodyBorderBottomStyle,
											'--bodyBorderBottomWidth': bodyBorderBottomWidth,
											'--bodyBorderLeftColor': bodyBorderLeftColor,
											'--bodyBorderLeftStyle': bodyBorderLeftStyle,
											'--bodyBorderLeftWidth': bodyBorderLeftWidth,
											'--bodyTextAlignment': bodyTextAlignmentStyle,
										}}
									>
										{/* Render Table Body Row Wrapper*/}
										{table.rows
											.filter(row => row.attributes.isHeader !== true && row.row_id !== '0')
											.map(({ row_id }) => {
												const renderedRow = row_id;

												/**
												 * Set calculated class names
												 */
												let calculatedClasses = '';

												const bandedRowOffset = enableHeaderRow ? 1 : 0;
												if (bandedRows && bandedRowOffset == 0 && Number(row_id) % 2 === 0) {
													calculatedClasses =
														calculatedClasses + 'grid-control__body-rows--banded-row ';
												}

												if (
													bandedRows &&
													bandedRowOffset == 1 &&
													Number(row_id) > 1 &&
													(Number(row_id) + bandedRowOffset) % 2 === 0
												) {
													calculatedClasses =
														calculatedClasses + 'grid-control__body-rows--banded-row ';
												}

												return (
													<div
														key={`body-row:${row_id}`}
														className={'grid-control__body-row ' + calculatedClasses}
														style={{
															'--bandedRowTextColor': gridBandedRowTextColor,
															'--bandedRowBackgroundColor': gridBandedRowBackgroundColor,
														}}
													>
														{/* Render Table Body Row Cells*/}
														{table.cells
															.filter(cell => cell.row_id === renderedRow)
															.map(
																({
																	table_id,
																	row_id,
																	column_id,
																	cell_id,
																	content,
																	attributes,
																	classes,
																}) => {
																	/**
																	 * Set general processing variables
																	 */
																	calculatedClasses = '';
																	const isFirstColumn = column_id === '1' ? true : false;
																	const isBorder = attributes.border;
																	const borderContent = setBorderContent(
																		row_id,
																		column_id,
																		content
																	);
																	const showGridLinesCSS = gridShowInnerLines;
																	const gridLineWidthCSS = gridInnerLineWidth;
																	const isFocused =
																		focusedCell.col === Number(column_id) &&
																		focusedCell.row === Number(row_id);
																	if (isFocused) {
																		calculatedClasses =
																			calculatedClasses + 'grid-control__body-cells--focused ';
																	}

																	return (
																		<Fragment key={`body-cell:${cell_id}`}>
																			{/* Show zoom to details column */}
																			{isFirstColumn && isBorder && enableFutureFeatures && (
																				<div className={'grid-control__border-cells'} />
																			)}

																			{isBorder && (
																				<Cell
																					cellType="border"
																					dataFormat={columnDataTypes[column_id]}
																					cell_id={cell_id}
																					table={table}
																					table_id={table_id}
																					row_id={row_id}
																					column_id={column_id}
																					content={borderContent}
																					attributes={attributes}
																					className={classes}
																					onMouseDown={onMouseBorderClick}
																				></Cell>
																			)}

																			{/* Show zoom to details column */}
																			{isFirstColumn && !isBorder && enableFutureFeatures && (
																				<div
																					className={
																						'grid-control__body-cells grid-control__body-cells--zoom'
																					}
																					style={{
																						'--showGridLines': showGridLinesCSS,
																						'--gridLineWidth': gridLineWidthCSS,
																					}}
																					key={cell_id}
																					data-col={Number(column_id)}
																					data-row={Number(row_id)}
																					tabIndex={isFocused ? 0 : -1}
																				>
																					<Button href="#" icon={search} />
																				</div>
																			)}

																			{!isBorder && (
																				<Cell
																					cellType={'body'}
																					dataFormat={columnDataTypes[column_id]}
																					cell_id={cell_id}
																					table_id={table_id}
																					row_id={row_id}
																					column_id={column_id}
																					content={content}
																					attributes={attributes}
																					isFocused={isFocused}
																					className={
																						'grid-control__body-cells ' +
																						'grid-control__cellEditor ' +
																						classes +
																						calculatedClasses
																					}
																					showGridLinesCSS={showGridLinesCSS}
																					gridLineWidthCSS={gridLineWidthCSS}
																					isEditing={editingCellId === cell_id}
																					onRequestFocus={(col, row) => {
																						setFocusedCell(prev =>
																							prev.col === col && prev.row === row
																								? prev
																								: { col, row }
																						);
																						focusCell(col, row);
																					}}
																					onRequestEdit={id => {
																						setEditingCellId(id);
																						window.requestAnimationFrame(() => {
																							const wrapper = gridRef.current?.querySelector(
																								`[data-cell-id="${CSS.escape(id)}"]`
																							);
																							wrapper
																								?.querySelector?.(
																									'[contenteditable="true"], input, textarea'
																								)
																								?.focus?.();
																						});
																					}}
																					onRequestStopEdit={() => {
																						setEditingCellId(null);
																						window.requestAnimationFrame(() =>
																							focusCell(Number(column_id), Number(row_id))
																						);
																					}}
																					onChange={onChangeCellData}
																				></Cell>
																			)}
																		</Fragment>
																	);
																}
															)}
													</div>
												);
											})}
									</div>
								</div>
							</div>
						</div>
					</div>
				</>
			)}

			{/* Show a spinner while the table is being fetcheds */}
			{!isNewBlock && tableIsResolving && <Spinner>Retrieving Table Data</Spinner>}

			{/* Show the form to identify and create a new table */}
			{isNewBlock && (
				<Placeholder
					label={__('Dynamic Table', 'dynamic-table')}
					icon={<BlockIcon icon={icon} showColors />}
					instructions={__('Create a new dynamic table.', 'dynamic-table')}
				>
					<form className="blocks-table__placeholder-form" onSubmit={onCreateTable}>
						<InputControl
							label={__('Table Name', 'dynamic-table')}
							placeholder="New Table"
							required="true"
							onChange={e => setTableName(e)}
							value={tableName}
							className="blocks-table__placeholder-input"
						/>

						<NumberControl
							__nextHasNoMarginBottom
							label={__('Table Columns', 'dynamic-table')}
							min={1}
							required="true"
							value={numColumns}
							onChange={e => onChangeInitialColumnCount(e)}
							className="blocks-table__placeholder-input"
						/>

						<NumberControl
							__nextHasNoMarginBottom
							label={__('Table Rows', 'dynamic-table')}
							required="true"
							min={1}
							value={numRows}
							onChange={e => onChangeInitialRowCount(e)}
							className="blocks-table__placeholder-input"
						/>
						<Button className="blocks-table__placeholder-button" variant="primary" type="submit">
							{__('Create Table')}
						</Button>
					</form>
				</Placeholder>
			)}
		</div>
	);
}

/**
 * Component to render and manage cell content editing
 *
 * Data Shape as follows with date-time as an example
 *
 * Type Registry
 *
 *   TYPES = {
 *     general: {
 *       label: 'Rich Text',
 * 	   },
 *
 *     'date-time': {
 *       label: 'Date/Time',
 *       formats: {
 *         date: { label: 'Date' },
 *         time: { label: 'Time' },
 *         datetime-local: { label: 'Date & Time' },
 *       },
 *     },
 *   }
 *
 *   Column - attributes.columnDataType:
 *	  {
 *        Date/Time Example
 *
 *		  type: 'date-time',
 *		  settings: {
 *			  format: 'date',
 *			  defaultToToday: false,
 *	  },
 *
 *   Cell - Content:
 *     Raw content value (example 10/1/2025)
 *
 *   Cell - attributes.value:
 *   {
 *        Column columnDataType may be included only if an override is permitted
 *        for this data type AND an override exists for this particular cell
 *        overrides: {...}
 *
 * 		  meta: {
 *            label: 'My Date',
 * 		      size: 'My Size',
 *        },
 * 		  // Dependencies on other objects external to Cell. Example for post
 * 	  	  ref: {
 * 			  kind: 'post',
 * 			  id: 45,
 * 		  },
 * 		  // search support
 * 		  indexText: 'optimized for web search, all text only' (example 2025-10-01),
 *   }
 *
 * @since 1.1.1
 * @since 1.2.0  Added column data type logic and Date/Time render
 *
 * @param {Object} props Passed attributes
 * @return {Object} events for cell content editing
 */
function Cell(props) {
	const {
		cellType,
		dataFormat,
		table,
		row_id,
		cell_id,
		table_id,
		column_id,
		content,
		attributes,
		isFocused,
		className,
		showGridLinesCSS,
		gridLineWidthCSS,
		onChange,
		onMouseDown,
		isEditing,
		onRequestEdit,
		onRequestStopEdit,
		onRequestFocus,
	} = props;

	const { type, settings } = dataFormat || {};

	const [inputType, setInputType] = useState('text'); // TextControl type (e.g., text, date, etc.)
	const [cellContent, setCellContent] = useState();
	const initialCellValue = useRef(content);
	const [cellAttributes, setCellAttributes] = useState(attributes);
	const [isCellChanged, setIsCellChanged] = useState(false);

	const htmlToText = (html = '') => getTextContent(create({ html })).replace(/\s+/g, ' ').trim();

	useEffect(() => {
		setCellAttributes(attributes);
		setIsCellChanged(false);
		initialCellValue.current = content ?? '';

		// Default behavior: raw content as-is
		setCellContent(content ?? '');
	}, [content, attributes]);

	useEffect(() => {
		if (cellType === 'border' || type !== 'date-time') return;

		if (isEditing) {
			// Enter edit mode: force a valid HTML input value FIRST
			if (cellType === 'body' && type === 'date-time') {
				setInputType(settings?.format || 'date');

				const raw = content ?? initialCellValue.current ?? '';

				if (!!raw) setCellContent(formattedIsoDate(content, settings.format));

				if (!raw && settings?.defaultToToday) {
					const today = new Date();
					setCellContent(formattedIsoDate('', settings.format));
				}
			}
		} else {
			// Exit edit mode: go back to display formatting
			// eslint-disable-next-line no-lonely-if
			if (cellType === 'body' && type === 'date-time') {
				setInputType('text');

				const raw = content ?? '';
				setCellContent(raw ? formatedDisplayDate(raw, settings?.format) : '');
			}
		}

		setCellAttributes(attributes);
		setIsCellChanged(false);
		initialCellValue.current = content ?? '';
	}, [isEditing, content, attributes, cellType, type, settings?.format]);

	/**
	 * Handle onChange event for cell content update
	 *
	 * @since 1.1.1
	 * @since 1.2.0   Converted input to object to update multiple fields
	 *
	 * @param {Object} patch event data
	 */
	function updateCellData(patch) {
		setIsCellChanged(true);
		initialCellValue.current = patch.content;

		if (patch.content !== undefined) setCellContent(patch.content);
		if (patch.attributes !== undefined) setCellAttributes(patch.attributes);

		onChange(table_id, cell_id, patch);
	}

	/**
	 * Relay mouse down event for border cells
	 *
	 * @since 1.2.0
	 *
	 * @param {number} column_id Clicked table row
	 * @param {number} row_id    Clicked table row
	 * @param {Object} table     Current Dynamic Table
	 * @param {Object} e         Border click event object
	 */
	function passMouseBorderClick(column_id, row_id, table, e) {
		onMouseDown(column_id, row_id, table, e);
	}

	/**
	 * React HTML to render a cell based on its type
	 *
	 * @since 1.1.1
	 * @since 1.2.0    Add DateTime render type
	 *
	 * @param {Object} e On Focus event
	 * @return {void}
	 */
	const renderTypes = {
		richText: () => (
			<RichText
				tagName="div"
				value={cellContent}
				readOnly={!isEditing}
				onChange={
					!isEditing
						? undefined
						: next => {
								const plainText = htmlToText(next);
								updateCellData({
									content: next,
									attributes: {
										...cellAttributes,
										value: {
											...(cellAttributes?.value || {}),
											indexText: plainText,
										},
									},
								});
							}
				}
			></RichText>
		),
		border: () => <div>{cellContent}</div>,
		dateTime: () => {
			if (!isEditing) {
				return <div>{cellContent}</div>;
			}

			return (
				<TextControl
					style={{
						backgroundColor: 'transparent',
						border: 'none',
						padding: 0,
						width: '100%',
						fontSize: '16.8px',
						fontFamily: 'Inter, sans-serif',
						boxShadow: 'inherit',
					}}
					type={inputType}
					__next40pxDefaultSize
					value={cellContent}
					onChange={next => {
						const formattedContent = formattedIsoDate(next, settings.format);
						updateCellData({
							content: next,
							attributes: {
								...cellAttributes,
								value: {
									...(cellAttributes?.value || {}),
									indexText: formattedContent,
								},
							},
						});
						onRequestStopEdit?.();
					}}
				/>
			);
		},
	};

	let renderPipeline = [];

	switch (cellType) {
		case 'border':
			renderPipeline = ['border'];
			break;
		case 'header':
			renderPipeline = ['richText'];
			break;
		case 'body':
			switch (type) {
				case 'general':
					renderPipeline = ['richText'];
					break;
				case 'border':
					renderPipeline = ['border'];
					break;
				case 'date-time':
					renderPipeline = ['dateTime'];
					break;
				default:
					break;
			}
			break;
		default:
			break;
	}

	const isBorderCell = cellType === 'border';
	const computedTabIndex = !isBorderCell && isFocused ? 0 : -1;

	return (
		<div
			data-cell-id={cell_id}
			data-col={Number(column_id)}
			data-row={Number(row_id)}
			tabIndex={computedTabIndex}
			className={className}
			style={
				cellType === 'border'
					? undefined
					: {
							'--showGridLines': showGridLinesCSS,
							'--gridLineWidth': gridLineWidthCSS,
						}
			}
			onMouseDown={e => {
				if (cellType === 'border') {
					passMouseBorderClick(column_id, row_id, table, e);
					return;
				}

				if (isEditing) return;
				e.preventDefault();
				e.stopPropagation();
				onRequestFocus?.(Number(column_id), Number(row_id));
			}}
			onDoubleClick={e => {
				if (cellType === 'border') return;
				e.preventDefault();
				onRequestEdit?.(cell_id);
			}}
		>
			{renderPipeline.map(key => {
				const renderPart = renderTypes[key];

				if (!renderPart) {
					return null;
				}

				// Stable key in React list:
				return <Fragment key={key}>{renderPart()}</Fragment>;
			})}
		</div>
	);
}
