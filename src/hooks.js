import { useState, useEffect } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Returns `true` if post changes are saved, otherwise `false`.
 *
 * @return {boolean}
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
