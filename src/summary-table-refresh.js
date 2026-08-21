import { showMessageNotice } from './messages';

const SUMMARY_TABLE_REFRESH_INTERVAL = 60000;
const summaryTableRefreshCoordinator = {
	inFlightPromise: null,
	showErrorNotice: false,
	subscribers: new Map(),
	intervalId: null,
	focusHandler: null,
	visibilityHandler: null,
};

/**
 * Set the loading state for summary table refresh on each subscriber.
 *
 * @since 1.4.0
 *
 * @param {boolean} isRefreshing Whether the summary tables are currently being refreshed
 */
function setSummaryTableRefreshLoading(isRefreshing) {
	summaryTableRefreshCoordinator.subscribers.forEach(({ setIsRefreshingAllTables }) => {
		setIsRefreshingAllTables(isRefreshing);
	});
}

/**
 * Get the latest summary table refresh subscribers.
 *
 * @since 1.4.0
 *
 * @return {Object|null} The current list of subscribers or null if there are no subscribers
 */
function getSummaryTableRefreshSubscriber() {
	const subscribers = Array.from(summaryTableRefreshCoordinator.subscribers.values());
	return subscribers[subscribers.length - 1] || null;
}

/**
 * Ensure summary table refresh listeners are added and set up.
 *
 * @since 1.4.0
 */
function ensureSummaryTableRefreshListeners() {
	if (summaryTableRefreshCoordinator.intervalId !== null) {
		return;
	}

	const refreshVisibleSummaryTables = () => {
		if (document.visibilityState !== 'visible') {
			return;
		}

		const subscriber = getSummaryTableRefreshSubscriber();
		if (!subscriber) {
			return;
		}

		void runSummaryTableRefresh({
			refreshSummaryTables: subscriber.refreshSummaryTables,
			createNotice: subscriber.createNotice,
		}).catch(() => {});
	};

	summaryTableRefreshCoordinator.focusHandler = refreshVisibleSummaryTables;
	summaryTableRefreshCoordinator.visibilityHandler = refreshVisibleSummaryTables;
	summaryTableRefreshCoordinator.intervalId = window.setInterval(
		refreshVisibleSummaryTables,
		SUMMARY_TABLE_REFRESH_INTERVAL
	);
	window.addEventListener('focus', summaryTableRefreshCoordinator.focusHandler);
	document.addEventListener('visibilitychange', summaryTableRefreshCoordinator.visibilityHandler);
}

/**
 * Remove summary table refresh listeners as part of unmount cleanup.
 *
 * @since 1.4.0
 */
function maybeRemoveSummaryTableRefreshListeners() {
	if (summaryTableRefreshCoordinator.subscribers.size > 0) {
		return;
	}

	if (summaryTableRefreshCoordinator.intervalId !== null) {
		window.clearInterval(summaryTableRefreshCoordinator.intervalId);
		summaryTableRefreshCoordinator.intervalId = null;
	}

	if (summaryTableRefreshCoordinator.focusHandler) {
		window.removeEventListener('focus', summaryTableRefreshCoordinator.focusHandler);
		summaryTableRefreshCoordinator.focusHandler = null;
	}

	if (summaryTableRefreshCoordinator.visibilityHandler) {
		document.removeEventListener(
			'visibilitychange',
			summaryTableRefreshCoordinator.visibilityHandler
		);
		summaryTableRefreshCoordinator.visibilityHandler = null;
	}
}

/**
 * Refresh summary tables store
 *
 * @since 1.4.0
 *
 * @param {Object}                               options
 * @param {function(): Promise<*>}               options.refreshSummaryTables    Dispatches the refresh.
 * @param {function(string, string, Object=): *} options.createNotice            Creates an editor notice.
 * @param {boolean}                              [options.showErrorNotice=false] Shows an error notice on failure.
 * @return {Promise} Promise resolving to the refreshed summary tables
 */
export async function runSummaryTableRefresh(options) {
	const { refreshSummaryTables, createNotice, showErrorNotice = false } = options;

	summaryTableRefreshCoordinator.showErrorNotice =
		summaryTableRefreshCoordinator.showErrorNotice || showErrorNotice;

	if (summaryTableRefreshCoordinator.inFlightPromise) {
		return summaryTableRefreshCoordinator.inFlightPromise;
	}

	setSummaryTableRefreshLoading(true);

	const refreshPromise = (async () => {
		try {
			return await refreshSummaryTables();
		} catch (error) {
			console.error('Error refreshing Dynamic Tables summary list', error);

			if (summaryTableRefreshCoordinator.showErrorNotice) {
				showMessageNotice(createNotice, 'summary-refresh-error');
			}

			throw error;
		} finally {
			summaryTableRefreshCoordinator.inFlightPromise = null;
			summaryTableRefreshCoordinator.showErrorNotice = false;
			setSummaryTableRefreshLoading(false);
		}
	})();

	summaryTableRefreshCoordinator.inFlightPromise = refreshPromise;
	return refreshPromise;
}

/**
 * Register a summary-table refresh subscriber.
 *
 * @since 1.4.0
 *
 * @param {Object}                               options                          Subscriber configuration.
 * @param {string}                               options.tableCreationMethod      Selected table creation method.
 * @param {function(): Promise<Object>}          options.refreshSummaryTables     Dispatches a summary-table refresh.
 * @param {function(string, string, Object=): *} options.createNotice             Creates an editor notice.
 * @param {function(boolean): void}              options.setIsRefreshingAllTables Sets the refresh loading state.
 * @param {symbol}                               options.subscriberId             Unique identifier for this subscriber.
 * @return {function(): void|undefined} Cleanup function, or undefined when no subscriber is registered.
 */
export function registerSummaryTableRefreshSubscriber(options) {
	const {
		tableCreationMethod,
		refreshSummaryTables,
		createNotice,
		setIsRefreshingAllTables,
		subscriberId,
	} = options;

	if (tableCreationMethod !== 'existing-table') {
		setIsRefreshingAllTables(false);
		return undefined;
	}

	summaryTableRefreshCoordinator.subscribers.set(subscriberId, {
		refreshSummaryTables,
		createNotice,
		setIsRefreshingAllTables,
	});
	ensureSummaryTableRefreshListeners();

	void runSummaryTableRefresh({
		refreshSummaryTables,
		createNotice,
		showErrorNotice: true,
	}).catch(() => {});

	return () => {
		summaryTableRefreshCoordinator.subscribers.delete(subscriberId);
		setIsRefreshingAllTables(false);
		maybeRemoveSummaryTableRefreshListeners();
	};
}

/**
 * Fetches summary tables and formats them for use as options in the table selection
 * dropdown when attaching a block to an existing table.
 *
 * @since 1.4.0
 *
 * @param {Object} allTables All summarized dynamic tables currently in state
 * @return {Array} Array of all tables available for block creation throught attachment
 */
export function getLoadedSummaryTableOptions(allTables) {
	return [
		{ value: '', label: 'Choose table...' },
		...Object.values(allTables || {})
			.filter(({ table_status }) => table_status === 'loaded')
			.map(({ table_id, table_name }) => ({
				value: String(table_id),
				label: `${table_name} (${table_id})`,
			})),
	];
}
