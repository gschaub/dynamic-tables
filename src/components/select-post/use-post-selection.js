/* External dependencies */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { lookupPost } from '../../get-external-data';
import {
	getNoPostResultsOption,
	getPostSearchOptions,
	getSelectedPost,
	getSelectedPostOption,
} from './value';

/**
 * Keep only the latest request of a given type.
 *
 * @return {Object} Request controls.
 */
function useLatestRequest() {
	const ref = useRef(null);

	useEffect(
		() => () => {
			ref.current?.abort();
			ref.current = null;
		},
		[]
	);

	const cancel = () => {
		ref.current?.abort();
		ref.current = null;
	};

	const begin = () => {
		cancel();
		const requestHandler = new AbortController();
		ref.current = requestHandler;
		return requestHandler;
	};

	const isCurrent = requestHandler =>
		ref.current === requestHandler && !requestHandler.signal.aborted;

	const finish = requestHandler => {
		if (!isCurrent(requestHandler)) return false;
		ref.current = null;
		return true;
	};

	return { begin, cancel, isCurrent, finish };
}

/**
 * Manage the state and requests required to select a WordPress post.
 *
 * @param {Object}      settings
 * @param {Object|null} settings.initialPost Initially selected post.
 * @param {boolean}     settings.disabled    Whether selection is disabled.
 * @param {Function}    settings.onChange    Called with the selected post or null.
 * @return {Object} Post selection state and handlers.
 */
export function usePostSelection({ initialPost = null, disabled = false, onChange }) {
	const initialOption = getSelectedPostOption(initialPost);
	const [selectedOption, setSelectedOption] = useState(initialOption);
	const [selectOptions, setSelectOptions] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const [searchError, setSearchError] = useState('');
	const [isLoadingPost, setIsLoadingPost] = useState(false);
	const [selectionError, setSelectionError] = useState('');
	const [isValid, setIsValid] = useState(Boolean(initialOption));

	const searchRequest = useLatestRequest();
	const selectionRequest = useLatestRequest();
	const selectedValue = selectedOption?.value ?? null;
	const options =
		selectedOption && !selectOptions.some(option => option.value === selectedValue)
			? [selectedOption, ...selectOptions]
			: selectOptions;

	/**
	 * Query WordPress content.
	 *
	 * @param {string} value Text on which to search.
	 */
	async function onSearch(value) {
		if (disabled) return;

		searchRequest.cancel();
		setIsSearching(false);
		setSearchError('');

		const searchTerm = String(value ?? '').trim();
		const noResults = [getNoPostResultsOption()];

		if (!searchTerm && selectedOption) {
			setSelectOptions([]);
			return;
		}

		if (searchTerm.length < 3) {
			setSelectOptions(noResults);
			return;
		}

		const request = searchRequest.begin();
		setIsSearching(true);

		try {
			const posts = await apiFetch({
				path: '/wp/v2/search?type=post&search=' + encodeURIComponent(searchTerm),
				signal: request.signal,
			});

			if (!searchRequest.isCurrent(request)) return;
			if (!Array.isArray(posts)) {
				throw new Error(__('The search response was invalid.', 'dynamic-table-blocks'));
			}

			const nextOptions = getPostSearchOptions(posts);
			setSelectOptions(nextOptions.length ? nextOptions : noResults);
		} catch (error) {
			if (searchRequest.isCurrent(request)) {
				setSelectOptions([]);
				setSearchError(
					error?.message || __('The search failed. Try again.', 'dynamic-table-blocks')
				);
			}
		} finally {
			if (searchRequest.finish(request)) setIsSearching(false);
		}
	}

	/**
	 * Retrieve and commit the selected WordPress post.
	 *
	 * @param {string|null} value Selected option value.
	 */
	async function onSelection(value) {
		if (disabled) return;

		searchRequest.cancel();
		selectionRequest.cancel();
		setIsSearching(false);
		setIsLoadingPost(false);
		setSearchError('');
		setSelectionError('');

		if (value === null || value === undefined || value === '') {
			setSelectedOption(null);
			setSelectOptions([]);
			setIsValid(false);
			onChange?.(null);
			return;
		}

		const option = options.find(item => item.value === String(value) && !item.disabled);
		if (!option) {
			setSelectionError(__('Choose a post from the search results.', 'dynamic-table-blocks'));
			return;
		}

		const previousOption = selectedOption;
		setSelectedOption(option);
		setIsValid(false);

		const request = selectionRequest.begin();
		setIsLoadingPost(true);

		try {
			const fetchedPost = await lookupPost(option.value, {
				postType: option.postType,
				signal: request.signal,
			});

			if (!selectionRequest.isCurrent(request)) return;

			const post = getSelectedPost(fetchedPost);
			const nextOption = getSelectedPostOption(post);

			if (!nextOption) {
				throw new Error(__('The post response was invalid.', 'dynamic-table-blocks'));
			}

			setSelectedOption(nextOption);
			setSelectOptions(previous =>
				previous.map(item => (item.value === nextOption.value ? nextOption : item))
			);
			onChange?.(post);
			setIsValid(true);
		} catch (error) {
			if (selectionRequest.isCurrent(request)) {
				setSelectedOption(previousOption);
				setIsValid(Boolean(previousOption));
				setSelectionError(
					error?.message ||
						__('The post could not be loaded. Select it again to retry.', 'dynamic-table-blocks')
				);
			}
		} finally {
			if (selectionRequest.finish(request)) setIsLoadingPost(false);
		}
	}

	return {
		selectedValue,
		options,
		isLoading: isSearching || isLoadingPost,
		isResolving: isLoadingPost,
		isValid,
		error: selectionError || searchError,
		onSearch,
		onSelection,
	};
}
