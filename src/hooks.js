import { useState, useEffect } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Returns `true` if post changes are saved, otherwise `false`.
 *
 * @since    1.0.0
 *
 * @return {boolean} Are post changes saved
 */
export const usePostChangesSaved = () => {
	const [areChangesSaved, setAreChangesSaved] = useState(false);
	const { hasUnsavedChanges } = useSelect(select => {
		return {
			hasUnsavedChanges: select('core/editor').isEditedPostDirty(),
		};
	});
	const hadUnsavedChanges = usePrevious(hasUnsavedChanges);

	useEffect(() => {
		if (!hasUnsavedChanges && hadUnsavedChanges) {
			setAreChangesSaved(true);
		}
		if (hasUnsavedChanges) {
			setAreChangesSaved(false);
		}
	}, [hasUnsavedChanges, hadUnsavedChanges]);

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
