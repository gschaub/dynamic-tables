/* External dependencies */
import { useState, useEffect, useRef } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/* Internal dependencies */
import { store as tableStore } from './data';

/**
 * Returns `true` after an editor save cycle completes.
 *
 * @since    1.0.0
 *
 * @return {boolean} Has the current editor save cycle completed
 */
export const usePostChangesSaved = () => {
	const [areChangesSaved, setAreChangesSaved] = useState(false);
	const { isSavingPost, isAutosavingPost, didPostSaveRequestSucceed } = useSelect(select => {
		const editor = select('core/editor');
		return {
			isSavingPost: editor?.isSavingPost?.() ?? false,
			isAutosavingPost: editor?.isAutosavingPost?.() ?? false,
			didPostSaveRequestSucceed: editor?.didPostSaveRequestSucceed?.() ?? false,
		};
	});
	const wasSavingPost = usePrevious(isSavingPost);

	const saveCycleRef = useRef({
		wasAutosave: false,
	});

	useEffect(() => {
		if (isSavingPost) {
			saveCycleRef.current.wasAutosave = saveCycleRef.current.wasAutosave || isAutosavingPost;
			setAreChangesSaved(false);
			return;
		}

		if (wasSavingPost) {
			const didCompleteManualSave = !saveCycleRef.current.wasAutosave && didPostSaveRequestSucceed;
			setAreChangesSaved(didCompleteManualSave);
			saveCycleRef.current = {
				wasAutosave: false,
			};
		}
	}, [isSavingPost, isAutosavingPost, didPostSaveRequestSucceed, wasSavingPost]);

	return areChangesSaved;
};

/**
 * Returns the current post ID and post type from the block.
 *
 * @since    1.1.0
 *
 * @param {Array} props
 * @return {Object} Post ID and post type
 */
export function useEditorIdentity(props) {
	const context = props.context || {};
	const contextPostId = context.postId;
	const contextPostType = context.postType;

	const { storePostId, storePostType } = useSelect(select => {
		// Retrieve postId and postType from the editor.
		const editor = select('core/editor');
		const editorPostId = editor?.getCurrentPostId?.();
		const editorPostType = editor?.getCurrentPostType?.();
		if (editorPostId && editorPostType) {
			return { storePostId: editorPostId, storePostType: editorPostType };
		}

		// Legacy fallback for Site Editor to retrieve postId and postType when current Wordpress
		// version < 6.8. These values were previously stored in site editor.
		const editSite = select('core/edit-site');
		return {
			storePostId: editSite?.getEditedPostId?.(),
			storePostType: editSite?.getEditedPostType?.(),
		};
	}, []);

	// Choose context first, then store, then fallback.
	const postId = contextPostId ?? storePostId ?? 0;
	const postType = contextPostType ?? storePostType ?? '';

	return { postId, postType };
}

/**
 * Identifies when the inserter panel is open, but not necessarily if the
 * block is just in preview.
 *
 * @since    1.1.0
 *
 * @return {boolean} Is block editor inserter panel open
 */
export function useNotInInserterPreview() {
	return useSelect(select => {
		const be = select('core/block-editor');
		const settings = be?.getSettings?.() || {};

		// Your debug shows these are true in the pattern list preview renderer.
		const isPreview =
			!!settings.isPreviewMode ||
			!!settings.__unstableIsPreviewMode ||
			!!settings.__experimentalIsPreviewMode;

		return !isPreview;
	}, []);
}

/**
 * Retrieve a table by ID and fetch it from the API if it is not already in the store.
 *
 * @since    1.4.0
 *
 * @param {string}  tableId           The ID of the table to retrieve
 * @param {Object}  args
 * @param {boolean} args.isTableStale Whether to force refetching the table from the API
 * @param {boolean} args.shouldFetch  Whether there is an active request to get a table
 * @return {Object} The table data and resolution status
 */
export function useGetTable(tableId, { isTableStale = false, shouldFetch = true } = {}) {
	const shouldResolveTable = shouldFetch && Number(tableId) > 0;

	return useSelect(
		select => {
			if (!shouldResolveTable) {
				return {
					table: null,
					entityRecord: null,
					hasEntityRecord: false,
					hasStartedResolving: false,
					hasFinishedResolving: false,
					isResolving: false,
				};
			}

			const { getTable, hasStartedResolution, hasFinishedResolution, isResolving } =
				select(tableStore);
			const core = select(coreStore);

			const tableSelectorArgs = [tableId, isTableStale];
			const entitySelectorArgs = ['dynamic-table-blocks', 'table', Number(tableId)];
			const table = getTable(tableId, isTableStale);
			const entityRecord = core.getEntityRecord('dynamic-table-blocks', 'table', Number(tableId));
			const tableHasStartedResolving = hasStartedResolution('getTable', tableSelectorArgs);
			const tableHasFinishedResolving = hasFinishedResolution('getTable', tableSelectorArgs);
			const tableIsResolving = isResolving('getTable', tableSelectorArgs);
			const entityHasStartedResolving =
				core?.hasStartedResolution?.('getEntityRecord', entitySelectorArgs) ?? false;
			const entityHasFinishedResolving =
				core?.hasFinishedResolution?.('getEntityRecord', entitySelectorArgs) ?? false;
			const entityIsResolving = core?.isResolving?.('getEntityRecord', entitySelectorArgs) ?? false;

			return {
				table,
				entityRecord,
				hasEntityRecord: !!entityRecord?.id,
				hasStartedResolving: tableHasStartedResolving || entityHasStartedResolving,
				hasFinishedResolving: tableHasFinishedResolving && entityHasFinishedResolving,
				isResolving: tableIsResolving || entityIsResolving,
			};
		},
		[tableId, isTableStale, shouldResolveTable]
	);
}

/**
 * Observe history-driven table entity changes such as undo/redo.
 *
 * @since    1.4.4
 *
 * @param {number|string} tableId
 * @param {Function}      onHistoryChange
 */
export function useTableUndoRedoEffect(tableId, onHistoryChange) {
	const { editedTable, hasEdits, isSavingPost, isAutosavingPost } = useSelect(
		select => {
			const core = select(coreStore);
			const editor = select('core/editor');
			const numericTableId = Number(tableId);

			if (numericTableId <= 0) {
				return {
					editedTable: null,
					hasEdits: false,
					isSavingPost: false,
					isAutosavingPost: false,
				};
			}

			return {
				editedTable:
					core?.getEditedEntityRecord?.('dynamic-table-blocks', 'table', numericTableId) ?? null,
				hasEdits:
					core?.hasEditsForEntityRecord?.('dynamic-table-blocks', 'table', numericTableId) ?? false,
				isSavingPost: editor?.isSavingPost?.() ?? false,
				isAutosavingPost: editor?.isAutosavingPost?.() ?? false,
			};
		},
		[tableId]
	);

	const previousRef = useRef(null);

	useEffect(() => {
		const nextSnapshot = JSON.stringify({
			editedTable,
			hasEdits,
		});

		if (previousRef.current === null) {
			previousRef.current = nextSnapshot;
			return;
		}

		if (nextSnapshot !== previousRef.current && !isSavingPost && !isAutosavingPost) {
			onHistoryChange?.({
				tableId: Number(tableId),
				editedTable,
				hasEdits,
			});
		}

		previousRef.current = nextSnapshot;
	}, [tableId, editedTable, hasEdits, isSavingPost, isAutosavingPost, onHistoryChange]);
}
