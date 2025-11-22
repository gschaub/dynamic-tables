<?php
/**
* Maintenance tasks for Dynamic Table Blocks for external WordPress activity
* and cron jobs.
*
* @since 1.1.0
*/

namespace DynamicTableBlocks;

use Error;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class DTBLMaintenance {

	// Establish WordPress cron constants
	const HOOK = 'dynamic-table-blocks/maintenance_run';
	const SCHEDULE = 'dynamic-table-blocks_five_minutes';
	const FIRST_DELAY = 1 * MINUTE_IN_SECONDS;

	private int $cron_minutes_between_runs = 1;

	/**
	 * Constructor.
	 *
	 * @since 1.1.0
	 */
	public function __construct() {
		// Cron hooks
		add_filter('cron_schedules', array( $this, 'add_schedule' ) );
		add_action(self::HOOK, array( $this, 'run' ) );
		add_action('init', array( $this, 'ensure_scheduled' ) );

		// Handle post template instanciation and clones
		add_action( 'wp_after_insert_post', array( $this, 'on_after_insert_post' ), 10, 3 );

		// Handle post deletions
		add_action( 'before_delete_post', array( $this, 'delete_post_tables' ), 10, 3 );
	}

	/**
	 * Schedule the cron trigger
	 *
	 * @since 1.1.0
	 *
	 * @param  array $schedules
	 * @return array
	 */
	public function add_schedule(array $schedules) {
		if ( ! isset($schedules[ self::SCHEDULE ]) ) {
			$schedules[ self::SCHEDULE ] = [
				'interval' => $this->cron_minutes_between_runs * MINUTE_IN_SECONDS,
				'display'  => __('Runs on a minutes based interval (Dynamic Blocks)', 'dynamic-table-blocks'),
			];
		}
		return $schedules;
	}

	/**
	 * Ensure cron event is set
	 *
	 * @since 1.1.0
	 *
	 * @return void
	 */
	public static function ensure_scheduled() {
		if ( ! wp_next_scheduled(self::HOOK) ) {
			// start a few minutes from now to avoid slowing down page load
			wp_schedule_event(time() + self::FIRST_DELAY, self::SCHEDULE, self::HOOK);
		}
	}

	/**
	 * Cron tasks to run
	 *
	 * Description - A supplement to the summary, above.  Full sentences.
	 *
	 * @since 1.1.0
	 *
	 * @return void
	 */
	public function run() {
		$this->delete_expired_transients();
		error_log('BEGIN TABLE VALIDATION');
		error_log(' ');
		$this->validate_tables();
		error_log(' ');
		error_log('END TABLE VALIDATION');
		error_log(' ');
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
		error_log('Post Blocks for reference = ' . print_r(json_encode($post_blocks), true));

		$search_post_history_types = array(
			'include' => array( 'revision' ),
		);

		// Retrieve dynamic table blocks in all historic posts and index fields
		$post_history_blocks = $this->get_dynamic_table_blocks( $search_post_history_types );
		$post_history_indexed_fields = [ 'post_id', 'table_id', 'block_table_ref', 'resolved' ];
		$post_history_blocks_index = $this->build_index_for_array($post_history_blocks, $post_history_indexed_fields);
		error_log('Post History Blocks for reference = ' . print_r(json_encode($post_history_blocks), true));

		// loop through each table for validation
		$tables = get_tables();
		foreach ( $tables as $table ) {
			error_log('current table for validation is - ' . print_r(json_encode($table),true));

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
				error_log('Moving to history');
				$matching_post_history = $this->perform_indexed_and_search($post_blocks, $post_history_blocks_index, $post_search_criteria);
				if ( $matching_post_history ) {
					$this->process_table_post_matches($matching_post_history, $table);
				} elseif ( $table['status'] !== 'orphan' ) {
					// Tables without a matching post are marked as orphaned or optionally deleted
					error_log('Table id = ' . $table_id);
					$full_table = $this->get_table( (int) $table_id);
					if ( $this->is_api_return_error($full_table) ) {
						// Table is corrupt - delete table
						$this->delete_table( (int) $table_id);
					} else {
						$full_table['header']['status'] = 'orphan';
						error_log('Orphan Table = ' . json_encode($full_table));
						$response = $this->update_table($full_table);
						error_log('Error updating table = ' . json_encode($response));
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
			error_log ('Found post block: ' . print_r(json_encode($post_block), true));

			if ( (int) $table['post_id'] === 0 ) {
				if ( $post_block['block_table_ref'] === $table['block_table_ref'] ) {
					// Update Post Id
					$full_table = $this->get_table( (int) $table['id']);
					error_log('Original table = ' . json_encode($full_table));
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
			// post_block['resolved'] = true
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
	 * @param  array $table  Table array to be created
	 * @return int           New table ID
	 */
	private function get_table($table_id) {
		wp_set_current_user( get_current_user_id() );

		// Create rest request to create table
		$request = new \WP_REST_Request( 'GET', '/dynamic-table-blocks/v1/tables/' .  $table_id );
		error_log('Get Table REST Request headers = ' . json_encode($request->get_headers()));
		error_log('Get Table REST Request body = ' . json_encode($request->get_body()));

		// Execute the request
		$response = rest_do_request( $request );
		error_log('REST Response body = ' . json_encode($response->data));


		// Retrieve the response data
		$server = rest_get_server();
		$data   = $server->response_to_data( $response, false ); // Pass false to prevent authentication checks for internal requests

		if ( is_wp_error( $data ) ) {
			// Convert to a WP_Error object.
			$error = $response->as_error();
			// $message = $response->get_error_message();
			// $error_data = $response->get_error_data();
			$status = isset( $error_data['status'] ) ? $error_data['status'] : 500;
			// wp_die( printf( '<p>An error occurred: %s (%d)</p>', $message, $error_data ) );
		}
		return $response->data;
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
		wp_set_current_user( get_current_user_id() );

		// Create rest request to create table
		$request = new \WP_REST_Request( 'POST', '/dynamic-table-blocks/v1/tables' );
		$request->set_body_params( $table );

		// Execute the request
		$response = rest_do_request( $request );

		// Retrieve the response data
		$server = rest_get_server();
		$data   = $server->response_to_data( $response, false ); // Pass false to prevent authentication checks for internal requests

		if ( is_wp_error( $data ) ) {
			// Convert to a WP_Error object.
			$error = $response->as_error();
			// $message = $response->get_error_message();
			// $error_data = $response->get_error_data();
			$status = isset( $error_data['status'] ) ? $error_data['status'] : 500;
			// wp_die( printf( '<p>An error occurred: %s (%d)</p>', $message, $error_data ) );
		}
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
		error_log('Table update data = ' . json_encode($table));

		$signature = $this->build_internal_signature( $method, $path, $body );
		error_log('DETERMINE FINAL CRON USER STRATEGY');
		// wp_set_current_user( 'sysadmin' );
		// error_log('Table UPdate = ' . json_encode($table));

		// Create rest request to create table
		$request = new \WP_REST_Request( $method, $path, $body);
		// $request = new \WP_REST_Request( 'POST', '/dynamic-table-blocks/v1/tables/' .  (int) $table['id'] );
		$request->set_header( 'X-DTBK-Signature', $signature );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( $body );

		if ( (int) $table['id'] === 89 ) {
			// error_log('In Update');
			// Execute the request
			$response = rest_do_request( $request );

			// Retrieve the response data
			$server = rest_get_server();
			$data   = $server->response_to_data( $response, false ); // Pass false to prevent authentication checks for internal requests
		}
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
		if ( (int) $table_id === 131 ) {
			$request->set_header( 'X-DTBK-Signature', $signature );
			$request->set_header( 'Content-Type', 'application/json' );
			// $request->set_body( $body );

			// Execute the request
			$response = rest_do_request( $request );

			// Retrieve the response data
			$server = rest_get_server();
			$data   = $server->response_to_data( $response, false ); // Pass false to prevent authentication checks for internal requests

			if ( is_wp_error( $data ) ) {
				// Convert to a WP_Error object.
				$error = $response->as_error();
				// $message = $response->get_error_message();
				// $error_data = $response->get_error_data();
				$status = isset( $error_data['status'] ) ? $error_data['status'] : 500;
				// wp_die( printf( ' < p > An error occurred: % s ( % d) < / p > ', $message, $error_data ) );
			}
		}
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
							error_log('Block attributes = ' . json_encode($attrs));
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

		error_log('API response = ' . json_encode($response));

		if ( is_wp_error( $response ) ) return true;

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( $status_code < 200 && $status_code >= 299 ) return true;

		return true;
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

dtbk_new_instance( 'DTBLMaintenance' );
