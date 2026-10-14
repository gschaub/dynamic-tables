/* External dependencies */
import { ComboboxControl, Notice } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { usePostSelection } from './use-post-selection';

/**
 * Render a control for selecting WordPress content.
 *
 * @since 1.5.0
 *
 * @param {Object}        props
 * @param {Object|null}   props.initialPost    Initially selected post.
 * @param {boolean}       props.disabled       Whether selection is disabled.
 * @param {Function}      props.onChange       Called with the selected post or null.
 * @param {Function|null} props.onStatusChange Called when loading or validity changes.
 * @return {Object} Post selection control.
 */
export function SelectPost({
	initialPost = null,
	disabled = false,
	onChange,
	onStatusChange = null,
}) {
	const { selectedValue, options, isLoading, isResolving, isValid, error, onSearch, onSelection } =
		usePostSelection({ initialPost, disabled, onChange });
	const onStatusChangeRef = useRef(onStatusChange);
	onStatusChangeRef.current = onStatusChange;

	useEffect(() => {
		onStatusChangeRef.current?.({ isLoading: isResolving, isValid });
	}, [isResolving, isValid]);

	return (
		<>
			{error && (
				<Notice status="error" isDismissible={false}>
					{error}
				</Notice>
			)}

			<ComboboxControl
				label={__('Content Title', 'dynamic-table-blocks')}
				placeholder={__('Search WordPress content', 'dynamic-table-blocks')}
				help={__('Type at least 3 characters to search.', 'dynamic-table-blocks')}
				isLoading={isLoading}
				options={options}
				value={selectedValue}
				disabled={disabled}
				expandOnFocus={false}
				onFilterValueChange={onSearch}
				onChange={onSelection}
			/>
		</>
	);
}
