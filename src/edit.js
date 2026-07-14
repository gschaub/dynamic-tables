/* External dependencies */
import { useSelect, useDispatch, dispatch, select } from '@wordpress/data';
import { usePrevious } from '@wordpress/compose';
import {
	useState,
	useEffect,
	useLayoutEffect,
	useRef,
	useMemo,
	Fragment,
	flushSync,
} from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { store as noticeStore } from '@wordpress/notices';
import { __, sprintf } from '@wordpress/i18n';
import {
	Panel,
	PanelBody,
	PanelRow,
	Button,
	Spinner,
	Placeholder,
	SelectControl,
	CheckboxControl,
	ToggleControl,
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
import { search, blockTable as icon, column } from '@wordpress/icons';
import clsx from 'clsx';

/* Internal dependencies */
import { store as tableStore } from './data';
import { usePostChangesSaved, useEditorIdentity, useNotInInserterPreview, useGetTable, useTableUndoRedoEffect } from './hooks';

import {
	MESSAGE_TARGETS,
	getMessageText,
	publishMessage,
	removeMessageNotice,
	showMessageNotice,
	speakMessage,
} from './messages';

import {
	getLoadedSummaryTableOptions,
	registerSummaryTableRefreshSubscriber,
	runSummaryTableRefresh,
} from './summary-table-refresh';

import {
	tableSort,
	generateBlockTableRef,
	numberToLetter,
	getCellIdCoordinates,
	setBorderContent,
	formatedDisplayDate,
	formattedIsoDate,
	normalizeColumnDataType,
	sanitizeNumberInput,
	formattedNumber,
	toPercentEntryValue,
	fromPercentEntryValue,
	countCaretTokens,
	getCaretIndexFromTokenCount,
	getFirstNumericIndex,
	normalizeCaretForPresentationPrefix,
	formatClipboardContent,
	htmlToIndexText,
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
	CellMenu,
	FreeformCheckboxIcon,
	StatusIcon,
	TableCheckbox
} from './components';
// import { FreeformCheckboxIcon, StatusIcon } from '../formatted-display';
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
 * @since 1.0.0
 *
 * @param {Object} props
 */
export default function Edit(props) {
	const blockProps = useBlockProps({
		className: 'dynamic-table-edit-block',
	});
	/* External Store Action useDispatch declarations */
	const { lockPostSaving, unlockPostSaving, lockPostAutosaving, unlockPostAutosaving } =
		useDispatch(editorStore);
	const SAVE_LOCK_KEY = 'dtbk-save-lock';

	const { isSavingPost, isAutosavingPost } = useSelect(select => {
		const editor = select(editorStore);
		return {
			isSavingPost: editor?.isSavingPost?.() ?? false,
			isAutosavingPost: editor?.isAutosavingPost?.() ?? false,
		};
	}, []);

	const isSavingEditorChanges = isSavingPost || isAutosavingPost;

	/* Table Store Action useDispatch declarations */
	const { receiveTable } = useDispatch(tableStore);
	const { receiveNewTable } = useDispatch(tableStore);
	const { updateSummaryTable } = useDispatch(tableStore);
	const { refreshSummaryTables } = useDispatch(tableStore);
	const { cloneTable } = useDispatch(tableStore);
	const { createTableEntity } = useDispatch(tableStore);
	const { saveTableEntity } = useDispatch(tableStore);
	const { addColumn } = useDispatch(tableStore);
	const { addRow } = useDispatch(tableStore);
	const { removeColumn } = useDispatch(tableStore);
	const { removeRow } = useDispatch(tableStore);
	const { moveColumn } = useDispatch(tableStore);
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
	const [isRefreshingAllTables, setIsRefreshingAllTables] = useState(false);
	const [showBorders, setShowBorders] = useState(false);

	/* Table Operation declarations */
	const [tableOperation, setTableOperation] = useState({
		kind: 'idle', // idle | creating | cloning | attaching | ready | error
		blockTableRef: '',
		sourceTableId: 0,
		error: null,
	});
	const isAwaitingTableAttachment =
		tableOperation.kind === 'creating' ||
		tableOperation.kind === 'cloning' ||
		tableOperation.kind === 'attaching';
	const [tableCreationMethod, setTableCreationMethod] = useState('choose');
	const [createDraftTable, setCreateDraftTable] = useState({
		tableName: '',
		numColumns: 1,
		numRows: 1,
	});
	const [tableRequest, setTableRequest] = useState({
		tableId: 0,
		action: 'idle', // idle | receive | attach
		blockTableRef: '',
	});

	const shouldFetchRequestedTable =
		Number(tableRequest.tableId) > 0 && tableRequest.action === 'receive';

	const {
		table: requestedTable,
		hasEntityRecord: requestedTableHasEntity,
		hasFinishedResolving: requestedTableHasFinishedResolving,
		isResolving: requestedTableIsResolving,
	} = useGetTable(
		tableRequest.tableId,
		{
			isTableStale: true,
			shouldFetch: shouldFetchRequestedTable,
		}
	);

	const [editingCellId, setEditingCellId] = useState(null);
	const editingCellIdRef = useRef(null);
	const [cellClipboard, setCellClipboard] = useState({
		inUse: false,
		clipboardAction: null,
		sourceCellId: null,
		columnId: null,
		rowId: null,
		columnDataType: '',
		cellContent: '',
		cellValueAttr: {},
		cellFormattedText: '',
		cellPlainText: '',
	});

	const hasAnnouncedGridHelpRef = useRef(false);

	const unmountSnapshotRef = useRef({
		tableLoaded: false,
		isNewBlock: true,
		inInserterBlock: false,
		originalPostType: '',
		tableId: 0,
		tableStatus: '',
		isSavingEditorChanges: false,
	});
	const latestLifecycleRef = useRef({});

	const isPageUnloadRef = useRef(false);
	const summaryTableRefreshSubscriberIdRef = useRef(Symbol('dtbk-summary-refresh'));

	/* Location of border cell last clicked */
	const lastInvokerElRef = useRef(null);
	const lastInvokerWasKeyboardRef = useRef(false);
	const suppressNextInvokerRestoreRef = useRef(false);

	/**
	 * Identifies the current cell being edited
	 *
	 * @since 1.2.5
	 *
	 * @param {string} cellId Cell being edited
	 */
	function setCurrentEditingCellId(cellId) {
		editingCellIdRef.current = cellId;
		setEditingCellId(cellId);
	}

	/**
	 * Identify and announce that a cell is being edited when entering edit mode
	 *
	 * @since 1.2.5
	 *
	 * @param {string} id Cell being edited
	 */
	function startEditingCell(id) {
		const nextId = String(id);

		if (String(editingCellIdRef.current ?? '') !== nextId) {
			speakMessage('editing-cell', {
				args: { cellId: nextId },
			});
		}

		setCurrentEditingCellId(nextId);
	}

	/**
	 * Identify and optionally announce that we are leaving edit mode
	 *
	 * @since 1.2.5
	 *
	 * @param {boolean} announce Whether exiting edit mode should be announced
	 */
	function stopEditingCell(announce = true) {
		const currentId = editingCellIdRef.current;

		if (announce && currentId) {
			speakMessage('stopped-editing-cell', {
				args: { cellId: currentId },
			});
		}
		setCurrentEditingCellId(null);
	}

	/**
	 * Restores cell navigation focus after leaving edit mode
	 *
	 * @since 1.2.5
	 */
	function restoreFocusAfterOverlayClose() {
		window.requestAnimationFrame(() => {
			if (lastInvokerWasKeyboardRef.current && lastInvokerElRef.current?.isConnected) {
				lastInvokerElRef.current.focus?.();
				return;
			}

			if (focusedCell.col > 0 && focusedCell.row > 0) {
				focusCell(focusedCell.col, focusedCell.row);
			}
		});
	}

	/**
	 * Support row border drop down menu and settings
	 * dialog boxes
	 */
	const [rowMenu, setRowMenu] = useState({
		isOpen: false,
		anchorEl: null,
		rowId: null,
		rowLabel: '',
		rowAttributes: null,
	});

	/**
	 * Open row dropdown menu and settings dialog boxes.
	 *
	 * @since 1.2.0
	 *
	 * @param {Object} e             row menu click event
	 * @param {number} rowId         Row number to update
	 * @param {string} rowLabel      Display label at top of dialog
	 * @param {Object} rowAttributes Row attributes that control row height, among other things
	 */
	const openRowMenu = (e, rowId, rowLabel, rowAttributes) => {
		e?.preventDefault?.();
		e?.stopPropagation?.();

		/* Capture a real element, not the synthetic event */
		const el = e?.currentTarget || null;
		lastInvokerElRef.current = el;
		lastInvokerWasKeyboardRef.current = Number(e?.detail) === 0;
		suppressNextInvokerRestoreRef.current = false;

		setRowMenu({
			isOpen: true,
			anchorEl: el,
			rowId,
			rowLabel,
			rowAttributes,
		});
	};

	/**
	 * Close row dropdown menu and settings dialog boxes.
	 *
	 * @since 1.2.0
	 */
	const closeRowMenu = () => {
		const shouldRestoreFocus = !suppressNextInvokerRestoreRef.current;
		suppressNextInvokerRestoreRef.current = false;

		setRowMenu(prev => ({ ...prev, isOpen: false, anchorEl: null }));

		if (shouldRestoreFocus) {
			restoreFocusAfterOverlayClose();
		}
	};

	/**
	 * Support row height menu and settings
	 */
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
	 * @since 1.2.0
	 *
	 * @param {Object} e             row menu click event
	 * @param {number} rowId         Row number to update
	 * @param {string} rowLabel      Display label at top of dialog
	 * @param {Object} rowAttributes Row attributes that control row height, among other things
	 */
	const openRowHeightModal = (e, rowId, rowLabel, rowAttributes) => {
		e?.preventDefault?.();
		e?.stopPropagation?.();

		suppressNextInvokerRestoreRef.current = true;
		setRowHeightModal({
			isOpen: true,
			rowId,
			rowLabel,
			rowAttributes,
		});
	};

	/**
	 * Close row height configuration dialog page.
	 *
	 * @since 1.2.0
	 */
	const closeRowHeightModal = () => {
		setRowHeightModal(prev => ({ ...prev, isOpen: false }));
		restoreFocusAfterOverlayClose();
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

	/**
	 * Open column dropdown menu and settings dialog boxes.
	 *
	 * @since 1.2.0
	 *
	 * @param {Object} e                column menu click event
	 * @param {number} columnId         Column number to update
	 * @param {string} columnLabel      Display label at top of dialog
	 * @param {Object} columnAttributes Column attributes that control column width, among other things
	 */
	const openColumnMenu = (e, columnId, columnLabel, columnAttributes) => {
		e?.preventDefault?.();
		e?.stopPropagation?.();

		/* Capture a real element, not the synthetic event */
		const el = e?.currentTarget || null;
		lastInvokerElRef.current = el;
		lastInvokerWasKeyboardRef.current = Number(e?.detail) === 0;
		suppressNextInvokerRestoreRef.current = false;

		setColumnMenu({
			isOpen: true,
			anchorEl: el,
			columnId,
			columnLabel,
			columnAttributes,
		});
	};

	/**
	 * Close column dropdown menu and settings dialog boxes.
	 *
	 * @since 1.2.0
	 */
	const closeColumnMenu = () => {
		setColumnMenu(prev => ({ ...prev, isOpen: false, anchorEl: null }));
		const shouldRestoreFocus = !suppressNextInvokerRestoreRef.current;
		suppressNextInvokerRestoreRef.current = false;

		if (shouldRestoreFocus) {
			restoreFocusAfterOverlayClose();
		}
	};

	/**
	 * Support column width menu and settings
	 */
	const [columnWidthModal, setColumnWidthModal] = useState({
		isOpen: false,
		columnId: null,
		columnLabel: '',
		columnAttributes: null,
	});

	/**
	 * Support column content menu and settings
	 */
	const [columnDataTypeModal, setColumnDataTypeModal] = useState({
		isOpen: false,
		columnId: null,
		columnLabel: '',
		columnAttributes: null,
		columnClasses: '',
	});

	/**
	 * Open column data type configuration dialog page.
	 *
	 * Description: Responds to clicked column menu item.
	 *
	 * @since 1.2.0
	 *
	 * @param {Object} e                Column menu click event
	 * @param {number} columnId         Column number to update
	 * @param {string} columnLabel      Display label at top of dialog
	 * @param {Object} columnAttributes Column attributes
	 * @param {Object} columnClasses    Column classes to apply column specific styling
	 */
	const openColumnDataTypeModal = (e, columnId, columnLabel, columnAttributes, columnClasses) => {
		e?.preventDefault?.();
		e?.stopPropagation?.();

		suppressNextInvokerRestoreRef.current = true;

		setColumnDataTypeModal({
			isOpen: true,
			columnId,
			columnLabel: columnLabel,
			columnAttributes,
			columnClasses,
		});
	};

	/**
	 * Close column data type configuration dialog page.
	 *
	 * @since 1.2.0
	 */
	const closeColumnDataTypeModal = () => {
		setColumnDataTypeModal(prev => ({ ...prev, isOpen: false }));
		restoreFocusAfterOverlayClose();
	};

	/**
	 * Open column width configuration dialog page.
	 *
	 * Description: Responds to clicked column menu item to update the column width configuration.
	 *
	 * @since 1.2.0
	 *
	 * @param {Object} e                Column menu click event
	 * @param {number} columnId         Column number to update
	 * @param {string} columnLabel      Display label at top of dialog
	 * @param {Object} columnAttributes Column attributes that control column width, among other things
	 */
	const openColumnWidthModal = (e, columnId, columnLabel, columnAttributes) => {
		e?.preventDefault?.();
		e?.stopPropagation?.();

		suppressNextInvokerRestoreRef.current = true;

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
	 * @since 1.2.0
	 */
	const closeColumnWidthModal = () => {
		setColumnWidthModal(prev => ({ ...prev, isOpen: false }));
		restoreFocusAfterOverlayClose();
	};

	/**
	 * Support cell drop down menu and settings
	 * dialog boxes
	 */
	const [cellMenu, setCellMenu] = useState({
		isOpen: false,
		anchorEl: null,
		cellId: null,
		cellAttributes: null,
	});

	/**
	 * Open cell dropdown menu and settings dialog boxes.
	 *
	 * @since 1.3.1
	 *
	 * @param {Object} e              Cell menu click event
	 * @param {string} cellId         Cell number to update
	 * @param {Object} cellAttributes Cell attributes
	 */
	const openCellMenu = (e, cellId, cellAttributes) => {
		e?.preventDefault?.();
		e?.stopPropagation?.();

		/* Capture a real element, not the synthetic event */
		const el = e?.currentTarget || null;
		lastInvokerElRef.current = el;
		lastInvokerWasKeyboardRef.current = Number(e?.detail) === 0;
		suppressNextInvokerRestoreRef.current = false;

		setCellMenu({
			isOpen: true,
			anchorEl: el,
			cellId,
			cellAttributes,
		});
	};

	/**
	 * Close cell dropdown menu and settings dialog boxes.
	 *
	 * @since 1.3.1
	 */
	const closeCellMenu = () => {
		setCellMenu(prev => ({ ...prev, isOpen: false, anchorEl: null }));
		const shouldRestoreFocus = !suppressNextInvokerRestoreRef.current;
		suppressNextInvokerRestoreRef.current = false;

		if (shouldRestoreFocus) {
			restoreFocusAfterOverlayClose();
		}
	};

	/**
	 * Remove cell clipboard content and set inUse to false.
	 *
	 * @since 1.3.1
	 */
	function resetCellClipboard() {
		setCellClipboard({
			inUse: false,
			clipboardAction: null,
			sourceCellId: null,
			columnId: null,
			rowId: null,
			columnDataType: '',
			cellContent: '',
			cellValueAttr: {},
			cellFormattedText: '',
			cellPlainText: '',
		});
	}

	/* Support table creation and cloning */
	const cloneLatchRef = useRef(new Set());

	/* Support keyboard navigation in table */
	const [focusedCell, setFocusedCell] = useState({ col: 0, row: 0 });
	const gridRef = useRef(null);

	/* Current future features: Zoom to details */
	const enableFutureFeatures = false;
	const enableProFeatures = false;

	const { table_id, block_table_ref, original_post_type, original_post_id, block_alignment } =
		props.attributes;

	const editorTableTagIdBase = `dtbk-table-${String(table_id).trim()}`;
	const editorHeaderAlignmentTagId = `${editorTableTagIdBase}-header-alignment`;
	const editorBodyAlignmentTagId = `${editorTableTagIdBase}-body-alignment`;
	const editorGridTagId = `${editorTableTagIdBase}-grid`;
	const editorGridHelpTagId = `${editorTableTagIdBase}-grid-help`;
	const editorTitleTagId = `${editorTableTagIdBase}-title`;
	const editorRowMenuTagId = `${editorTableTagIdBase}-row-menu`;
	const editorColumnMenuTagId = `${editorTableTagIdBase}-column-menu`;
	const getEditorColumnHeaderTagId = columnId =>
		`${editorTableTagIdBase}-column-${String(columnId).trim()}-header`;
	const editorCellMenuTagId = `${editorTableTagIdBase}-cell-menu`;

	const [themeColors = []] = useSettings('color.palette');
	const borderBoxColors = themeColors.map(({ color, name }) => {
		return { color, name };
	});

	/**
	 * Identify current table id by its block table reference
	 *
	 * @since 1.1.0
	 * @since 1.3.0 Refactored
	 */
	const currentTableId = useSelect(
		select => {
			const { getTableIdByBlock } = select(tableStore);
			return getTableIdByBlock(block_table_ref);
		},
		[block_table_ref]
	);

	/**
	 * Identify blocks with the same block table reference and table id in the post editor.
	 *
	 * @since 1.1.0
	 */
	const sharedTableBlockClientIds = useSelect(
		select => {
			const blockEditor = select('core/block-editor');
			const rootBlocks = blockEditor?.getBlocks?.() || [];

			if (!block_table_ref || Number(table_id) <= 0 || rootBlocks.length === 0) {
				return [];
			}

			const matchingClientIds = [];
			const findMatchingTableBlocks = blocks => {
				blocks.forEach(block => {
					if (!block) {
						return;
					}

					if (
						block.name === 'dynamic-table-blocks/dynamic-table-blocks' &&
						block.attributes?.block_table_ref === block_table_ref &&
						Number(block.attributes?.table_id) === Number(table_id)
					) {
						matchingClientIds.push(block.clientId);
					}

					if (block.innerBlocks?.length) {
						findMatchingTableBlocks(block.innerBlocks);
					}
				});
			};

			findMatchingTableBlocks(rootBlocks);
			return matchingClientIds;
		},
		[block_table_ref, table_id]
	);

	const duplicateBlockIndex = sharedTableBlockClientIds.findIndex(
		clientId => clientId === props.clientId
	);
	const isDuplicatedBlockInstance = duplicateBlockIndex > 0;

	const attachedTableId = Number(currentTableId || 0);

	/**
	 * Lookup table attribute value.
	 *
	 * @since 1.0.0
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

	/**
	 * Identify blocks unmounted tables and re-attach to blocks if they are not deleted
	 *
	 * @since 1.3.0
	 */
	useEffect(() => {
		if (!Object.keys(unmountedTables).length) return;
		void processUnmountedTables(unmountedTables).catch(error => {
			showMessageNotice(createNotice, 'unmounted-reconcile-error');
		});
	}, [unmountedTables]);

	/**
	 * Retrieve table id's of all tables in a status of deleted.
	 *
	 * @since 1.0.0
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
	 * @since 1.0.0
	 *
	 * @type {boolean} Post changes have been saved
	 */
	const postChangesAreSaved = usePostChangesSaved();
	const previousPostChangesAreSaved = usePrevious(postChangesAreSaved);
	const didJustFinishPostSave = postChangesAreSaved && !previousPostChangesAreSaved;

	/**
	 * Set Block Table Status
	 *
	 * @since 1.0.0
	 *
	 * @return  {("None" | "Stale" | "Loaded" | "New" | "Saved")}  Table Status
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
	 * Identify the block as new if it does not contain a block table ref identifier
	 *
	 * @since 1.0.0
	 *
	 * @return {boolean} Is this a new dynamic table block?
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
	 * @since 1.0.0
	 */
	const setSaveLock = () => {
		lockPostSaving(SAVE_LOCK_KEY);
		lockPostAutosaving(SAVE_LOCK_KEY);
	};

	/**
	 * Remove lock for saving.
	 *
	 * @since 1.0.0
	 */
	const setClearSaveLock = () => {
		unlockPostSaving(SAVE_LOCK_KEY);
		unlockPostAutosaving(SAVE_LOCK_KEY);
	};

	const isNewBlock = setNewBlock();
	const blockTableStatus = setBlockTableStatus();
	const { postId, postType } = useEditorIdentity(props);
	const inInserterBlock = !useNotInInserterPreview();
	const blockEditingMode = useSelect(
		select => select('core/block-editor')?.getBlockEditingMode?.(props.clientId) ?? 'default',
		[props.clientId]
	);
	const isContentOnlyMode = blockEditingMode === 'contentOnly';

	/**
	 * Identify actions that are available in contentOnly mode
	 *
	 * @since 1.2.5
	 *
	 * @param {string} updateType The type of row update action being evaluated
	 */
	function isContentOnlyRowAction(updateType) {
		return (
			updateType === 'insert-above' || updateType === 'insert-below' || updateType === 'delete'
		);
	}

	/* Ensure structural changes are unavailable when block editor is in contentOnly mode */
	useEffect(() => {
		if (!isContentOnlyMode) return;

		setRowHeightModal(prev => ({ ...prev, isOpen: false }));
		setColumnMenu(prev => ({ ...prev, isOpen: false, anchorEl: null }));
		setColumnWidthModal(prev => ({ ...prev, isOpen: false }));
		setColumnDataTypeModal(prev => ({ ...prev, isOpen: false }));
	}, [isContentOnlyMode]);

	/**
	 * Prepare for New Block
	 */
	useEffect(() => {
		if (isAwaitingTableAttachment) {
			setSaveLock();
		} else {
			setClearSaveLock();
		}

		return () => {
			setClearSaveLock();
		};
	}, [isAwaitingTableAttachment]);

	/**
	 * Ensure that a browser refresh will always load data from the persisted data
	 * in the database/REST API
	 *
	 * @since 1.3.0
	 */
	useLayoutEffect(() => {
		const markPageUnload = event => {
			if (event?.type === 'pagehide' && event.persisted) {
				return;
			}
			isPageUnloadRef.current = true;
		};

		const clearPageUnload = event => {
			/* Do not clear during a real unload when the document becomes hidden. */
			if (event?.type === 'visibilitychange' && document.visibilityState !== 'visible') {
				return;
			}

			isPageUnloadRef.current = false;
		};

		clearPageUnload();

		window.addEventListener('beforeunload', markPageUnload);
		window.addEventListener('pagehide', markPageUnload);
		window.addEventListener('pageshow', clearPageUnload);
		window.addEventListener('focus', clearPageUnload);
		document.addEventListener('visibilitychange', clearPageUnload);
		return () => {
			window.removeEventListener('beforeunload', markPageUnload);
			window.removeEventListener('pagehide', markPageUnload);
			window.removeEventListener('pageshow', clearPageUnload);
			window.removeEventListener('focus', clearPageUnload);
			document.removeEventListener('visibilitychange', clearPageUnload);
		};
	}, []);

	/**
	 * Retrieve summary data for all active tables and load all tables store.
	 *
	 * @since 1.4.0
	 */
	const {
		allTables,
		allTablesIsResolving,
	} = useSelect(
		select => {
			const { getSummaryTables, isResolving } = select(tableStore);

			const selectorArgs = [true];

			const allTables = getSummaryTables(true);
			const allTablesIsResolving = isResolving('getSummaryTables', selectorArgs);

			return {
				allTables: allTables,
				allTablesIsResolving: allTablesIsResolving,
			};
		},
		[]
	);

	const activeExistingTableOptions = useMemo(() => {
		if (tableCreationMethod !== 'existing-table') {
			return null;
		}

		const nextExistingTableOptions = getLoadedSummaryTableOptions(allTables);

		if (nextExistingTableOptions.length > 1) {
			return nextExistingTableOptions;
		}

		return allTablesIsResolving || isRefreshingAllTables
			? null
			: nextExistingTableOptions;
	}, [tableCreationMethod, allTables, allTablesIsResolving, isRefreshingAllTables]);

	/**
	 * Refresh summary table data for all tables in the tables store when the table creation
	 * method is set to "existing table".
	 *
	 * @since 1.4.0
	 */
	useEffect(() => {
		return registerSummaryTableRefreshSubscriber({
			tableCreationMethod,
			refreshSummaryTables,
			createNotice,
			setIsRefreshingAllTables,
			subscriberId: summaryTableRefreshSubscriberIdRef.current,
		});

	}, [tableCreationMethod, refreshSummaryTables, createNotice]);

	/**
	 * Retrieve table entity from table webservice and load table store.
	 *
	 * @since 1.0.0
	 * @since 1.3.0 Refactored
	 */
	const {
		table,
		tableStatus,
		tableHasStartedResolving,
		tableHasFinishedResolving,
		tableIsResolving,
	} = useSelect(
		select => {
			const { getTable, hasStartedResolution, hasFinishedResolution, isResolving } =
				select(tableStore);

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

			const blockTable = getTable(table_id, isTableStale);
			const tableHasStartedResolving = hasStartedResolution('getTable', selectorArgs);
			const tableHasFinishedResolving = hasFinishedResolution('getTable', selectorArgs);
			const tableIsResolving = isResolving('getTable', selectorArgs);

			return {
				table: blockTable,
				tableStatus: blockTable.table_status,
				tableHasStartedResolving: tableHasStartedResolving,
				tableHasFinishedResolving: tableHasFinishedResolving,
				tableIsResolving: tableIsResolving,
			};
		},
		[table_id, isTableStale, block_table_ref]
	);

	/* Table is no longer stale once it has finished resolving */
	useEffect(() => {
		if (!tableHasFinishedResolving) return;
		setTableStale(false);
	}, [tableHasFinishedResolving]);

	/**
	 * Attach existing table to block when table is ready for attachment.
	 *
	 * @since 1.4.0
	 */
	useEffect(() => {
		if (tableRequest.action !== 'receive') return;
		if (!tableRequest.tableId) return;
		if (!tableRequest.blockTableRef) return;
		if (requestedTableIsResolving || !requestedTableHasFinishedResolving) return;
		if (!requestedTable?.table_id) return;
		if (!requestedTableHasEntity) return;

		const attachedTableId = Number(tableRequest.tableId);
		const attachedTable = {
			...requestedTable,
			block_table_ref: tableRequest.blockTableRef,
			table_status: 'new',
			post_id: String(postId),
		};

		updateSummaryTable({
			table_id: attachedTableId,
			block_table_ref: tableRequest.blockTableRef,
			table_status: attachedTable.table_status,
			post_id: String(postId),
		});

		receiveTable(
			attachedTableId,
			attachedTable.block_table_ref,
			attachedTable.table_status,
			attachedTable.post_id,
			attachedTable.table_name,
			attachedTable.attributes,
			attachedTable.classes,
			attachedTable.rows,
			attachedTable.columns,
			attachedTable.cells
		);

		props.setAttributes({
			original_post_type: postType,
			original_post_id: Number(postId),
			block_table_ref: tableRequest.blockTableRef,
			table_id: Number(requestedTable.table_id),
		});

		setTableRequest(prev => ({
			...prev,
			action: 'attach',
		}));

	}, [
		tableRequest.action,
		tableRequest.blockTableRef,
		tableRequest.tableId,
		requestedTable?.table_id,
		requestedTable?.table_name,
		requestedTable?.attributes,
		requestedTable?.classes,
		requestedTable?.rows,
		requestedTable?.columns,
		requestedTable?.cells,
		requestedTableHasEntity,
		requestedTableHasFinishedResolving,
		requestedTableIsResolving,
		postId,
		postType,
		updateSummaryTable,
		receiveTable,
	]);

	/**
	 * Attach existing table to block when table is ready for attachment.
	 *
	 * @since 1.4.0
	 * @since 1.4.4 - Show borders when table is attached
	 */
	useEffect(() => {
		if (tableRequest.action !== 'attach') return;
		if (Number(table.table_id) <= 0) return;

		if (!showBorders) {
			onToggleBorders(table, true);
		}

		let isActive = true;

		async function persistAttachedTable() {
			try {
				const entityId = Number(table.table_id);
				updateTableEntity(entityId);
				await saveTableEntity(entityId);
			} catch (error) {
				if (!isActive) return;
				showMessageNotice(createNotice, 'update-entity-error');
				setTableOperation({
					kind: 'error',
					blockTableRef: tableRequest.blockTableRef,
					sourceTableId: table.table_id,
					error,
				});
			} finally {
				if (!isActive) return;
				setTableRequest({
					tableId: 0,
					action: 'idle',
					blockTableRef: '',
				});
			}
		}

		void persistAttachedTable();

		return () => {
			isActive = false;
		};

	}, [
		tableRequest.action,
		tableRequest.blockTableRef,
		table.table_id,
		showBorders,
		saveTableEntity,
		updateTableEntity,
		createNotice,
	]);

	const tableHasPendingEntityEdits = useSelect(
		select => {
			if (!table?.block_table_ref || Number(table.table_id) <= 0) {
				return false;
			}

			return (
				select(coreStore)?.hasEditsForEntityRecord?.(
					'dynamic-table-blocks',
					'table',
					Number(table.table_id)
				) ?? false
			);
		},
		[table?.block_table_ref, table.table_id]
	);

	useTableUndoRedoEffect(table.table_id, ({ editedTable, hasEdits }) => {
		// Respond to undo/redo here.
		// Example uses:
		// - restore local UI derived from entity state
		// - clear stale per-cell editing state
		// - re-sync transient controls with editedTable
	});

	/**
	 * Set table attributes and attach table to block when table is created or
	 * cloned and ready for attachment
	 *
	 * @since 1.3.0
	 */
	useEffect(() => {
		if (!isAwaitingTableAttachment) return;
		if (!block_table_ref) return;
		if (!attachedTableId) return;

		if (Number(attachedTableId) !== Number(table_id)) {
			props.setAttributes({
				original_post_type: postType,
				original_post_id: Number(postId),
				table_id: attachedTableId,
			});
			return;
		}

		setTableOperation(prev =>
			prev.kind === 'ready' ? prev : { ...prev, kind: 'ready', error: null }
		);
	}, [isAwaitingTableAttachment, block_table_ref, attachedTableId, table_id, postType, postId]);

	/* Determine if table has been loaded. */
	const tableLoaded = !!table.block_table_ref && blockTableStatus !== 'None';

	/**
	 * Fires when posts have just finished saving and when a change is detected in
	 * unmounted tables.
	 */
	useEffect(() => {
		if (!didJustFinishPostSave) return;
		const finalizePostSaveTableChanges = async () => {

			try {
				/**
				 * Remove deleted tables from persisted store
				 */
				if (Object.keys(deletedTables).length > 0) {
					await processDeletedTables(deletedTables);
				}

				const shouldPersistTableChanges =
					tableLoaded &&
					Number(table.table_id) > 0 &&
					(table.table_status == 'new' || tableHasPendingEntityEdits);

				if (shouldPersistTableChanges) {
					/**
					 * Tables are persisted when they are created, but should only remain
					 * if the underlying post is saved. Here we update the status of new
					 * tables from "new" to "saved" once the post is saved.
					 */
					if (table.table_status == 'new') {
						setTableAttributes(table.table_id, 'table_status', '', 'PROP', 'saved', false)
						updateTableEntity(table.table_id, 'saved', {
							...table,
							table_status: 'saved',
						});
					}

					await saveTableEntity(table.table_id);
				}
			} finally {
				await runSummaryTableRefresh({
					refreshSummaryTables,
					createNotice,
					showErrorNotice: true,
				});
			}
		};

		void finalizePostSaveTableChanges().catch(error => {
			showMessageNotice(createNotice, 'post-save-sync-error');
		});
	}, [
		didJustFinishPostSave,
		deletedTables,
		tableLoaded,
		table.table_id,
		table.table_status,
		tableHasPendingEntityEdits,
		refreshSummaryTables,
		createNotice,
		updateTableEntity,
	]);

	/**
	 * Create a latch key before clone to identify the specific block being cloned. The block
	 * will not be cloned if it is currently locked for cloning.
	 *
	 * @since 1.1.0
	 *
	 * @param {string} clientId - Current Block Identifier to be cloned
	 * @param {string} postId   - Current post id of post in which the block appears
	 * @param {string} tableId  - Current table id of table in block
	 * @return {boolean} lock - Is the table currently being cloned
	 */
	function acquireCloneLatch({ clientId, postId, tableId }) {
		const key = [clientId || 'no-client', postId || 0, tableId || 0].join(':');

		/* If we already cloned for this key, deny. */
		if (cloneLatchRef.current.has(key)) {
			return { locked: true };
		}

		/* Otherwise lock it now. */
		cloneLatchRef.current.add(key);
		return { locked: false };
	}

	/**
	 * Determine if this block shares the same table reference identifiers as another block or
	 * originated from a non-sync pattern. If so, mark it for cloning
	 *
	 * @since 1.1.0
	 * @since 1.3.0  Made WordPress RTC safe and renamed from checkDuplicateTable
	 *
	 * @param {boolean} tableLoaded
	 * @param {Object}  table
	 * @param {string}  postId
	 * @param {boolean} inInserterBlock
	 */
	function shouldCloneTable(tableLoaded, table, postId, inInserterBlock) {
		const patternName = props.attributes?.metadata?.patternName;
		const isBlockFromPattern = !!patternName;

		/* Exit if table is not loaded */
		if (!tableLoaded) {
			return false;
		}

		/* Exit if table is being created manually */
		if (isNewBlock) {
			return false;
		}

		if (inInserterBlock) {
			return false;
		}

		if (Number(table.table_id) <= 0) {
			return false;
		}

		/* Duplicated blocks inherit the original table reference and need their own clone. */
		if (isDuplicatedBlockInstance) {
			return true;
		}

		/* Inserted post type is not a pattern */
		if (original_post_type !== 'wp_block') {
			return false;
		}

		/* Inserted Patterns have meta and pattern meta does not load in preview inserter */
		if (!isBlockFromPattern) {
			return false;
		}

		if (Number(original_post_id) === Number(postId) && Number(table.post_id) > 0) {
			return false;
		}

		if (Number(table.post_id) === Number(postId)) {
			return false;
		}

		return true;
	}

	/**
	 * Set original post type and post id attributes for new blocks where those attributes are not
	 * already set.  This supports proper identification of pattern blocks and cloning when inserted
	 * from a pattern.
	 *
	 * @since 1.3.0
	 */
	useEffect(() => {
		const nextAttributes = {};

		if (original_post_type === '') {
			nextAttributes.original_post_type = postType;
		}

		if (Number(original_post_id) === 0) {
			nextAttributes.original_post_id = Number(postId);
		}

		if (Object.keys(nextAttributes).length > 0) {
			props.setAttributes(nextAttributes);
		}
	}, [original_post_type, original_post_id, postType, postId]);

	/**
	 * Clone table if the block's block_table_ref and table_id match another block
	 * in the editor or inserted from a pattern. The table needs to be cloned to
	 * avoid conflicts between blocks sharing the same table.
	 *
	 * @since 1.3.0
	 */
	useEffect(() => {
		if (!shouldCloneTable(tableLoaded, table, postId, inInserterBlock)) {
			return;
		}

		const { locked } = acquireCloneLatch({
			clientId: props.clientId,
			postId,
			tableId: table.table_id,
		});

		if (locked) {
			return;
		}

		const cloneBlockTableRef = generateBlockTableRef();
		props.setAttributes({ block_table_ref: cloneBlockTableRef });
		setTableStale(false);
		setTableOperation({
			kind: 'cloning',
			blockTableRef: cloneBlockTableRef,
			sourceTableId: table.table_id,
			error: null,
		});

		cloneTable(table.table_id, postId, cloneBlockTableRef)
			.then(clonedTableId => {
				props.setAttributes({
					original_post_type: postType,
					original_post_id: Number(postId),
					table_id: Number(clonedTableId),
				});

				setTableOperation(prev => ({ ...prev, kind: 'ready', error: null }));
			})
			.catch(error => {
				setTableOperation({
					kind: 'error',
					blockTableRef: cloneBlockTableRef,
					sourceTableId: table.table_id,
					error,
				});
			});
	}, [
		tableLoaded,
		table.table_id,
		table.post_id,
		postId,
		inInserterBlock,
		isDuplicatedBlockInstance,
		original_post_type,
		original_post_id,
		props.attributes?.metadata?.patternName,
		props.clientId,
	]);

	/**
	 * Set table post_id attribute and persist the updated table entity when a new table is created
	 * and attached to the block
	 *
	 * @since 1.3.0
	 */
	useEffect(() => {
		if (!tableHasStartedResolving || !tableHasFinishedResolving) return;
		if (isAwaitingTableAttachment) return;
		if (Number(props.context.postId) === 0) return;
		if (Number(table.post_id) !== 0) return;

		setTableAttributes(table.table_id, 'post_id', '', 'PROP', String(props.context.postId));
		void saveTableEntity(table.table_id).catch(error => {
			showMessageNotice(createNotice, 'post-id-sync-error');
		});
	}, [
		tableHasStartedResolving,
		tableHasFinishedResolving,
		isAwaitingTableAttachment,
		props.context.postId,
		table.table_id,
		table.post_id,
	]);

	/**
	 * Identify table block attributes required to reattach the block after it is unmounted
	 *
	 * @since 1.3.0
	 */
	useLayoutEffect(() => {
		unmountSnapshotRef.current = {
			tableLoaded,
			isNewBlock,
			inInserterBlock,
			originalPostType: original_post_type,
			tableId: Number(table.table_id || 0),
			tableStatus,
			isSavingEditorChanges,
		};
	}, [
		tableLoaded,
		isNewBlock,
		inInserterBlock,
		original_post_type,
		table.table_id,
		tableStatus,
		isSavingEditorChanges,
	]);

	/**
	 * Perform clean-up when the block unmounts so that we can reattach it based on the block's
	 * table id and block table ref.  We can also determine if the block was deleted if the reference
	 * attributes are no longer present when the block is re-mounted.
	 *
	 * This all occurs immediately prior to unmounting the block.
	 */
	useEffect(() => {
		return () => {
			const {
				tableLoaded: wasTableLoaded,
				isNewBlock: wasNewBlock,
				inInserterBlock: wasInserterPreview,
				originalPostType,
				tableId,
				tableStatus: lastTableStatus,
				isSavingEditorChanges: wasSavingEditorChanges,
			} = unmountSnapshotRef.current;

			/** No cleanup is needed for blocks that never finished loading, are still new,
			 * or do not yet have a persisted table ID.
			 */

			if (!wasTableLoaded || wasNewBlock || tableId <= 0) {
				return;
			}

			// Abandon cleanup if the page is refreshed
			if (isPageUnloadRef.current) {
				return;
			}

			// Abandon cleanup if the page was being saved
			if (wasSavingEditorChanges) {
				return;
			}

			// Mark table as a pattern block type
			if (wasInserterPreview || originalPostType === 'wp_block') {
				setTableAttributes(tableId, 'isPattern', '', 'PROP', true);
				return;
			}

			// Set table's prior status to the current status before unmounting
			setTableAttributes(tableId, 'prior_status', '', 'PROP', lastTableStatus, false);
			setTableAttributes(tableId, 'table_status', '', 'PROP', 'unknown', false);

			// Set the table's block identifier so that we can reattach it on remount and update
			// its status to unknown to signify that we won't know what is happening during the
			// time the block is unmounted
			setTableAttributes(tableId, 'unmounted_block', '', 'PROP', true, false);
 			updateTableEntity(tableId, 'unknown');

			// Persist the table with its "unknown" status
			void saveTableEntity(tableId).catch(error => {
				console.error('Error saving Dynamic Table state during unmount cleanup', error);
				showMessageNotice(createNotice, 'unmount-save-error');
			});
		};
	}, []);

	const liveNumColumns =
		JSON.stringify(table.table) === '{}' || blockTableStatus == 'None' ? 0 : table.columns.length;
	const liveNumRows =
		JSON.stringify(table.table) === '{}' || blockTableStatus == 'None' ? 0 : table.rows.length;

	/**
	 * Set the initial focus cell when the dynamic table receives focus
	 *
	 * @since 1.1.1
	 */
	useEffect(() => {
		// Only initial focus when table is loaded and nothing focused yet
		if (!gridRef.current) return;
		const doc = gridRef.current.ownerDocument || document;

		// If editor already focused something inside, don't steal focus
		if (gridRef.current.contains(doc.activeElement)) return;

		focusCell(1, 1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tableLoaded]);

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

	/**
	 * Identify column data types for each column
	 *
	 * @since 1.2.0
	 *
	 * @return {Object} column data type
	 */
	const columnDataTypes = useMemo(() => {
		const map = {};

		if (!isNewBlock) {
			table.columns.forEach(({ column_id, attributes }) => {
				map[column_id] = normalizeColumnDataType(attributes?.columnDataType);
			});
		}
		return map;
	}, [table.columns]);

	/**
	 * Identify column css classes for each column
	 *
	 * @since 1.2.0
	 *
	 * @return {Object} column data type
	 */
	const columnClasses = useMemo(() => {
		const map = {};

		if (!isNewBlock) {
			table.columns.forEach(({ column_id, classes }) => {
				map[column_id] = classes;
			});
		}
		return map;
	}, [table.columns]);

	/**
	 * Insert a new column in the table.
	 *
	 * @since 1.0.0
	 * @since 1.2.2  Allow column to be added either left or right the current column
	 *
	 * @param {number} tableId   Identifier key for the table
	 * @param {number} columnId  Identifier for the table column
	 * @param {string} direction Insert column left or right of current column
	 * @return {Object} Dynamic Table
	 */
	function insertColumn(tableId, columnId, direction) {
		const newColumnId = direction === 'right' ? Number(columnId) + 1 : Number(columnId);
		const newColumn = getDefaultColumn(tableId, newColumnId);
		const newColumnLabel = numberToLetter(newColumnId);

		const tableCells = table.rows
			.map(({ row_id }) => Number(row_id))
			.filter(rowId => Number.isFinite(rowId))
			.sort((a, b) => a - b)
			.map(rowId =>
				rowId === 0
					? getDefaultCell(tableId, newColumnId, rowId, 'Border')
					: getDefaultCell(tableId, newColumnId, rowId)
			);

		addColumn(tableId, columnId, direction, newColumn, tableCells);
		setTableStale(false);

		// Accessibility announcement
		speakMessage(
			direction === 'right' ? 'column-inserted-right' : 'column-inserted-left',
			{
				args: { columnLabel: newColumnLabel },
			}
		);

		return updateTableEntity(tableId);
	}

	/**
	 * Insert a new row in the table.
	 *
	 * @since 1.0.0
	 * @since 1.2.2  Allow row to be added either above or below the current row
	 *
	 * @param {number} tableId   Identifier key for the table
	 * @param {number} rowId     Identifier for the table row
	 * @param {string} direction Insert row above or below current row
	 * @return {Object} Dynamic Table
	 */
	function insertRow(tableId, rowId, direction) {
		const newRowId = direction === 'below' ? Number(rowId) + 1 : Number(rowId);
		const newRow = getDefaultRow(tableId, newRowId);

		const tableCells = table.columns
			.map(({ column_id }) => Number(column_id))
			.filter(columnId => Number.isFinite(columnId))
			.sort((a, b) => a - b)
			.map(columnId =>
				columnId === 0
					? getDefaultCell(tableId, columnId, newRowId, 'Border')
					: getDefaultCell(tableId, columnId, newRowId)
			);

		addRow(tableId, rowId, direction, newRow, tableCells);
		setTableStale(false);

		// Accessibility announcement
		speakMessage(
			direction === 'below' ? 'row-inserted-below' : 'row-inserted-above',
			{
				args: { rowNumber: newRowId },
			}
		);

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

		// Accessibility announcement
		speakMessage('column-deleted', {
			args: { columnLabel: numberToLetter(Number(columnId)) },
		});

		return updateTableEntity(tableId);
	}

	/**
	 * Delete a row from the table
	 *
	 * @since 1.0.0
	 *
	 * @param {*} tableId
	 * @param {*} rowId
	 * @return {Object} Dynamic Table
	 */
	function deleteRow(tableId, rowId) {
		removeRow(tableId, rowId);
		setTableStale(false);

		// Accessibility announcement
		speakMessage('row-deleted', {
			args: { rowNumber: Number(rowId) },
		});

		return updateTableEntity(tableId);
	}

	/**
	 * Move a column left or right
	 *
	 * @since 1.2.2
	 *
	 * @param {number} tableId   Identifier key for the table
	 * @param {number} columnId  Identifier key for the column to be moved
	 * @param {string} direction Move column left or right
	 * @return {Object} Dynamic Table
	 */
	function reorderColumns(tableId, columnId, direction) {
		moveColumn(tableId, columnId, direction);
		setTableStale(false);

		// Accessibility announcement
		speakMessage(
			direction === 'right' ? 'column-moved-right' : 'column-moved-left',
			{
				args: { columnLabel: numberToLetter(Number(columnId)) },
			}
		);

		return updateTableEntity(tableId);
	}

	/**
	 * Move a row up or down
	 *
	 * @since 1.2.2
	 *
	 * @param {number} tableId
	 * @param {number} rowId
	 * @param {string} direction Move row up or down
	 * @return {Object} Dynamic Table
	 */
	function reorderRows(tableId, rowId, direction) {
		moveRow(tableId, rowId, direction);
		setTableStale(false);

		// Accessibility announcement
		speakMessage(
			direction === 'down' ? 'row-moved-down' : 'row-moved-up',
			{
				args: { rowNumber: Number(rowId) },
			}
		);

		return updateTableEntity(tableId);
	}

	/**
	 * Update table store to reflect changes made to EXISTING table attributes.
	 *
	 * @since 1.0.0
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
	 * @since 1.0.0
	 * @since 1.4.4 - Update to use table id from table object
	 *
	 * @param {Object}  table     Dynamic Table
	 * @param {boolean} isChecked Are borders being toggled on?
	 */
	function onToggleBorders(table, isChecked) {
		let updatedRows;
		let updatedColumns;
		let updatedCells;

		const currentTableId = table.table_id;
		const currentNumColumns = table.columns.filter(column => column.column_id !== '0').length;
		const currentNumRows = table.rows.filter(row => row.row_id !== '0').length;

		/**
		 * Remove borders if unchecked
		 */
		if (isChecked === false) {
			updatedRows = table.rows.filter(row => row.row_id !== '0');
			updatedColumns = table.columns.filter(column => column.column_id !== '0');
			updatedCells = table.cells.filter(cell => cell.row_id !== '0' && cell.column_id !== '0');
			updateTableBorder(table.table_id, updatedRows, updatedColumns, updatedCells);
		} else {
			/**  Create header row border at top of table */
			const rowBorder = [];
			rowBorder.push(getDefaultRow(currentTableId, 0, 'Border'));

			const rowCells = [];
			for (let i = 0; i <= currentNumColumns; i++) {
				const cell = getDefaultCell(currentTableId, i, 0, 'Border');
				rowCells.push(cell);
			}

			/** Create column border down left side of table */
			const columnBorder = [];
			columnBorder.push(getDefaultColumn(currentTableId, 0, 'Border'));

			const columnCells = [];
			for (let i = 1; i <= currentNumRows; i++) {
				const cell = getDefaultCell(currentTableId, 0, i, 'Border');
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
	 * @since 1.0.0
	 * @since 1.3.0 - Refactor to support WordPress RTC
	 * @since 1.4.4 - Show borders when table is created
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
		onToggleBorders(newTable.table, true);
		setTableOperation({
			kind: 'creating',
			blockTableRef: newBlockTableRef,
			sourceTableId: 0,
			error: null,
		});
		createTableEntity()
			.then(createdTableId => {
				props.setAttributes({
					original_post_type: postType,
					original_post_id: Number(postId),
					table_id: Number(createdTableId),
				});

				setTableOperation(prev => ({ ...prev, kind: 'ready', error: null }));
			})
			.catch(error => {
				setTableOperation({
					kind: 'error',
					blockTableRef: newBlockTableRef,
					sourceTableId: 0,
					error,
				});
			});
	}

	/**
	 * Attach existing table to new block.
	 *
	 * @since 1.4.0
	 */
	function attachLoadedTable() {
		if (!tableRequest.tableId || requestedTableIsResolving) {
			return;
		}

		const nextBlockTableRef = generateBlockTableRef();

		setTableOperation({
			kind: 'attaching',
			blockTableRef: nextBlockTableRef,
			sourceTableId: tableRequest.tableId,
			error: null,
		});

		setTableRequest(prev => ({
			...prev,
			action: 'receive',
			blockTableRef: nextBlockTableRef,
		}));
	}

	/**
	 * Process event to create new table.
	 *
	 * @since 1.0.0
	 * @since 1.4.0  Expanded support for multiple table creation methods
	 *
	 * @param {Object} event Table Creation Event
	 */
	function onCreateTable(event) {
		event.preventDefault();

		switch (tableCreationMethod) {
			case 'choose':
				break;
			case 'new':
				createTable(createDraftTable.numColumns, createDraftTable.numRows, createDraftTable.tableName);
				break;
			case 'existing-table':
				attachLoadedTable();
				break;
			default:
				break;
		}
	}

	/**
	 * Remove the placeholder block when block creation is cancelled..
	 *
	 * @since 1.4.0
	 */
	function onCancelNewBlock() {
		if (!props.clientId || !isNewBlock) {
			return;
		}

		removeMessageNotice(removeNotice, 'invalid-num-columns');
		removeMessageNotice(removeNotice, 'invalid-num-rows');

		const blockEditorDispatch = dispatch('core/block-editor');
		if (typeof blockEditorDispatch?.removeBlock !== 'function') {
			return;
		}

		blockEditorDispatch.removeBlock(props.clientId);
	}

	/**
	 * Set the chosen table creation method.
	 *
	 * @since 3.1.2
	 *
	 * @param {Object} event Table creation method event
	 */
	function onCreateTableMethod(event) {
		switch (event) {
			case 'new':
				setTableCreationMethod('new');
				break;
			case 'existing-table':
				setTableCreationMethod('existing-table');
				break;
			default:
				break;
		}
	}

	/**
	 * Store selected table for the current table request.
	 *
	 * @since 3.1.2
	 *
	 * @param {Object} event Table Creation Event
	 */
	function onAssignRequestedTableId(event) {
		setTableRequest({
			tableId: Number(event),
			action: 'idle',
			blockTableRef: '',
		});
	}

	/**
	 * Process changes for the column count when defining a new table creation.
	 *
	 * @since 1.0.0
	 *
	 * @param {number} num_columns Number of columns entered in form
	 */
	function onChangeInitialColumnCount(num_columns) {
		let newNumColumns = num_columns;
		if (num_columns < 1 || num_columns > 50) {
			showMessageNotice(createNotice, 'invalid-num-columns', {
				args: { count: num_columns },
			});

			newNumColumns = Number(createDraftTable.numColumns);
		} else {
			removeMessageNotice(removeNotice, 'invalid-num-columns');
		}
		setCreateDraftTable(prev => ({
			...prev,
			numColumns: newNumColumns,
		}));
	}

	/**
	 * Process changes for the row count when defining a new table creation.
	 *
	 * @since 1.0.0
	 *
	 * @param {number} num_rows Number of rows entered in form
	 */
	function onChangeInitialRowCount(num_rows) {
		let newNumRows = num_rows;
		if (num_rows < 1 || num_rows > 1000) {
			showMessageNotice(createNotice, 'invalid-num-rows', {
				args: { count: num_rows },
			});

			newNumRows = Number(createDraftTable.numRows);
		} else {
			removeMessageNotice(removeNotice, 'invalid-num-rows');
		}
		setCreateDraftTable(prev => ({
			...prev,
			numRows: newNumRows,
		}));
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
	 * @since 1.1.1
	 *
	 * @param {Object} event onFocusCapture event
	 * @return {void}
	 */
	function onGridFocusCapture(event) {
		if (!hasAnnouncedGridHelpRef.current) {
			hasAnnouncedGridHelpRef.current = true;
			speakMessage('editor-grid-help');
		}

		const el = event.target.closest?.('[data-cell-id]');
		if (!el) return;

		const col = Number(el.dataset.col);
		const row = Number(el.dataset.row);
		if (!Number.isFinite(col) || !Number.isFinite(row)) return;
		const isBorderCell = col === 0 || row === 0;

		// Only sync highlight; do not move focus, do not gate with pending flags
		if (!isBorderCell) {
			setFocusedCell(prev => (prev.col === col && prev.row === row ? prev : { col, row }));
		}

		// If focus moved to another cell wrapper, stop editing.
		const nextCellId = el.getAttribute('data-cell-id');
		if (editingCellId && String(editingCellId) !== String(nextCellId)) {
			stopEditingCell(false);
		}
	}

	/**
	 * Set focus to specified cell coordinates in the dynamic table.
	 *
	 * @since 1.1.1
	 *
	 * @param {number} col Column number of the cell in which the focus action occurred
	 * @param {number} row Row number of the cell in which the focus action occurred
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
		if (isNewBlock) return;

		return Math.max(
			1,
			...table.columns.map(c => Number(c.column_id)).filter(n => Number.isFinite(n) && n > 0)
		);
	}, [table.columns]);

	const navMaxRow = useMemo(() => {
		// exclude border row 0
		if (isNewBlock) return;

		return Math.max(
			1,
			...table.rows.map(r => Number(r.row_id)).filter(n => Number.isFinite(n) && n > 0)
		);
	}, [table.rows]);

	const navHeaderRow = useMemo(() => {
		// get header row if header exists
		if (isNewBlock) return;

		return table?.rows?.find(r => r.attributes.isHeader === true)?.row_id;
	}, [table.rows]);

	/**
	 * Handle keyboard navigation within the active dynamic table block and updates focus appropriately
	 *
	 * @since 1.1.1
	 * @since 1.2.3 - Add keyboard support for moving columns and rows
	 * @since 1.2.5 - Add keyboard support for insert/delete columns and rows
	 * @since 1.3.1 - Add keyboard support for cell copy/cut/paste
	 * @since 1.4.3 - Update for checkbox data entry
	 * @param {Object} event onKeyDown event
	 * @return {void}
	 */
	function onCellKeyDown(event) {
		// While editing, allow Tab/arrow keys to exit edit mode and continue with grid navigation.
		if (editingCellId) {
			const editExitNavKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);
			const editTarget = gridRef.current?.ownerDocument?.activeElement;
			const editTargetInputType =
				editTarget?.tagName === 'INPUT' ? String(editTarget.type || '').toLowerCase() : '';
			const editTargetInputMode =
				editTarget?.tagName === 'INPUT' ? String(editTarget.inputMode || '').toLowerCase() : '';
			const isNumberEditor =
				['number', 'integer', 'percent', 'currency'].includes(editTargetInputType) ||
				['numeric', 'decimal'].includes(editTargetInputMode);
			const isDateTimeEditor = ['date', 'time', 'datetime-local'].includes(editTargetInputType);
			if (cellClipboard.inUse) resetCellClipboard();

			if (event.key === 'Escape') {
				event.preventDefault();
				event.stopPropagation();

				if (editTarget?.tagName === 'INPUT' || editTarget?.tagName === 'TEXTAREA') {
					editTarget.dataset.cancelEdit = 'true';
					editTarget.blur?.();
					return;
				}

				stopEditingCell();
				window.requestAnimationFrame(() => {
					const wrapper = gridRef.current?.querySelector(`[data-cell-id][tabindex="0"]`);
					wrapper?.focus?.();
				});
				return;
			}

			// For native date/time editors, Enter should commit via blur and exit edit mode.
			if (event.key === 'Enter' && (isDateTimeEditor || isNumberEditor)) {
				event.preventDefault();
				event.stopPropagation();
				editTarget?.blur?.();
				return;
			}

			if (
				(isDateTimeEditor || isNumberEditor) &&
				['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
			) {
				return;
			}

			// Let Tab/arrow keys fall through to navigation.
			// Do not clear editing state yet; date/time inputs persist on blur.
			if (!editExitNavKeys.has(event.key)) {
				return;
			}
		}

		const root = gridRef.current;
		if (!root) return;

		const doc = root.ownerDocument || document;
		const active = doc.activeElement;
		const activeBorderHandle = active?.closest?.('.grid-control__border-button');

		if (activeBorderHandle && root.contains(activeBorderHandle)) {
			return;
		}

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

		const columnDataType = columnDataTypes[col]?.type || 'general';
		const activeRow = table.rows.find(r => Number(r.row_id) === row);
		const isHeaderRow = activeRow?.attributes?.isHeader === true;
		const editDataType = isHeaderRow ? 'general' : columnDataType;
		const canTypeToEdit =
			isHeaderRow ||
			editDataType === 'general' ||
			editDataType === 'date-time' ||
			editDataType === 'number' ||
			editDataType === 'checkbox';
		const canStartEditFromPrintableKey =
			canTypeToEdit && (editDataType !== 'checkbox' || event.key === ' ');
		const isAltOnly = event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey;
		const isShiftOnly = !event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey;
		const isAltShiftOnly = event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey;
		const isCtlOnly = !event.altKey && !event.shiftKey && (event.ctrlKey || event.metaKey);
		const isAnyModifierKey = event.altKey || event.shiftKey || event.ctrlKey || event.metaKey;
		const isPrimaryKeyOnly = !event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey;
		const canUseRowInsertDeleteShortcuts = !isHeaderRow;
		const canUseStructureShortcuts = !isContentOnlyMode;
		const cellId = activeCellEl.getAttribute('data-cell-id');
		const isCellMenuShortcut =
			event.key === 'ContextMenu' ||
			(!event.altKey && !event.ctrlKey && !event.metaKey && event.shiftKey && event.key === 'F10');

		// Support accessibility
		if (isCellMenuShortcut) {
			if (isContentOnlyMode) return;

			event.preventDefault();
			event.stopPropagation();

			const activeCell = table?.cells?.find(
				c => Number(c.column_id) === col && Number(c.row_id) === row
			);

			openCellMenu(
				{
					currentTarget: activeCellEl,
					detail: 0,
					preventDefault() {},
					stopPropagation() {},
				},
				cellId,
				activeCell?.attributes || {}
			);
			return;
		}

		// Allow direct edit for printable keys that do not include a modifier
		// if (!navKeys.has(event.key) && (isPrimaryKeyOnly || isShiftOnly) && isPrintableKey(event) && canTypeToEdit) {
		if (
			!navKeys.has(event.key) &&
			(isPrimaryKeyOnly || isShiftOnly) &&
			isPrintableKey(event) &&
			canStartEditFromPrintableKey
		) {
			// Enter edit mode
			onCellKeyDownEditing(event, activeCellEl, event.key, editDataType);
			return;
		}

		// Enter edit mode
		if (event.key === 'Enter' || event.key === 'F2') {
			event.preventDefault();
			event.stopPropagation();
			startEditingCell(cellId);
			window.requestAnimationFrame(() => {
				// activeCellEl?.querySelector?.('[contenteditable="true"], input, textarea')?.focus?.();
				activeCellEl?.querySelector?.('[contenteditable="true"], input, textarea, button')?.focus?.();
			});
			return;
		}

		// Intercept navigation
		event.preventDefault();
		event.stopPropagation();

		switch (event.key) {
			case 'ArrowUp':
				// Insert row above the current row
				if (isAltShiftOnly && canUseRowInsertDeleteShortcuts) {
					insertRow(table_id, row, 'above');
					break;
				}

				// Move row above the current row
				if (isAltOnly && canUseStructureShortcuts) {
					const firstBodyRowId = navHeaderRow ? Number(navHeaderRow) + 1 : 1;
					if (row <= firstBodyRowId) break;
					reorderRows(table_id, row, 'up');
					break;
				}

				// Navigate to cell above the current cell
				if (isPrimaryKeyOnly) {
					row = Math.max(1, row - 1);
					break;
				}
				break;
			case 'ArrowDown':
				// Insert row below the current row
				if (isAltShiftOnly && canUseRowInsertDeleteShortcuts) {
					insertRow(table_id, row, 'below');
					break;
				}

				// Move row below the current row
				if (isAltOnly && canUseStructureShortcuts) {
					if (isHeaderRow || row === navMaxRow) break;
					reorderRows(table_id, row, 'down');
					break;
				}

				// Navigate to cell below the current cell
				if (isPrimaryKeyOnly) {
					row = Math.min(navMaxRow, row + 1);
					break;
				}
				break;
			case 'ArrowLeft':
				// Insert column left of the current column
				if (isAltShiftOnly && canUseStructureShortcuts) {
					insertColumn(table_id, col, 'left');
					break;
				}

				// Move column left of the current column
				if (isAltOnly && canUseStructureShortcuts) {
					if (col === 1) break;
					reorderColumns(table_id, col, 'left');
					break;
				}

				// Navigate to cell left of the current cell
				if (isPrimaryKeyOnly) {
					col = Math.max(1, col - 1);
					break;
				}
				break;
			case 'ArrowRight':
				// Insert column right of the current column
				if (isAltShiftOnly && canUseStructureShortcuts) {
					insertColumn(table_id, col, 'right');
					break;
				}

				// Move column right of the current column
				if (isAltOnly && canUseStructureShortcuts) {
					if (col === navMaxCol) break;
					reorderColumns(table_id, col, 'right');
					break;
				}

				// Navigate to cell right of the current cell
				if (isPrimaryKeyOnly) {
					col = Math.min(navMaxCol, col + 1);
					break;
				}
				break;
			case 'Tab':
				// Navigate to cell left of the current cell
				if (isShiftOnly) {
					if (col > 1) col -= 1;
					else if (row > 1) {
						row -= 1;
						col = navMaxCol;
					}
				}

				if (isPrimaryKeyOnly) {
					// Navigate to cell right of the current cell
					// eslint-disable-next-line no-lonely-if
					if (col < navMaxCol) {
						col = Math.min(navMaxCol, col + 1);
					} else if (col === navMaxCol && row < navMaxRow) {
						row += 1;
						col = 1;
					}
					break;
				}
				break;
			case 'Delete':
			case 'Backspace':
				if (isPrimaryKeyOnly) {
					processCellDelete(col, row);
					return;
				}

				// Delete the current column
				if (event.key === 'Delete' && isAltShiftOnly && canUseStructureShortcuts) {
					deleteColumn(table_id, col);
					break;
				}

				// Delete the current row
				if (event.key === 'Delete' && isAltOnly && canUseRowInsertDeleteShortcuts) {
					deleteRow(table_id, row);
					break;
				}
				break;
			case 'Escape':
				if (cellClipboard.inUse) resetCellClipboard();
				break;
			case 'C':
			case 'c':
				// Copy selected cell content
				if (isCtlOnly) {
					copyCellData(cellId, 'copyCell');
				}
				break;
			case 'V':
			case 'v':
				// Paste to selected cell
				if (isCtlOnly) {
					pasteCellData(cellId);
				}
				break;
			case 'X':
			case 'x':
				// Cut selected cell content
				if (isCtlOnly) {
					copyCellData(cellId, 'cutCell');
				}
				break;
			default:
				console.log('Key Code = ' + event.key);
				return;
		}
		focusCell(col, row);
	}

	/**
	 * Remove all data from a specific cell reference
	 *
	 * @since 1.2.5
	 *
	 * @param {number} columnId Column ID of cell to delete data
	 * @param {number} rowId    Row ID of cell to delete data
	 */
	function processCellDelete(columnId, rowId) {
		const cellData = table.cells.find(
			c => Number(c.column_id) === columnId && Number(c.row_id) === rowId
		);

		if (cellData) {
			const attrs = {
				...(cellData.attributes || {}),
				value: {
					...((cellData.attributes && cellData.attributes.value) || {}),
					indexText: '',
				},
			};
			setTableAttributes(table_id, 'cell', cellData.cell_id, 'CONTENT', '');
			setTableAttributes(table_id, 'cell', cellData.cell_id, 'ATTRIBUTES', attrs);
		}
	}

	/**
	 * Identify if key press was a printable character
	 *
	 * @since 1.2.0
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
	 * @since 1.2.0
	 * @since 1.4.3 - Update for checkbox data entry
	 *
	 * @param {Object} event          onKeyDown event
	 * @param {Object} activeCellEl   Current cell element
	 * @param {string} char           Key pressed
	 * @param {string} columnDataType Data Type for Column
	 */
	function onCellKeyDownEditing(event, activeCellEl, char, columnDataType = 'general') {
		const id = activeCellEl.getAttribute('data-cell-id');

		// For input-backed editors, mount synchronously so the initiating
		// printable key can be handled by the input itself.
		// if (columnDataType === 'date-time' || columnDataType === 'number') {
		if (
			columnDataType === 'date-time' ||
			columnDataType === 'number' ||
			columnDataType === 'checkbox'
		) {
			if (columnDataType === 'checkbox' && char === ' ') {
				event.preventDefault();
				event.stopPropagation();
			}

			flushSync(() => {
				startEditingCell(id);
			});

			const focusInputEditor = () => {
				const mountedCellEl = gridRef.current?.querySelector(`[data-cell-id="${CSS.escape(id)}"]`);
				// const input = mountedCellEl?.querySelector?.('input, textarea');
				const control = mountedCellEl?.querySelector?.('input, textarea, button');
				const input = control?.tagName === 'INPUT' ? control : null;

				// Clear existing date-time value when entering edit mode
				if (columnDataType === 'date-time' && input) {
					const valueSetter = Object.getOwnPropertyDescriptor(
						window.HTMLInputElement.prototype,
						'value'
					)?.set;

					if (valueSetter) {
						valueSetter.call(input, '');
					} else {
						input.value = '';
					}
				}

				// input?.focus?.();
				control?.focus?.();

				if (columnDataType === 'date-time' && input) {
					input.dispatchEvent(new Event('input', { bubbles: true }));
				}

				if (columnDataType === 'number' && input) {
					input.setSelectionRange?.(0, input.value.length);
				}

				// return !!input;
				if (columnDataType === 'checkbox' && char === ' ') {
					control?.click?.();
				}

				return !!control;
			};

			// Try immediately (same key event), then fallback next frame.
			if (!focusInputEditor()) {
				window.requestAnimationFrame(() => {
					focusInputEditor();
				});
			}
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		startEditingCell(id);

		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => {
				const doc = activeCellEl.ownerDocument;
				const editable = activeCellEl.querySelector('[contenteditable="true"]');
				const input = activeCellEl.querySelector('input, textarea');

				if (editable) {
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
					input.focus();

					const nativeDateTimeInput =
						columnDataType === 'date-time' ||
						['date', 'time', 'datetime-local'].includes(input.type);

					// For native date/time controls, typing should enter edit mode and focus input.
					// Do not append raw characters (often invalid for these input types).
					if (nativeDateTimeInput) return;

					const v = input.value ?? '';
					input.value = v + char;

					// Make React/Gutenberg notice the change
					input.dispatchEvent(new Event('input', { bubbles: true }));

					// Caret to end
					if (['text', 'search', 'tel', 'url', 'password'].includes(input.type)) {
						const end = input.value.length;
						input.setSelectionRange?.(end, end);
					}
				}
			});
		});
	}

	/**
	 * Process updates (insert, update, delete) to a table column.
	 *
	 * @since 1.0.0
	 * @since 1.1.1  Updated to support column menu refactor.
	 * @since 1.2.2  Added actions to move a column left or right and insert to the right
	 *
	 * @param {Object} e                       Table Creation Event
	 * @param {string} updateType              attribute (Update), insert, delete
	 * @param {number} tableId                 Identifier key for the table
	 * @param {number} columnId                Identifier for the table column
	 * @param {string} columnName              Column name
	 * @param {Array}  updatedColumnAttributes New column attribute values
	 * @param {string} updatedColumnClasses    New column class values
	 */
	function onUpdateColumn(
		e,
		updateType,
		tableId,
		columnId,
		columnName = '',
		updatedColumnAttributes,
		updatedColumnClasses
	) {
		if (isContentOnlyMode) {
			return;
		}

		switch (updateType) {
			case 'attributes': {
				if (!updatedColumnAttributes) {
					const clickedColumn = table.columns.find(c => String(c.column_id) === String(columnId));
					const attrs = clickedColumn?.attributes || {};
					const columnLabel = clickedColumn?.column_name || String(columnId);
					openColumnWidthModal(e, String(columnId), columnLabel, attrs);
				} else {
					setTableAttributes(tableId, 'column', String(columnId), 'ATTRIBUTES', updatedColumnAttributes);
				}
				break;
			}
			case 'dataType': {
				if (!updatedColumnAttributes) {
					const clickedColumn = table.columns.find(c => String(c.column_id) === String(columnId));
					const columnLabel = clickedColumn?.column_name || String(columnId);
					const attrs = clickedColumn?.attributes || {};
					const classes = clickedColumn?.classes || '';
					openColumnDataTypeModal(e, String(columnId), columnLabel, attrs, classes);
				} else {
					setTableAttributes(tableId, 'column_name', String(columnId), 'PROP', columnName);
					setTableAttributes(tableId, 'column', String(columnId), 'ATTRIBUTES', updatedColumnAttributes);
					setTableAttributes(tableId, 'column', String(columnId), 'CLASSES', updatedColumnClasses);
				}
				break;
			}
			case 'insert-left': {
				insertColumn(tableId, String(columnId), 'left');
				break;
			}
			case 'insert-right': {
				insertColumn(tableId, String(columnId), 'right');
				break;
			}
			case 'delete': {
				deleteColumn(tableId, String(columnId));
				break;
			}
			case 'move-left': {
				reorderColumns(tableId, String(columnId), 'left');
				break;
			}
			case 'move-right': {
				reorderColumns(tableId, String(columnId), 'right');
				break;
			}
			default:
				console.log('Unrecognized Column Update Type');
		}
	}

	/**
	 * Update table row based on row menu actions.
	 *
	 * Description: Current actions include row insert, delete, update height.
	 *
	 * @since 1.0.0
	 * @since 1.1.1  Updated to support row menu refactor.
	 * @since 1.2.2  Added actions to move a row up or down and insert below
	 *
	 * @param {Object} e                    Table Creation Event
	 * @param {string} updateType           attribute (Update), insert, delete
	 * @param {number} tableId              Identifier key for the table
	 * @param {number} rowId                Identifier for the table row
	 * @param {Array}  updatedRowAttributes New row attribute values
	 */
	function onUpdateRow(e, updateType, tableId, rowId, updatedRowAttributes) {
		if (isContentOnlyMode && !isContentOnlyRowAction(updateType)) {
			return;
		}

		switch (updateType) {
			case 'attributes': {
				if (!updatedRowAttributes) {
					const clickedRow = table.rows.find(r => String(r.row_id) === String(rowId));
					const attrs = clickedRow?.attributes || {};
					openRowHeightModal(e, rowId, String(rowId), attrs);
				} else {
					setTableAttributes(tableId, 'row', String(rowId), 'ATTRIBUTES', updatedRowAttributes);
				}
				break;
			}
			case 'insert-above': {
				insertRow(tableId, String(rowId), 'above');
				break;
			}
			case 'insert-below': {
				insertRow(tableId, String(rowId), 'below');
				break;
			}
			case 'delete': {
				deleteRow(tableId, String(rowId));
				break;
			}
			case 'move-up': {
				reorderRows(tableId, String(rowId), 'up');
				break;
			}
			case 'move-down': {
				reorderRows(tableId, String(rowId), 'down');
				break;
			}
			default:
				console.log('Unrecognized Row Update Type');
		}
	}

	/**
	 * Update table based on cell menu actions.
	 *
	 * Description: Current actions include copy, cut, paste.
	 *
	 * @since 1.3.1
	 *
	 * @param {Object} e                     Table Creation Event
	 * @param {string} updateType            Action to perform
	 * @param {number} tableId               Identifier key for the table
	 * @param {number} cellId                Identifier for the table cell
	 * @param {Array}  updatedCellAttributes Cell attribute values
	 */
	function onUpdateCell(e, updateType, tableId, cellId, updatedCellAttributes) {
		if (isContentOnlyMode && !isContentOnlyRowAction(updateType)) {
			return;
		}

		const { column_id, row_id } = getCellIdCoordinates(cellId);

		switch (updateType) {
			case 'copyCell':
			case 'cutCell': {
				copyCellData(cellId, updateType);
				break;
			}
			case 'pasteCell': {
				pasteCellData(cellId);
				break;
			}
			case 'clearCellContent': {
				processCellDelete(column_id, row_id);
				break;
			}
			case 'insert-above': {
				insertRow(tableId, row_id, 'above');
				break;
			}
			case 'insert-below': {
				insertRow(tableId, row_id, 'below');
				break;
			}
			case 'delete': {
				deleteRow(tableId, row_id);
				break;
			}
			case 'move-up': {
				reorderRows(tableId, row_id, 'up');
				break;
			}
			case 'move-down': {
				reorderRows(tableId, row_id, 'down');
				break;
			}
			default:
				console.log('Unrecognized Row Update Type');
		}
	}

	/**
	 * Copy cell data to clipboard.
	 *
	 * @since 1.3.1
	 *
	 * @param {number} cellId     Identifier for the table cell
	 * @param {string} updateType Action to perform
	 */
	function copyCellData(cellId, updateType) {
		const { column_id, row_id } = getCellIdCoordinates(cellId);
		const cellData = table.cells.find(
			c => Number(c.column_id) === Number(column_id) && Number(c.row_id) === Number(row_id)
		);
		if (cellData) {
			const columnDataType = getClipboardDataType(column_id, row_id);
			const columnDataTypeSettings =
				columnDataType === 'general' ? { type: 'general' } : columnDataTypes[column_id];
			const cellContent = cellData?.content || '';
			const cellValueAttr = cellData?.attributes?.value || {};
			const { formattedText, plainText } = formatClipboardContent(
				cellContent,
				cellValueAttr,
				columnDataTypeSettings
			);

			const clipboardPayload = {
				inUse: true,
				clipboardAction: updateType === 'copyCell' ? 'copy' : 'cut',
				sourceCellId: cellId,
				columnId: column_id,
				rowId: row_id,
				columnDataType: columnDataType,
				cellContent: cellContent,
				cellValueAttr: cellValueAttr,
				cellFormattedText: formattedText,
				cellPlainText: plainText,
			};

			// Copy to the block's internal clipboard
			setCellClipboard({ ...clipboardPayload });
			speakMessage(updateType === 'cutCell' ? 'cell-cut' : 'cell-copied');

			copyCellToSystemClipboard(formattedText, plainText);
		}
	}

	/**
	 * Paste data to the current cell from clipboard.
	 *
	 * @since 1.3.1
	 *
	 * @param {number} cellId Identifier for the table cell
	 */
	function pasteCellData(cellId) {
		const { column_id, row_id } = getCellIdCoordinates(cellId);
		const {
			inUse,
			clipboardAction,
			sourceCellId,
			columnId,
			rowId,
			columnDataType,
			cellContent,
			cellValueAttr,
		} = cellClipboard;

		if (!inUse) return;
		if (clipboardAction === 'cut' && sourceCellId === cellId) {
			resetCellClipboard();
			return;
		}

		const currentColumnDataType = getClipboardDataType(column_id, row_id);

		if (columnDataType !== currentColumnDataType) {
			publishMessage(createNotice, 'paste-content-type-mismatch', {
				target: MESSAGE_TARGETS.STORE_SNACKBAR,
				announceMode: 'manual',
			});
			return;
		}

		const currentCellData = table.cells.find(
			c => Number(c.column_id) === Number(column_id) && Number(c.row_id) === Number(row_id)
		);

		const currentCellValueAttr = currentCellData?.attributes || {};
		const updatedCellAttrs = {
			...currentCellValueAttr,
			value: cellValueAttr,
		};

		setTableAttributes(table_id, 'cell', cellId, 'CONTENT', cellContent);
		setTableAttributes(table_id, 'cell', cellId, 'ATTRIBUTES', updatedCellAttrs);

		if (clipboardAction === 'cut') {
			processCellDelete(columnId, rowId);
			resetCellClipboard();
		}
		speakMessage('cell-pasted');
	}

	/**
	 * Paste data to the current cell from clipboard.
	 *
	 * @since 1.3.1
	 *
	 * @param {number} cellId Identifier for the table cell
	 */
	function getClipboardDataType(columnId, rowId) {
		const isHeaderRow =
			table?.rows?.find(r => Number(r.row_id) === Number(rowId))?.attributes?.isHeader === true;

		if (isHeaderRow) {
			return 'general';
		}

		return (
			table?.columns?.find(c => Number(c.column_id) === Number(columnId))?.attributes
				?.columnDataType?.type || 'general'
		);
	}

	/**
	 * Load clipboard content into system clipboard.
	 *
	 * @since 1.3.1
	 *
	 * @param {string} formattedText Copied formatted text
	 * @param {string} plainText Copied plain text
	 */
	function copyCellToSystemClipboard(formattedText, plainText) {
		if (typeof window !== 'undefined' && window.ClipboardItem && navigator?.clipboard?.write) {

			const clipboardFormattedText =
			`<!--StartFragment-->${formattedText}<!--EndFragment-->`;

			const clipboardItem = new window.ClipboardItem({
				'text/html': new window.Blob([clipboardFormattedText], { type: 'text/html' }),
				'text/plain': new window.Blob([plainText], { type: 'text/plain' }),
			});
			navigator.clipboard.write([clipboardItem]).catch(() => {
				copyPlainTextToSystemClipboard(plainText);
			});
			return;
		}
		copyPlainTextToSystemClipboard(plainText);
	}

	/**
	 * Load legacy system clipboard.
	 *
	 * @since 1.3.1
	 *
	 * @param {string} clipboardContent Plain text to copy to clipboard
	 */
	function copyPlainTextToSystemClipboard(clipboardContent) {
		if (navigator?.clipboard?.writeText) {
			navigator.clipboard.writeText(clipboardContent).catch(() => {
				legacySystemClipboardFallback(clipboardContent);
			});
			return;
		}
		legacySystemClipboardFallback(clipboardContent);
	}

	/**
	 * Copy cell data to legacy system clipboard.
	 *
	 * Desrciption: This is a fallback method for copying text to the clipboard for browsers
	 * 				that do not support the modern asynchronous clipboard API or where browser
	 * 				security settings prevent its use.
	 *
	 * @since 1.3.1
	 *
	 * @param {string} clipboardContent Text to copy to the clipboard
	 */
	function legacySystemClipboardFallback(clipboardContent) {
		const tempTextArea = document.createElement('textarea');

		tempTextArea.value = clipboardContent;
		tempTextArea.setAttribute('readonly', '');

		// Keep it off-screen so it does not affect layout.
		tempTextArea.style.position = 'absolute';
		tempTextArea.style.left = '-9999px';
		tempTextArea.style.top = '0';

		document.body.appendChild(tempTextArea);

		// Select the text so document.execCommand('copy') has an active selection.
		tempTextArea.focus();
		tempTextArea.select();
		tempTextArea.setSelectionRange(0, tempTextArea.value.length);

		try {
			// execCommand is deprecated but still widely supported
			// The use is as a legacy backup
			document.execCommand('copy');
		} finally {
			document.body.removeChild(tempTextArea);
		}
	}

	/**
	 * Process mouse clicks on the table borders.
	 *
	 * @since 1.0.0
	 *
	 * @param {number} column_id Identifier for the table column
	 * @param {number} row_id    Identifier for the table row
	 * @param {Object} table     Dynamic Table
	 * @param {Object} e         Mouse Click Event
	 */
	function onMouseMenuClick(column_id, row_id, table, e) {
		e?.preventDefault?.();
		e?.stopPropagation?.();

		if (Number(row_id) === 0 && Number(column_id) !== 0) {
			if (isContentOnlyMode) {
				return;
			}

			const clickedColumn = table.columns.find(c => String(c.column_id) === String(column_id));
			const attrs = clickedColumn?.attributes || {};
			const columnLabel = numberToLetter(Number(column_id));
			openColumnMenu(e, String(column_id), columnLabel, attrs);
		}

		if (Number(row_id) !== 0 && Number(column_id) === 0) {
			const clickedRow = table?.rows?.find(r => Number(r.row_id) === Number(row_id));
			if (isContentOnlyMode && clickedRow?.attributes?.isHeader) {
				return;
			}
			const attrs = clickedRow?.attributes || {};
			openRowMenu(e, String(row_id), String(row_id), attrs);
		}

		if (Number(row_id) !== 0 && Number(column_id) !== 0) {
			const clickedCell = table?.cells?.find(
				c => Number(c.row_id) === Number(row_id) && Number(c.column_id) === Number(column_id)
			);
			const relatedRow = table?.rows?.find(r => Number(r.row_id) === Number(row_id));
			const cellId = numberToLetter(Number(column_id)) + row_id;
			if (isContentOnlyMode) {
				return;
			}
			const attrs = {
				isRowHeader: relatedRow?.attributes?.isHeader === true ? true : false,
				cellAttributes: clickedCell?.attributes || {},
			};
			openCellMenu(e, cellId, attrs);
		}
		setTableStale(false);
	}

	/**
	 * Process request to prevent the table title from displaying
	 *
	 * @since 1.0.0
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

		// Accessibility announcement
		speakMessage(isChecked ? 'table-title-hidden' : 'table-title-shown');
	}

	/**
	 * Process request to allow the table to scroll horizontally
	 *
	 * @since 1.0.0
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
	 * @since 1.0.0
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
		if (type == 'background' && color !== undefined && color !== null) {
			updatedTableAttributes = {
				...table.attributes,
				bandedRowBackgroundColor: color,
			};
			setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
		}

		if (type == 'text' && color !== undefined && color !== null) {
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
	 * @since 1.0.0
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
	 * @since 1.0.0
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
	 * @since 1.0.0
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
	 * @since 1.0.0
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
	 * @since 1.0.0
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
	 * @since 1.0.0
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
	 * @since 1.0.0
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
	 * @since 1.0.0
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
		liveNumRows,
		enableHeaderRow,
		showBorders,
		false
	);

	const startGridBodyRowNbrStyle = startGridRowNbr(enableHeaderRow, showBorders);

	const endGridBodyRowNbrStyle = endGridRowNbr(
		startGridBodyRowNbrStyle,
		'Body',
		liveNumRows,
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

	// Accessibility support
	const editorGridTitleText = htmlToIndexText(table?.table_name || '').trim();
	const editorGridAccessibleName = editorGridTitleText || __('Dynamic table');
	const editorGridLabelledBy = !hideTitle && editorGridTitleText ? editorTitleTagId : undefined;
	const editorGridHelpText = getMessageText('editor-grid-help');

	// Create table settings
	const createTableDisabled =
		tableCreationMethod === 'choose' ||
		isAwaitingTableAttachment ||
		(tableCreationMethod === 'existing-table' &&
			(!tableRequest.tableId || requestedTableIsResolving));


	/**
	 * Render clickable row menu
	 *
	 * @since 1.2.0
	 */
	const renderRowMenu = (
		<>
			{rowMenu.isOpen && rowMenu.anchorEl && (
				<RowMenu
					menuId={editorRowMenuTagId}
					anchor={rowMenu.anchorEl}
					table={table}
					isContentOnlyMode={isContentOnlyMode}
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
			{!isContentOnlyMode && rowHeightModal.isOpen && (
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
			{!isContentOnlyMode && columnMenu.isOpen && columnMenu.anchorEl && (
				<ColumnMenu
					menuId={editorColumnMenuTagId}
					anchor={columnMenu.anchorEl}
					table={table}
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
			{!isContentOnlyMode && columnDataTypeModal.isOpen && (
				<ColumnDataTypeModal
					tableId={table_id}
					columnId={columnDataTypeModal.columnId}
					columnLabel={columnDataTypeModal.columnLabel}
					columnAttributes={columnDataTypeModal.columnAttributes}
					columnClasses={columnDataTypeModal.columnClasses}
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
			{!isContentOnlyMode && columnWidthModal.isOpen && (
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
	 * Render clickable cell menu
	 *
	 * @since 1.3.1
	 */
	const renderCellMenu = (
		<>
			{!isContentOnlyMode && cellMenu.isOpen && cellMenu.anchorEl && (
				<CellMenu
					menuId={editorCellMenuTagId}
					anchor={cellMenu.anchorEl}
					table={table}
					isContentOnlyMode={isContentOnlyMode}
					cellId={cellMenu.cellId}
					cellAttributes={cellMenu.cellAttributes}
					canPaste={cellClipboard.inUse}
					updatedCell={onUpdateCell}
					onRequestClose={closeCellMenu}
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
	const renderControls = !isContentOnlyMode && (
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
								{htmlToIndexText(table.table_name)}
							</div>
						</PanelRow>

						<PanelRow>
							<div className="grid-control__inspector-controls--read-only">
								<span className="grid-control__inspector-controls--read-only-label">
									Table Columns/Rows:
								</span>
								{liveNumColumns}/{liveNumRows}
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
									id={editorHeaderAlignmentTagId}
									value={headerAlignment}
									onChange={e => onAlignHeader(table, e)}
								/>
								<label
									className="inspector-controls-nemu__label--left-margin"
									htmlFor={editorHeaderAlignmentTagId}
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
								label="Allow Horizontal Scroll?"
								__nextHasNoMarginBottom
								checked={allowHorizontalScroll}
								onChange={e => onAllowHorizontalScroll(table, e)}
							/>
						</PanelRow>

						<PanelRow>
							<span className="inspector-controls-menu__header-alignment--middle">
								<AlignmentControl
									id={editorBodyAlignmentTagId}
									value={bodyAlignment}
									onChange={e => onAlignBody(table, e)}
								/>
								<label
									className="inspector-controls-menu__label--left-margin"
									htmlFor={editorBodyAlignmentTagId}
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
					{renderCellMenu}
					{renderControls}

					<div style={{ display: 'block' }}>
						{!hideTitle && (
							<RichText
								id={editorTitleTagId}
								className="dtbk-table-title"
								style={{ '--gridAlignment': gridAlignment }}
								tagName="p"
								allowedFormats={['core/bold', 'core/italic']}
								onChange={e => setTableAttributes(table_id, 'table_name', '', 'PROP', e)}
								value={table.table_name}
							></RichText>
						)}

						<p id={editorGridHelpTagId} className="screen-reader-text">
							{editorGridHelpText}
						</p>

						<div
							id={editorGridTagId}
							role="grid"
							aria-rowcount={Number(navMaxRow)}
							aria-colcount={Number(navMaxCol)}
							aria-labelledby={editorGridLabelledBy}
							aria-label={editorGridLabelledBy ? undefined : editorGridAccessibleName}
							aria-describedby={editorGridHelpTagId}
							ref={gridRef}
							onKeyDownCapture={onCellKeyDown} // <-- capture phase
							onFocusCapture={onGridFocusCapture}
							tabIndex={0}
						>
							<div
								className="grid-scroller"
								style={{
									'--headerRowSticky': headerRowStickyStyle,
								}}
							>
								<div
									className={'grid-control ' + headerRowStickyClass}
									style={{
										'--gridTemplateColumns': gridColumnStyle,
										'--horizontalScroll': horizontalScrollStyle,
										'--headerRowSticky': headerRowStickyStyle,
										'--gridNumColumns': liveNumColumns,
										'--gridNumRows': liveNumRows,
										'--gridAlignment': gridAlignment,
									}}
								>
									{/* Render Table Border Row if present */}
									{showBorders && (
										<div className={'grid-control__border'} role="presentation">
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
																	isContentOnlyMode={isContentOnlyMode}
																	dataFormat={columnDataTypes[column_id]}
																	cell_id={cell_id}
																	table={table}
																	content={borderContent}
																	attributes={attributes}
																	columnClassNames={''}
																	cellClassNames={classes}
																	borderHandleProps={{
																		ariaLabel: `Column ${numberToLetter(Number(column_id))} options`,
																		controls: editorColumnMenuTagId,
																		expanded:
																			columnMenu.isOpen &&
																			String(columnMenu.columnId) === String(column_id),
																	}}
																	onMouseDown={onMouseMenuClick}
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
													role="row"
													aria-rowindex={Number(row_id)}
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

																const isClipboard =
																	cellClipboard.inUse &&
																	cellClipboard.columnId === Number(column_id) &&
																	cellClipboard.rowId === Number(row_id);
																if (isClipboard) {
																	// Animate cell when it is the clipboard source
																	calculatedClasses =
																		calculatedClasses + 'grid-control__cell--copied ';
																}

																const isFocused =
																	focusedCell.col === Number(column_id) &&
																	focusedCell.row === Number(row_id);
																if (isFocused) {
																	// Show distinct border when cell has focus
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
																				isContentOnlyMode={isContentOnlyMode}
																				dataFormat={columnDataTypes[column_id]}
																				cell_id={cell_id}
																				table={table}
																				content={borderContent}
																				attributes={attributes}
																				columnClassNames={''}
																				cellClassNames={classes}
																				borderHandleProps={{
																					ariaLabel: `Row ${String(row_id)} options`,
																					controls: editorRowMenuTagId,
																					expanded:
																						rowMenu.isOpen &&
																						String(rowMenu.rowId) === String(row_id),
																				}}
																				onMouseDown={onMouseMenuClick}
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
																				table={table}
																				cellTagId={getEditorColumnHeaderTagId(column_id)}
																				content={content}
																				attributes={attributes}
																				isFocused={isFocused}
																				columnClassNames={''}
																				cellClassNames={
																					'grid-control__header-cells ' +
																					'grid-control__cellEditor ' +
																					classes +
																					calculatedClasses
																				}
																				showGridLinesCSS={showGridLinesCSS}
																				gridLineWidthCSS={gridLineWidthCSS}
																				isEditing={editingCellId === cell_id}
																				canOpenContextMenu={!isContentOnlyMode}
																				contextMenuProps={{
																					controls: editorCellMenuTagId,
																					expanded:
																						cellMenu.isOpen &&
																						String(cellMenu.cellId) === String(cell_id),
																				}}
																				onRequestFocus={(col, row) => {
																					setFocusedCell(prev =>
																						prev.col === col && prev.row === row
																							? prev
																							: { col, row }
																					);
																					focusCell(col, row);
																				}}
																				onRequestEdit={id => {
																					startEditingCell(id);
																					window.requestAnimationFrame(() => {
																						const wrapper = gridRef.current?.querySelector(
																							`[data-cell-id="${CSS.escape(id)}"]`
																						);
																						wrapper
																							?.querySelector?.(
																								'[contenteditable="true"], input, textarea, button'
																							)
																							?.focus?.();
																					});
																				}}
																				onRequestStopEdit={() => {
																					stopEditingCell();
																					window.requestAnimationFrame(() => {
																						const activeCellId =
																							gridRef.current?.ownerDocument?.activeElement
																								?.closest?.('[data-cell-id]')
																								?.getAttribute?.('data-cell-id');
																						if (
																							activeCellId &&
																							String(activeCellId) !== String(cell_id)
																						) {
																							return;
																						}
																						focusCell(Number(column_id), Number(row_id));
																					});
																				}}
																				onChange={onChangeCellData}
																				onMouseDown={onMouseMenuClick}
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
										role="rowgroup"
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
														role="row"
														aria-rowindex={Number(row_id)}
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
																	if (attributes?.border === null) {
																		console.log(`Cell ${cell_id} has a null border attribute. This may cause rendering issues. Please check the cell attributes.`);
																	}
																	const isBorder = attributes?.border;
																	const borderContent = setBorderContent(
																		row_id,
																		column_id,
																		content
																	);
																	const showGridLinesCSS = gridShowInnerLines;
																	const gridLineWidthCSS = gridInnerLineWidth;

																	const isClipboard =
																		cellClipboard.inUse &&
																		cellClipboard.columnId === Number(column_id) &&
																		cellClipboard.rowId === Number(row_id);
																	if (isClipboard) {
																		// Animate cell when it is the clipboard source
																		calculatedClasses =
																			calculatedClasses + 'grid-control__cell--copied ';
																	}

																	const isFocused =
																		focusedCell.col === Number(column_id) &&
																		focusedCell.row === Number(row_id);
																	if (isFocused) {
																		// Show distinct border when cell has focus
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
																					isContentOnlyMode={isContentOnlyMode}
																					dataFormat={columnDataTypes[column_id]}
																					cell_id={cell_id}
																					table={table}
																					content={borderContent}
																					attributes={attributes}
																					columnClassNames={''}
																					cellClassNames={classes}
																					borderHandleProps={{
																						ariaLabel: `Row ${String(row_id)} options`,
																						controls: editorRowMenuTagId,
																						expanded:
																							rowMenu.isOpen &&
																							String(rowMenu.rowId) === String(row_id),
																					}}
																					onMouseDown={onMouseMenuClick}
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
																					table={table}
																					content={content}
																					attributes={attributes}
																					isFocused={isFocused}
																					columnClassNames={columnClasses[column_id]}
																					cellClassNames={
																						'grid-control__body-cells ' +
																						'grid-control__cellEditor ' +
																						classes +
																						calculatedClasses
																					}
																					showGridLinesCSS={showGridLinesCSS}
																					gridLineWidthCSS={gridLineWidthCSS}
																					isEditing={editingCellId === cell_id}
																					canOpenContextMenu={!isContentOnlyMode}
																					contextMenuProps={{
																						controls: editorCellMenuTagId,
																						expanded:
																							cellMenu.isOpen &&
																							String(cellMenu.cellId) === String(cell_id),
																					}}
																					onRequestFocus={(col, row) => {
																						setFocusedCell(prev =>
																							prev.col === col && prev.row === row
																								? prev
																								: { col, row }
																						);
																						focusCell(col, row);
																					}}
																					onRequestEdit={id => {
																						startEditingCell(id);
																						window.requestAnimationFrame(() => {
																							const wrapper = gridRef.current?.querySelector(
																								`[data-cell-id="${CSS.escape(id)}"]`
																							);
																							wrapper
																								?.querySelector?.(
																									'[contenteditable="true"], input, textarea, button'
																								)
																								?.focus?.();
																						});
																					}}
																					onRequestStopEdit={() => {
																						stopEditingCell();
																						window.requestAnimationFrame(() => {
																							const activeCellId =
																								gridRef.current?.ownerDocument?.activeElement
																									?.closest?.('[data-cell-id]')
																									?.getAttribute?.('data-cell-id');
																							if (
																								activeCellId &&
																								String(activeCellId) !== String(cell_id)
																							) {
																								return;
																							}
																							focusCell(Number(column_id), Number(row_id));
																						});
																					}}
																					onChange={onChangeCellData}
																					onMouseDown={onMouseMenuClick}
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
			{!isNewBlock && tableIsResolving && (
				<span
					className={'dtbk-spinner-message'}
				>
					{__('Loading Dynamic Table...', 'dynamic-table-blocks')}
					<Spinner />
				</span>
			)}

			{/* Show the form to identify and create a new table */}
			{isNewBlock && (
				<Placeholder
					label={__('Dynamic Table', 'dynamic-table-blocks')}
					icon={<BlockIcon icon={icon} showColors />}
					instructions={__('Create a new dynamic table.', 'dynamic-table-blocks')}
				>

					<form className="blocks-table__placeholder-form" onSubmit={onCreateTable}>
						{tableCreationMethod === 'choose' && (
							<SelectControl
								label={__('Table creation method:', 'dynamic-table-blocks')}
								onChange={onCreateTableMethod}
								options={[
									{ value: 'choose', label: 'Choose...' },
									{ value: 'new', label: 'New' },
									{ value: 'existing-table', label: 'Existing Table' },
								]}
								__nextHasNoMarginBottom
							/>
						)}

						{tableCreationMethod !== 'choose' && (
							<>
								<p>
									Table creation method: {tableCreationMethod}
								</p>
								<hr
									style={
										{
											alignSelf: 'stretch',
											width: '100%',
											margin: '8px 0 12px',
											border: 0,
											borderTop: '1px solid #dcdcde',
										}
									}
								/>
							</>
						)}

						{tableCreationMethod === 'existing-table' &&
							activeExistingTableOptions === null &&
							(allTablesIsResolving || isRefreshingAllTables) && (
							<span
								className={'dtbk-spinner-message'}
							>
								{__('Retrieving table list...', 'dynamic-table-blocks')}
								<Spinner />
							</span>
						)}

						{tableCreationMethod === 'existing-table' &&
							activeExistingTableOptions !== null && (
							<>
								<SelectControl
									label={__('Select table:', 'dynamic-table-blocks')}
									onChange={onAssignRequestedTableId}
									value={tableRequest.tableId || ''}
									options={activeExistingTableOptions}
									__nextHasNoMarginBottom
								/>
								{tableRequest.action !== 'idle' && requestedTableIsResolving && (
									<span className={'dtbk-spinner-message'}>
										{__('Retrieving selected table...', 'dynamic-table-blocks')}
										<Spinner />
									</span>
								)}
							</>
						)}

						{tableCreationMethod === 'new' && (
							<>
								<InputControl
									label={__('Table Name', 'dynamic-table-blocks')}
									placeholder="New Table"
									required="true"
									onChange={value =>
										setCreateDraftTable(prev => ({
											...prev,
											tableName: value,
										}))
									}
									value={createDraftTable.tableName}
									className="blocks-table__placeholder-input"
								/>

								<NumberControl
									__nextHasNoMarginBottom
									label={__('Table Columns', 'dynamic-table-blocks')}
									min={1}
									required="true"
									value={createDraftTable.numColumns}
									onChange={e => onChangeInitialColumnCount(e)}
									className="blocks-table__placeholder-input"
								/>

								<NumberControl
									__nextHasNoMarginBottom
									label={__('Table Rows', 'dynamic-table-blocks')}
									required="true"
									min={1}
									value={createDraftTable.numRows}
									onChange={e => onChangeInitialRowCount(e)}
									className="blocks-table__placeholder-input"
								/>
							</>
						)}

						<hr
							style={
								{
									alignSelf: 'stretch',
									width: '100%',
									margin: '8px 0 12px',
									border: 0,
									borderTop: '1px solid #dcdcde',
								}
							}
						/>

						<div className="dtbk-modal__footer">
							<div className="dtbk-modal__button-group">
								<Button
									variant="secondary"
									type="button"
									onClick={onCancelNewBlock}
								>
									{__('Cancel', 'dynamic-table-blocks')}
								</Button>

								<Button
									disabled={createTableDisabled}
									variant="primary"
									type="submit"
								>
									{__('Create Table', 'dynamic-table-blocks')}
								</Button>
							</div>
						</div>
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
 * @since 1.2.4  Added support for number column content type
 *
 * @param {Object} props Passed attributes
 * @return {Object} events for cell content editing
 */
function Cell(props) {
	const {
		cellType,
		isContentOnlyMode = false,
		dataFormat,
		table,
		cell_id,
		content,
		attributes,
		isFocused,
		columnClassNames,
		cellClassNames,
		showGridLinesCSS,
		gridLineWidthCSS,
		onChange,
		onMouseDown,
		borderHandleProps = {},
		cellTagId,
		isEditing,
		onRequestEdit,
		onRequestStopEdit,
		onRequestFocus,
		canOpenContextMenu = false,
		contextMenuProps = {},
	} = props;

	const { column_id, row_id } = getCellIdCoordinates(cell_id);
	const table_id = table?.table_id;
	const { type, settings } = normalizeColumnDataType(dataFormat);

	const [inputType, setInputType] = useState(() => settings?.format || '');
	const [cellContent, setCellContent] = useState();
	const initialCellValue = useRef(content);
	const [cellAttributes, setCellAttributes] = useState(attributes);

	const htmlToText = (html = '') => getTextContent(create({ html })).replace(/\s+/g, ' ').trim();

	const numberEntryWrapperRef = useRef(null);
	const numberEntryInputRef = useRef(null);
	const pendingCaretRef = useRef(null);
	const [percentEntryValue, setPercentEntryValue] = useState(null);

	const numberEntryValue =
		inputType === 'percent'
			? (percentEntryValue ?? toPercentEntryValue(cellContent))
			: (cellContent ?? '');

	const numberDisplayValue = formattedNumber(
		cellContent,
		inputType,
		settings?.formatOptions?.thousandSeparator,
		settings?.formatOptions?.decimalPlaces,
		settings?.formatOptions?.showCurrencySymbol,
		settings?.formatOptions?.bracketNegative
	);
	const sanitizedNumber = sanitizeNumberInput(cellContent, inputType);
	const redNegativeNumber =
		settings?.formatOptions?.redNegative &&
		sanitizedNumber !== '' &&
		sanitizedNumber !== '-' &&
		Number(sanitizedNumber) < 0;
	const checkboxVariant = settings?.format || inputType || 'standard';
	const shouldHideCheckbox =
		!isEditing &&
		settings?.formatOptions?.hideIfEmpty &&
		isEmptyCheckboxValue(cellContent);

	/**
	 * Identify whether checkbox cell value is empty
	 *
	 * @since 1.4.3
	 *
	 * @param {boolean} value Checkbox cell value
	 * @return {boolean}  Is cell content empty?
	 */
	function isEmptyCheckboxValue(value) {
		return value === '' || value === null || value === undefined;
	}

	/**
	 * Identify whether checkbox value should be true or false
	 *
	 * @since 1.4.3
	 *
	 * @param {boolean} value Checkbox cell value
	 * @return {boolean} Checkbox value to render
	 */
	function getCheckboxCheckedState(value) {
		const normalizedValue =
			typeof value === 'string' ? value.trim().toLowerCase() : value;

		if (normalizedValue === true || normalizedValue === 'true' || normalizedValue === 1 || normalizedValue === '1') {
			return true;
		}

		if (normalizedValue === false || normalizedValue === 'false' || normalizedValue === 0 || normalizedValue === '0') {
			return false;
		}

		return !!(settings?.formatOptions?.defaultToChecked && isEmptyCheckboxValue(value));
	}

	// Keep checkbox content string-based so it continues to match the REST schema.
	function serializeCheckboxValue(value) {
		return value ? 'true' : 'false';
	}

	/**
	 * Return markup for checkbox being edited
	 *
	 * @since 1.4.3
	 */
	function checkboxEditValue() {
		const isChecked = getCheckboxCheckedState(cellContent);
		const scale = checkboxVariant === 'freeform' ? 0.6 : 1;

		return (
			<TableCheckbox
				checked = {isChecked}
				variant = {checkboxVariant}
				scale = {scale}
				onChange={processBooleanCellEdit}
			/>
		)
	}



	/**
	 * Process effect of changes to cell level attributes
	 *
	 * @since 1.2.0
	 */
	useEffect(() => {
		setCellAttributes(attributes);
		initialCellValue.current = content ?? '';

		// Default behavior: raw content as-is
		setCellContent(content ?? '');
	}, [content, attributes]);

	/**
	 * Process effect of changes to column level attributes
	 *
	 * @since 1.2.0
	 */
	useEffect(() => {
		if (cellType !== 'body' || (type !== 'date-time' && type !== 'number')) return;

		const resolvedFormat = settings?.format || '';

		if (isEditing) {
			// Enter edit mode: force a valid HTML input value FIRST
			if (cellType === 'body' && type === 'date-time') {
				const raw = content ?? initialCellValue.current ?? '';

				if (raw) {
					setCellContent(formattedIsoDate(raw, resolvedFormat));
				} else if (settings?.defaultToToday) {
					setCellContent(formattedIsoDate('', resolvedFormat));
				} else {
					setCellContent('');
				}
			}

			// Enter edit mode: force a valid HTML input value FIRST
			if (cellType === 'body' && type === 'number') {
				const raw = content ?? initialCellValue.current ?? '';
				setCellContent(raw);
			}
		} else {
			const raw = content ?? '';
			if (cellType === 'body' && type === 'date-time') {
				setCellContent(raw ? formatedDisplayDate(raw, resolvedFormat) : '');
			}
			if (cellType === 'body' && type === 'number') {
				setCellContent(raw);
			}
		}

		setInputType(resolvedFormat);
		setCellAttributes(attributes);
		initialCellValue.current = content ?? '';
	}, [isEditing, content, attributes, cellType, type, settings?.format, settings?.defaultToToday]);

	/**
	 * Support caret positioning during entry
	 *
	 * @since 1.2.4
	 */
	useLayoutEffect(() => {
		const input = numberEntryWrapperRef.current?.querySelector('input') ?? null;
		numberEntryInputRef.current = input;

		if (!input || !pendingCaretRef.current) {
			return;
		}

		if (input !== input.ownerDocument.activeElement) {
			pendingCaretRef.current = null;
			return;
		}

		let nextCaret = getCaretIndexFromTokenCount(input.value, pendingCaretRef.current.tokenCount);

		nextCaret = normalizeCaretForPresentationPrefix(
			input.value,
			nextCaret,
			pendingCaretRef.current
		);

		input.setSelectionRange(nextCaret, nextCaret);
		pendingCaretRef.current = null;
	}, [numberEntryValue]);

	/**
	 * Handle onChange event for cell content update
	 *
	 * @since 1.1.1
	 * @since 1.2.0   Converted input to object to update multiple fields
	 *
	 * @param {Object} patch event data
	 */
	function updateCellData(patch) {
		initialCellValue.current = patch.content;

		if (patch.content !== undefined) setCellContent(patch.content);
		if (patch.attributes !== undefined) setCellAttributes(patch.attributes);

		onChange(table_id, cell_id, patch);
	}

	/**
	 * Support key press overrides for date/time input
	 *
	 * @since 1.2.2
	 *
	 * @param {Object} event Key press event
	 */
	function onDateTimeKeyDown(event) {
		const key = String(event.key || '').toLowerCase();
		if ((inputType === 'time' || inputType === 'datetime-local') && (key === 'a' || key === 'p')) {
			const currentValue = event.currentTarget?.value ?? cellContent ?? '';
			const nextValue = applyMeridiemShortcut(currentValue, inputType, key);

			if (nextValue !== currentValue) {
				event.preventDefault();
				event.stopPropagation();
				setCellContent(nextValue);
			}
		}
	}

	/**
	 * Support key press overrides for date/time input
	 *
	 * @since 1.2.2
	 *
	 * @param {string} currentCellContent Cell contents
	 * @param {string} format             Date/Time format
	 * @param {string} keyValue           Key press value
	 * @return {string} Updated input value
	 */
	function applyMeridiemShortcut(currentCellContent, format, keyValue) {
		if (!currentCellContent || (format !== 'time' && format !== 'datetime-local')) {
			return currentCellContent;
		}

		const isPm = keyValue === 'p';

		if (format === 'time') {
			const match = /^(\d{2}):(\d{2})(:\d{2})?$/.exec(currentCellContent);
			if (!match) return currentCellContent;

			let hours = Number(match[1]);
			if (!Number.isFinite(hours)) return currentCellContent;

			if (isPm && hours < 12) hours += 12;
			if (!isPm && hours >= 12) hours -= 12;

			return `${String(hours).padStart(2, '0')}:${match[2]}${match[3] || ''}`;
		}

		const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(:\d{2})?$/.exec(currentCellContent);
		if (!match) return currentCellContent;

		let hours = Number(match[2]);
		if (!Number.isFinite(hours)) return currentCellContent;

		if (isPm && hours < 12) hours += 12;
		if (!isPm && hours >= 12) hours -= 12;

		return `${match[1]}T${String(hours).padStart(2, '0')}:${match[3]}${match[4] || ''}`;
	}

	/**
	 * Change number string from entry
	 *
	 * @since 1.2.4
	 *
	 * @param {Object} event New number string
	 */
	function onNumberChange(event) {
		const input = numberEntryInputRef.current;
		const entryValue = sanitizeNumberInput(event, inputType === 'percent' ? 'number' : inputType);
		const selectionStart = input?.selectionStart ?? entryValue.length;
		const firstNumericIndex = getFirstNumericIndex(entryValue);

		pendingCaretRef.current = {
			tokenCount: countCaretTokens(entryValue, selectionStart),
			wasAtStart: selectionStart === 0,
			wasInPrefixZone:
				firstNumericIndex !== -1 && selectionStart > 0 && selectionStart <= firstNumericIndex,
		};

		let nextRawValue = entryValue;
		let revisedDecimalPlaces = settings?.formatOptions?.decimalPlaces ?? 0;

		if (inputType === 'percent') {
			const [integerPart, fractionPart = ''] = entryValue.split('.');
			const nextEntryValue =
				fractionPart.length > revisedDecimalPlaces
					? `${integerPart}.${fractionPart.slice(0, revisedDecimalPlaces)}`
					: entryValue;

			setPercentEntryValue(nextEntryValue);
			revisedDecimalPlaces += 2;
			nextRawValue = fromPercentEntryValue(nextEntryValue);
		} else {
			setPercentEntryValue(null);
		}

		if (inputType !== 'integer') {
			const [integerPart, fractionPart = ''] = nextRawValue.split('.');
			const fractionalExcessLength = fractionPart.length - revisedDecimalPlaces;

			if (fractionalExcessLength > 0) {
				nextRawValue = `${integerPart}.${fractionPart.slice(0, revisedDecimalPlaces)}`;
			}
		}

		setCellContent(nextRawValue);
	}

	/**
	 * Prepare updated cell content and pass to update handler
	 *
	 * @since 1.3.1
	 *
	 * @param {string} nextContent   Updated formatted text content for the cell
	 * @param {string} nextIndexText Updated plain text conent for the cell
	 */
	function persistCellEdit(nextContent, nextIndexText) {
		updateCellData({
			content: nextContent,
			attributes: {
				...cellAttributes,
				value: {
					...(cellAttributes?.value || {}),
					indexText: nextIndexText,
				},
			},
		});
	}

	function processBooleanCellEdit(updatedValue) {
		persistCellEdit(updatedValue, updatedValue ? 'true' : 'false');
	}

	/**
	 * Relay mouse down event for menu cells
	 *
	 * @since 1.2.0
	 *
	 * @param {number} column_id Clicked table column
	 * @param {number} row_id    Clicked table row
	 * @param {Object} table     Current Dynamic Table
	 * @param {Object} e         Border click event object
	 */
	function passMouseMenuClick(column_id, row_id, table, e) {
		onMouseDown(column_id, row_id, table, e);
	}

	/**
	 * React HTML to render a cell based on its type
	 *
	 * @since 1.1.1
	 * @since 1.2.0    Add DateTime render type
	 * @since 1.2.4    Add Number render type
	 *
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
								const indexText = htmlToIndexText(next);
								persistCellEdit(next, indexText);
							}
				}
			></RichText>
		),
		border: () => {
			const isCornerBorderCell = String(row_id) === '0' && String(column_id) === '0';
			const isBorderHandle =
				!isCornerBorderCell && (String(row_id) === '0' || String(column_id) === '0');
			const isRowHandle = String(column_id) === '0' && String(row_id) !== '0';
			const currentRow = isRowHandle
				? table?.rows?.find(r => String(r.row_id) === String(row_id))
				: null;
			const isHeaderRowHandle = currentRow?.attributes?.isHeader === true;
			const canOpenBorderMenu = !isContentOnlyMode || (isRowHandle && !isHeaderRowHandle);

			if (!isBorderHandle || !canOpenBorderMenu) {
				return <div aria-hidden="true">{cellContent}</div>;
			}

			return (
				<button
					type="button"
					className="grid-control__border-button"
					aria-label={borderHandleProps.ariaLabel}
					aria-haspopup="menu"
					aria-expanded={borderHandleProps.expanded}
					aria-controls={borderHandleProps.expanded ? borderHandleProps.controls : undefined}
					onMouseDown={e => {
						e.preventDefault();
					}}
					onClick={e => {
						passMouseMenuClick(column_id, row_id, table, e);
					}}
				>
					<span aria-hidden="true">{cellContent}</span>
				</button>
			);
		},

		dateTime: () => {
			if (!isEditing) {
				return <div>{cellContent}</div>;
			}

			return (
				<TextControl
					className={renderClassesEdit}
					type={inputType}
					__next40pxDefaultSize
					value={cellContent}
					onKeyDown={event => {
						onDateTimeKeyDown(event);
					}}
					onChange={next => {
						setCellContent(next);
					}}
					onBlur={event => {
						if (event?.target?.dataset?.cancelEdit === 'true') {
							delete event.target.dataset.cancelEdit;
							onRequestStopEdit?.();
							return;
						}

						const format = settings?.format || inputType || 'date';
						const next = event?.target?.value ?? cellContent ?? '';
						const formattedContent = formattedIsoDate(next, format);
						persistCellEdit(next, formattedContent);
						onRequestStopEdit?.();
					}}
				/>
			);
		},
		number: () => {
			if (!isEditing) {
				return <div>{numberDisplayValue}</div>;
			}

			return (
				<div ref={numberEntryWrapperRef}>
					<TextControl
						className={renderClassesEdit}
						type={'text'}
						inputMode={inputType === 'integer' ? 'numeric' : 'decimal'}
						__next40pxDefaultSize
						value={numberEntryValue}
						onChange={event => {
							onNumberChange(event);
						}}
						onBlur={event => {
							pendingCaretRef.current = null;
							setPercentEntryValue(null);

							if (event?.target?.dataset?.cancelEdit === 'true') {
								delete event.target.dataset.cancelEdit;
								onRequestStopEdit?.();
								return;
							}

							const next = cellContent ?? '';
							persistCellEdit(next, next);
							onRequestStopEdit?.();
						}}
					/>
				</div>
			);
		},
		checkbox: () => {
			if (shouldHideCheckbox) {
				return null;
			}

			if (!isEditing) {
				if (settings?.formatOptions?.hideIfEmpty && isEmptyCheckboxValue(cellContent)) {
					return null;
				}

				const isChecked = getCheckboxCheckedState(cellContent);

				const scale = checkboxVariant === 'freeform' ? 0.6 : 1;

				return (
					<TableCheckbox
						checked = {isChecked}
						variant = {checkboxVariant}
						scale = {scale}
					/>
				)
			}

			const editedCheckbox = checkboxEditValue();

			return (
				<div>{editedCheckbox}</div>
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
				case 'number':
					renderPipeline = ['number'];
					break;
				case 'checkbox':
					renderPipeline = ['checkbox'];
					break;
				default:
					break;
			}
			break;
		default:
			break;
	}

	const renderClassesDisplay = clsx(columnClassNames, cellClassNames, {
		'grid-control__cellEditor--dateTimeInput': cellType === 'body' || type === 'date-time',
		'grid-control__body-cells--checkbox': type === 'checkbox',
		'grid-control__body-columns--number-red': redNegativeNumber,
	});

	const renderClassesEdit = clsx(columnClassNames, {
		'grid-control__cellEditor--dateTimeInput': cellType === 'body' || type === 'date-time',
		'grid-control__body-cells--checkbox': type === 'checkbox',
		'grid-control__body-columns--number-red': redNegativeNumber,
	});

	const isBorderCell = cellType === 'border';
	const cellRole =
		cellType === 'header' ? 'columnheader' : cellType === 'body' ? 'gridcell' : 'presentation';
	const ariaColIndex = !isBorderCell ? Number(column_id) : undefined;
	const computedTabIndex = !isBorderCell && isFocused ? 0 : -1;

	return (
		<div
			id={cellTagId}
			role={cellRole}
			aria-colindex={ariaColIndex}
			aria-haspopup={!isBorderCell && canOpenContextMenu ? 'menu' : undefined}
			aria-expanded={!isBorderCell && canOpenContextMenu ? contextMenuProps.expanded : undefined}
			aria-controls={
				!isBorderCell && canOpenContextMenu && contextMenuProps.expanded
					? contextMenuProps.controls
					: undefined
			}
			data-cell-id={cell_id}
			data-col={Number(column_id)}
			data-row={Number(row_id)}
			tabIndex={computedTabIndex}
			className={renderClassesDisplay}
			style={
				cellType === 'border'
					? undefined
					: {
							'--showGridLines': showGridLinesCSS,
							'--gridLineWidth': gridLineWidthCSS,
						}
			}
			onMouseDown={e => {
				if (cellType === 'border') return;
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
			onContextMenu={e => {
				if (cellType === 'border' || !canOpenContextMenu) return;
				e.preventDefault();
				passMouseMenuClick(column_id, row_id, table, e);
				onRequestFocus?.(Number(column_id), Number(row_id));
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
