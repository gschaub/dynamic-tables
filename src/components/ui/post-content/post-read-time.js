/* External dependencies */
import { _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import '../../../editor.scss';
import '../../../style.scss';

export function PostTimeToRead({ readingMinutes }) {
	if (readingMinutes === null || readingMinutes === undefined) {
		return null;
	}

	return (
		<div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
			<span>
				{sprintf(
					/* translators: %s: Estimated reading time in minutes. */
					_n('%s minute read', '%s minutes read', readingMinutes, 'dynamic-table-blocks'),
					readingMinutes
				)}
			</span>
		</div>
	);
}
