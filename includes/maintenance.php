<?php
/**
* Maintenance tasks for Dynamic Table Blocks for external WordPress activity
* and cron jobs.
*
* @since 1.1.0
*/

namespace DynamicTableBlocks;

// use Error;
// use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class DTBK_Maintenance {

	use DTBK_Cron_Schedulable;

	/**
	 * Singleton instance.
	 *
	 * @var Dynamic_Tables_Cron_Manager
	 */

	protected static $instance;

	/**
	 * Cron schedule key used in cron_schedules.
	 *
	 * @var string
	 */
	protected string $cron_schedule_key;

	/**
	 * Interval in seconds.
	 *
	 * @var int
	 */
	protected int $cron_interval;

	/**
	 * Human-readable label for the schedule.
	 *
	 * @var string
	 */
	protected string $cron_schedule_label;

	/**
	 * Hook name for the cron event.
	 *
	 * @var string
	 */
	protected string $cron_event_hook;

	/**
	 * Option name for enabling/disabling cron tasks.
	 *
	 * @var string
	 */
	protected $option_enabled = 'dtbk_cron_enabled';

	/**
	 * Transient key for cron lock.
	 *
	 * @var string
	 */
	protected $lock_key = 'dynamic_tables_cron_lock';

	/**
	 * Lock lifetime (seconds).
	 * Should be >= your cron interval.
	 *
	 * @var int
	 */
	protected $lock_ttl = 600; // 10 minutes.

	/**
	 * Constructor.
	 *
	 * @since 1.1.0
	 */
	public function __construct() {
		// Cron schedule property initialization.
		$this->cron_schedule_key   = 'dtbk_every_four_hours';
		$this->cron_interval       = 240 * MINUTE_IN_SECONDS;  // 4 hour interval in seconds
		$this->cron_schedule_label = __( 'Dynamic Tables: Every 4 hours', 'dynamic-table-blocks' );
		$this->cron_event_hook     = 'dtbk_dynamic_tables';
	}

	public static function get_instance() {
		if ( null === static::$instance ) {
			static::$instance = new static();
			static::$instance->init();
		}

		return static::$instance;
	}

	/**
	 * Bootstrap hooks.
	 */
	public function init() {
		// Initialize cron
		add_filter( 'cron_schedules', array( $this, 'register_cron_schedule' ) ); // phpcs:ignore WordPress.WP.CronInterval.ChangeDetected
		$this->ensure_scheduled();

		// Pickup cron event
		add_action( $this->cron_event_hook, array( $this, 'handle_cron_event' ) );

		// Handle post template instanciation and clones
		add_action( 'wp_after_insert_post', array( $this, 'on_after_insert_post' ), 10, 3 );

		// Handle post deletions
		add_action( 'before_delete_post', array( $this, 'delete_post_tables' ), 10, 3 );
	}

	/**
	 * Is cron enabled
	 *
	 * @since 1.1.0
	 *
	 * @return bool
	 */
	public function is_enabled() {
		return (bool) get_option( $this->option_enabled, 1 );
	}

	/**
	 * Ensure cron event is set
	 *
	 * @since 1.1.0
	 *
	 * @return void
	 */
	public function ensure_scheduled() {
		if ( $this->is_enabled() ) {
			$this->ensure_cron_scheduled();
		} else {
			$this->unschedule_cron_event();
		}
	}

	/**
	 * Cron event handler
	 *
	 * @since 1.1.0
	 *
	 * @return void
	 */
	public function handle_cron_event() {
		if ( ! $this->is_enabled() ) {
			return;
		}

		// Simple lock so two runs don’t overlap.
		if ( get_transient( $this->lock_key ) ) {
			$this->log( 'Cron skipped (lock present).' );
			return;
		}

		set_transient( $this->lock_key, 1, $this->lock_ttl );
		$this->log( 'Cron started.' );

		try {
			$this->run_scheduled_tasks();
		} catch ( \Throwable $e ) {
			$this->log( 'Cron error: ' . $e->getMessage() );
		}

		delete_transient( $this->lock_key );
		$this->log( 'Cron finished.' );
	}

	/**
	 * Cron tasks to run_scheduled_tasks
	 *
	 * Description - A supplement to the summary, above.  Full sentences.
	 *
	 * @since 1.1.0
	 *
	 * @return void
	 */
	protected function run_scheduled_tasks() {
		error_log('Running maint schedule');
		$this->delete_expired_transients();
		error_log('BEGIN TABLE VALIDATION');
		error_log(' ');
		$this->validate_tables();
		error_log(' ');
		error_log('END TABLE VALIDATION');
		error_log(' ');
	}

	/**
	 * Logger wrapper
	 *
	 * @since 1.1.0
	 *
	 * @param  [type] $message
	 * @return void
	 */
	protected function log( $message ) {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( '[DTBK Cron] ' . $message );
	}
	}

	/**
	 * Validate the integrity of dynamic table blocks to the underlying data store
	 *
	 * Description - This is part of the cron maintenance to ensure integrity of the blocks and the
	 *           underlying database tables.  Integrity errors are repaired where possible.  This that
	 *           cannot be confidently repared have their status updated to corruped.  Those table that
	 *           no longer have any associated blocks are optionally deleted or marked as orphan.
	 *
	 * @since 1.1.0
	 *
	 * @return void
	 */
	public function validate_tables() {
		// Retrieve dynamic table blocks in all parent posts and index fields
		$search_post_types = array(
			'exclude' => array( 'revision', 'attachment', 'nav_menu_item', 'custom_css', 'changeset' ),
		);

		$post_blocks = $this->get_dynamic_table_blocks( $search_post_types );
		$post_indexed_fields = [ 'post_id', 'parent_post_id', 'table_id', 'block_table_ref', 'resolved' ];
		$post_blocks_index = $this->build_index_for_array($post_blocks, $post_indexed_fields);

		$search_post_history_types = array(
			'include' => array( 'revision' ),
		);

		// Retrieve dynamic table blocks in all historic posts and index fields
		$post_history_blocks = $this->get_dynamic_table_blocks( $search_post_history_types );
		$post_history_indexed_fields = [ 'post_id', 'table_id', 'block_table_ref', 'resolved' ];
		$post_history_blocks_index = $this->build_index_for_array($post_history_blocks, $post_history_indexed_fields);

		// loop through each table for validation
		$tables = get_tables();
		foreach ( $tables as $table ) {
			// Set search matching criteria
			$table_id = (int) $table['id'];
			$post_search_criteria = array(
				'table_id' => $table_id,
			);

			// Retrieve all posts whose dynamic table block table_id matches current table
			$matching_posts = $this->perform_indexed_and_search($post_blocks, $post_blocks_index, $post_search_criteria);
			if ( $matching_posts ) {
				$this->process_table_post_matches($matching_posts, $table);
			} else {
				// If no match is found, search historical post states.
				// Table data will be maintained if there is a historical match.
				$matching_post_history = $this->perform_indexed_and_search($post_blocks, $post_history_blocks_index, $post_search_criteria);
				if ( $matching_post_history ) {
					$this->process_table_post_matches($matching_post_history, $table);
				} elseif ( $table['status'] !== 'orphan' ) {
					// Tables without a matching post are marked as orphaned or optionally deleted
					$full_table = $this->get_table( (int) $table_id);
					if ( $this->is_api_return_error($full_table) ) {
						// Table is corrupt - delete table
						$this->delete_table( (int) $table_id);
					} else {
						$full_table['header']['status'] = 'orphan';
						$response = $this->update_table($full_table);
					}
				}
			}
			error_log('HANDLE POSTS BLOCKS WITHOUT TABLE');
			error_log(' ');
		}
	}

	/**
	 * Validate post attribute integrity with table data when a match(s) are found
	 *
	 * Description - Table data will be updated to re-link with related post blocks
	 *           where possible.  Table status wil be updated as needed.
	 *
	 * @since 1.1.0
	 *
	 * @param  array $matching_posts  Array of posts blocks that match the current table_id
	 * @param  array $table           Current table for validation
	 * @return void
	 */
	private function process_table_post_matches($matching_posts, $table) {
		$posts_matched = 0;

		foreach ( $matching_posts as $post_block ) {
			if ( (int) $table['post_id'] === 0 ) {
				if ( $post_block['block_table_ref'] === $table['block_table_ref'] ) {
					// Update Post Id
					$full_table = $this->get_table( (int) $table['id']);
					$full_table['header']['post_id'] = $post_block['post_id'];
					$this->update_table($full_table);

					if ( $table['status'] !== 'saved' ) {
						// Update table status = 'saved'
						$full_table = $this->get_table( (int) $table['id']);
						$full_table['header']['status'] = 'saved';
						$this->update_table($full_table);
					}
				} elseif ( $table['status'] !== 'corrupted' ) {
						// Update table status = 'saved'
						$full_table = $this->get_table( (int) $table['id']);
						$full_table['header']['status'] = 'corrupted';
						$this->update_table($full_table);
				}
			} elseif ( (int) $table['post_id'] === $post_block['parent_post_id'] ) {
					if ( $post_block['block_table_ref'] === $table['block_table_ref'] ) {
						if ( $table['status'] !== 'saved' ) {
							// Update table status = 'saved'
							$full_table = $this->get_table( (int) $table['id']);
							$full_table['header']['status'] = 'saved';
							$this->update_table($full_table);
						}
					} elseif ( $table['status'] !== 'corrupted' ) {
							// Update table status = 'corrupted'
							$full_table = $this->get_table( (int) $table['id']);
							$full_table['header']['status'] = 'currupted';
							$this->update_table($full_table);
					}
			} elseif ( $table['status'] !== 'corrupted' ) {
					// Update table status = 'corrupted'
					$full_table = $this->get_table( (int) $table['id']);
					$full_table['header']['status'] = 'currupted';
					$this->update_table($full_table);
			}
			error_log('MARK POST BLOCK AS RESOLVED');
			++$posts_matched;
		}

		if ( $posts_matched > 1 ) {
			if ( $table['status'] !== 'corrupted' ) {
					// Update table status = 'corrupted'
					$full_table = $this->get_table( (int) $table['id']);
					$full_table['header']['status'] = 'currupted';
					$this->update_table($full_table);
			}
		}
	}

	/**
	 * Create new table when a post is duplicated
	 *
	 * Description - Retrives the table associated with the original post and duplicates
	 *               the table.  Updates the cloned post to reference the new table.
	 *
	 * @since 1.1.0
	 *
	 * @param  int    $post_id   Post ID of the new post
	 * @param  object $post      Post object of the new post
	 * @param  bool   $update    Whether this is an existing post being updated or not
	 * @return void
	 */
	public function on_after_insert_post( $post_id, $post, $update ) {
		if ( wp_is_post_revision( $post_id ) || get_post_status($post) === 'trash' || $update ) {
			return;
		}

		// Temporarily unhook so we don’t loop
		remove_action( 'wp_after_insert_post', array( $this, 'on_after_insert_post' ), 10 );

		$content = $post->post_content;
		$blocks = parse_blocks( $content );
		$changed = false;

		$changed_blocks = $this->deduplicate_blocks( $blocks, $post_id, $changed );

		if ( $changed ) {
			$new_content = serialize_blocks( $changed_blocks );
			wp_update_post([
				'ID'           => $post_id,
				'post_content' => $new_content,
			]);
		}

		// Re-hook
		add_action( 'wp_after_insert_post', array( $this, 'on_after_insert_post' ), 10, 3 );
	}

	/**
	 * Creates a new table object and updates the block reference for each Dynamic Tables block
	 *
	 * @since 1.1.0
	 *
	 * @param  array           $blocks   Array of blocks from the post content
	 * @param  int             $post_id  Post ID of the new post
	 * @param  bool            $changed  Have any of the blocks been changed
	 * @return array|WP_Error            Updated array of blocks or WP_Error on failure
	 */
	protected function deduplicate_blocks( $blocks, $post_id, &$changed ) {
		foreach ( $blocks as &$block ) {
			if ( isset( $block['blockName'] ) && $block['blockName'] === 'dynamic-table-blocks/dynamic-table-blocks' ) {
				$attrs = $block['attrs'] ?? [];
				$old_ref = $attrs['block_table_ref'] ?? '';

				if ( $old_ref ) {
					$original_table = get_table_by_ref($old_ref);
					if ( $original_table['header']['post_id'] !== $post_id ) {
						$new_table = $this->prepare_table_for_cloning($original_table, $post_id);
						$new_table_id = $this->create_table($new_table);

						$block['attrs']['block_table_ref'] = $new_table['header']['block_table_ref'];
						$block['attrs']['table_id'] = $new_table_id;
						$changed = true;
					}
				} else {
					// All dynamic table blocks must have a valid reference
					return new \WP_Error(
						'table not found',
						__( 'Sorry, you are not allowed to edit this post.', 'dynamic-table-blocks' )
					);
				}
			}
		}
		unset($block);
		return $blocks;
	}

	/**
	 * Set all references to table id to '0' and updates post_id with the new value
	 *
	 * Description - The plugin assigns new IDs when a table is created.  The API expects a value
	 *               of '0' for id's in the request.  The returned table contains the new table id.
	 *
	 * @since 1.1.0
	 *
	 * @param  array  $table    Original table array
	 * @param  int    $post_id  Post ID of the new post
	 * @return array            Updated table array ready for cloning
	 */
	private function prepare_table_for_cloning($table, $post_id) {
		$table['id'] = 0;
		$table['header']['id'] = 0;
		$table['header']['post_id'] = $post_id;
		$table['header']['block_table_ref'] = $this->generate_new_block_table_ref();
		$table = $this->reset_table_ids($table);

		return $table;
	}

	/**
	 * Recurse through table to set all instances of table_id to zero
	 *
	 * @since 1.1.0
	 *
	 * @param  array $table  Table with original table_id values
	 * @return array         Table with all table_id values reset to zero
	 */
	private function reset_table_ids($table) {
		foreach ( $table as $key => $value ) {
			if ( is_array($value) ) {
				$table[ $key ] = $this->reset_table_ids($value);
			} elseif ( $key === 'table_id' ) {
				$table[ $key ] = 0;
			}
		}
		return $table;
	}

	/**
	 * Delete tables when post it deleted
	 *
	 * Description - Loop through all blocks in a deleted post to determine if any are
	 *               Dynamic Table blocks, and if so, delete the underlying table(s)
	 *
	 * @since 1.1.0
	 *
	 * @param  int     $post_id - Id of the post being deleted
	 * @return void
	 */
	public function delete_post_tables($post_id) {
		// Skip auto drafts, revisions, etc.
		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}
		$post = get_post( $post_id );
		$content = $post->post_content;
		$blocks = parse_blocks( $content );

		foreach ( $blocks as $block ) {
			if ( $block['blockName'] === 'dynamic-table-blocks/dynamic-table-blocks' ) {
				$table_id = $block['attrs']['table_id'] ?? null;
				if ( $table_id ) {
					// Delete table from your custom DB table
					$this->delete_table( $table_id );
				}
			}
		}
	}

	/**
	 * Get table
	 *
	 * @since 1.1.0
	 *
	 * @param  int $table_id  ID of table to be fetchedTable array to be created
	 * @return array|object    New table ID or REST Response Object
	 */
	private function get_table($table_id) {
		// Build authentication signature
		$path   = '/dynamic-table-blocks/v1/tables/' .  $table_id;
		$method = 'GET';
		$body   = '';
		$signature = $this->build_internal_signature( $method, $path, $body );

		// Create rest request to create table
		$request = new \WP_REST_Request( $method, $path );
		$request->set_header( 'X-DTBK-Signature', $signature );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_query_params( array( 'context' => 'edit' ));

		// Execute the request
		$response = rest_do_request( $request );
		if ($response->is_error()) return $response;

		// Retrieve the response data
		$server = rest_get_server();
		$data   = $server->response_to_data( $response, false ); // Pass false to prevent authentication checks for internal requests
		return $data;
	}

	/**
	 * Create new table
	 *
	 * @since 1.1.0
	 *
	 * @param  array $table  Table array to be created
	 * @return int           New table ID
	 */
	private function create_table($table) {
		// Build authentication signature
		$path   = '/dynamic-table-blocks/v1/tables';
		$method = 'POST';
		$body   = wp_json_encode( $table );
		$signature = $this->build_internal_signature( $method, $path, $body );

		// Create rest request to create table
		$request = new \WP_REST_Request( $method, $path );
		$request->set_header( 'X-DTBK-Signature', $signature );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_query_params( array( 'context' => 'edit' ));
		$request->set_body_params( $body );

		// Execute the request
		$response = rest_do_request( $request );

		// Retrieve the response data
		$server = rest_get_server();
		$data   = $server->response_to_data( $response, false ); // Pass false to prevent authentication checks for internal requests
		return $data['id'];
	}

	/**
	 * Update table
	 *
	 * @since 1.1.0
	 *
	 * @param  array $table  Table array to be updated
	 * @return int           Updated table ID
	 */
	private function update_table($table) {
		$path   = '/dynamic-table-blocks/v1/tables/' .  (int) $table['id'];
		$method = 'PUT';
		$body   = wp_json_encode( $table );

		$signature = $this->build_internal_signature( $method, $path, $body );

		// Create rest request to create table
		$request = new \WP_REST_Request( $method, $path, $body);
		$request->set_header( 'X-DTBK-Signature', $signature );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_query_params( array( 'context' => 'edit' ));
		$request->set_body( $body );

		// Execute the request
		rest_do_request( $request );
	}

	/**
	 * Delete a table
	 *
	 * @since 1.1.0
	 *
	 * @param  int   $table_id  Table ID for table to delete
	 * @return void
	 */
	private function delete_table($table_id) {
		$path   = '/dynamic-table-blocks/v1/tables/' .  $table_id;
		$method = 'DELETE';
		$body   = ''; //wp_json_encode( json object );

		$signature = $this->build_internal_signature( $method, $path, $body );

		// Create rest request to create table
		$request = new \WP_REST_Request( $method, $path);
		$request->set_header( 'X-DTBK-Signature', $signature );
		$request->set_header( 'Content-Type', 'application/json' );
		// $request->set_body( $body );

		// Execute the request
		rest_do_request( $request );
	}

	/**
	 * Generate new block_table_ref
	 *
	 * Based off of current timestamp in base 16
	 *
	 * @since 1.1.0
	 *
	 * @return string block_table_ref
	 */
	private function generate_new_block_table_ref() {
		$timestamp = round(microtime(true) * 1000);
		return dechex( $timestamp );
	}

	/**
	 * Delete expired transient values that are associated with this plugin
	 *
	 * @since 1.1.0
	 *
	 * @return void
	 */
	private function delete_expired_transients() {
		global $wpdb;
		$expiration_cutoff = time() - DAY_IN_SECONDS;

		$wpdb->query(
			$wpdb->prepare(
				"DELETE o1, o2
                 FROM {$wpdb->options} o1
                 LEFT JOIN {$wpdb->options} o2
                   ON o2.option_name = REPLACE(o1.option_name, '_transient_timeout_dtbk_', '_transient_dtbk_')
                 WHERE o1.option_name LIKE %s
                   AND o1.option_value < %d",
				$wpdb->esc_like('_transient_timeout_dtbk_') . ' % ',
				$expiration_cutoff
			)
		);
	}

	/**
	 * Retrieve an array that lists all dynamic tables blocks in posts
	 *
	 * @since 1.1.0
	 *
	 * @param  array $search_post_types     Array of post types to include/exclude
	 * @param  array $search_post_statuses  Array of post statuses to include/exclude
	 * @return array                        Array of post IDs and their associated dynamic table block attributes
	 */
	private function get_dynamic_table_blocks($search_post_types = array(), $search_post_statuses = array()) {
		// Get allowed post types
		$allowed_types = get_post_types( [], 'names' );
		if ( ! empty($search_post_types) ) {
			if ( isset($search_post_types['include']) || ! empty($search_post_types['include']) ) {
				$allowed_types = $search_post_types['include'];
			}
			if ( isset($search_post_types['exclude']) || ! empty($search_post_types['exclude']) ) {
				$allowed_types = array_diff( $allowed_types, $search_post_types['exclude'] );
			}
		}

		// Get allowed post statuses
		$allowed_statuses = get_post_stati( [], 'names' );
		if ( ! empty($search_post_statuses) ) {
			if ( isset($search_post_statuses['include']) || ! empty($search_post_statuses['include']) ) {
				$allowed_statuses = $search_post_statuses['include'];
			}
			if ( isset($search_post_statuses['exclude']) || ! empty($search_post_statuses['exclude']) ) {
				$allowed_statuses = array_diff( $allowed_statuses, $search_post_statuses['exclude'] );
			}
		}

		// Batch process posts to avoid memory issues
		$offset = 0;
		$batch  = 500;

		$post_blocks = array();

		do {
			$posts = get_posts([
				'posts_per_page' => $batch,
				'offset'         => $offset,
				'post_status'    => $allowed_statuses,
				'post_type'      => $allowed_types,
			]);

			foreach ( $posts as $post ) {
				$content = $post->post_content;
				$blocks = parse_blocks( $content );

				foreach ( $blocks as $block ) {
					if ( isset( $block['blockName'] ) &&
						$block['blockName'] === 'dynamic-table-blocks/dynamic-table-blocks' &&
						isset( $block['attrs']) &&
						! empty( $block['attrs']  ) ) {
							$attrs = $block['attrs'];
							array_push( $post_blocks, [
								'post_id'         => (int) $post->ID,
								'parent_post_id'  => (int) wp_is_post_revision( $post->ID ) ? (int) wp_get_post_parent_id( $post->ID ) : (int) $post->ID,
								'table_id'        => (int) $attrs['table_id'],
								'block_table_ref' => $attrs['block_table_ref'],
								'resolved'        => false,
							] );
					}
				}
			}
			$offset += $batch;
		} while ( count($posts) === $batch );
		return $post_blocks;
	}

	private function is_api_return_error($response) {
		// Check for WP_Error
		if ( $response->is_error() ) {
			$error = $response->as_error();  // returns WP_Error or null
			if ( is_wp_error( $error ) ) {
				$wp_error_code = (int) $error->get_error_data()['status'];
				if ( $wp_error_code !== 0 && ( $wp_error_code < 200 || $wp_error_code >= 299 )) return true;
			}
		}

		// Check for normal http status error code
		$status_code = wp_remote_retrieve_response_code( $response );
		if ( $status_code !== '' && ( $status_code < 200 || $status_code >= 299 ) ) return true;

		return false;
	}

	private function build_internal_signature($method,  $path,  $body) {
		$key = dtbk_signing_key();

		// Canonical string
		$msg = strtoupper( $method ) . "\n" . $path . "\n" . $body;

		return hash_hmac( 'sha256', $msg, $key );
	}

	/**
	 * Create index for an array to enhance search performance
	 *
	 * @since 1.1.0
	 *
	 * @param  array $source_data  Array of data to be indexed
	 * @param  array $fields       Array of elements in the data to index
	 * @return void
	 */
	public function build_index_for_array($source_data, $fields) {
		$index = [];
		foreach ( $source_data as $key => $row ) {
			foreach ( $fields as $field ) {
				if ( isset($row[ $field ]) ) {
					$value = $row[ $field ];
					$index[ $field ][ $value ][] = $key;
				}
			}
		}
		return $index;
	}

	/**
	 * Search an indexed array based criteria using AND logic.
	 *
	 * Description - This search is support large arrays for better performance that a linear search.
	 *
	 * @since 1.1.0
	 *
	 * @param  array $searchable_data  Array of data to be searched
	 * @param  array $index            Index to apply to the searchable data
	 * @param  array $criteria         Search criteria as field => value pairs
	 * @return array                   Filtered array of data
	 */
	public function perform_indexed_and_search($searchable_data, $index, $criteria) {
		$lists = [];
		foreach ( $criteria as $field => $value ) {
			$lists[] = $index[ $field ][ $value ] ?? [];
			if (empty(end($lists))) return []; // no matches → short-circuit
		}
		$keys = array_shift($lists);
		foreach ( $lists as $list ) {
			$keys = array_values(array_intersect($keys, $list));
		}
		return array_intersect_key($searchable_data, array_flip($keys));
	}

	/**
	 * Search an indexed array based criteria using OR logic.
	 *
	 * Description - This search is support large arrays for better performance that a linear search.
	 *
	 * @since 1.1.0
	 *
	 * @param  array $searchable_data  Array of data to be searched
	 * @param  array $index            Index to apply to the searchable data
	 * @param  array $criteria         Search criteria as field => value pairs
	 * @return array                   Filtered array of data
	 */
	public function perform_indexed_or_search($searchable_data, $index, $criteria) {
		$matching_keys = [];
		foreach ( $criteria as $field => $value ) {
			$matching_keys = array_merge($matching_keys, $index[ $field ][ $value ] ?? []);
		}
		$matching_keys = array_values(array_unique($matching_keys));
		return array_intersect_key($searchable_data, array_flip($matching_keys));
	}
}

// DTBK_Maintenance::get_instance();
// add_action( 'init', array( 'DynamicTableBlocks\DTBK_Maintenance', 'get_instance' ) );
