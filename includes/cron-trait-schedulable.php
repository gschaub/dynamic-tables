<?php
/**
 * Reusable trait for custom WP-Cron schedules and events.
 */

namespace DynamicTableBlocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

trait DTBK_Cron_Schedulable {

	/**
	 * Register the cron schedule with WordPress.
	 *
	 * Call this in your bootstrap/init code:
	 *   add_filter( 'cron_schedules', [ $this, 'register_cron_schedule' ] );
	 *
	 * @param array $schedules
	 * @return array
	 */
	public function register_cron_schedule( $schedules ) {
		error_log('In Cron Registration');
		if ( empty( $this->cron_schedule_key ) || empty( $this->cron_interval ) ) {
			return $schedules;
		}

		$schedules[ $this->cron_schedule_key ] = [
			'interval' => (int) $this->cron_interval,
			'display'  => $this->cron_schedule_label ?? __( 'Dynamic Tables Schedule', 'dynamic-table-blocks' ),
		];

		return $schedules;
	}

	/**
	 * Ensure the cron event is scheduled.
	 *
	 * Call from activation hook or init.
	 */
	public function ensure_cron_scheduled() {
		error_log('In Ensure Scheduled');
		if ( empty( $this->cron_event_hook ) || empty( $this->cron_schedule_key ) ) {
			return;
		}

		if ( ! wp_next_scheduled( $this->cron_event_hook ) ) {
			wp_schedule_event( time(), $this->cron_schedule_key, $this->cron_event_hook );
		}
	}

	/**
	 * Unschedule all future occurrences of the event.
	 *
	 * Call from deactivation hook, or when disabling via settings.
	 */
	public function unschedule_cron_event() {
		error_log('In Cron unschedule');

		if ( empty( $this->cron_event_hook ) ) {
			return;
		}

		$timestamp = wp_next_scheduled( $this->cron_event_hook );
		while ( $timestamp ) {
			wp_unschedule_event( $timestamp, $this->cron_event_hook );
			$timestamp = wp_next_scheduled( $this->cron_event_hook );
		}
	}

	/**
	 * Get the next scheduled timestamp (or false).
	 *
	 * @return int|false
	 */
	public function get_next_scheduled() {
		error_log('In Cron get mext schedule');
		if ( empty( $this->cron_event_hook ) ) {
			return false;
		}

		return wp_next_scheduled( $this->cron_event_hook );
	}
}
