<?php
/**
* Maintenance tasks for Dynamic Table Blocks for external WordPress activity
* and cron jobs.
*
* @since 1.1.0
*/

namespace DynamicTableBlocks;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class DTBLMaintenance {

	/**
	 * Constructor.
	 *
	 * @since 1.1.0
	 */
	public function __construct() {
		add_action( 'wp_after_insert_post', array( $this, 'on_after_insert_post' ), 10, 3 );
		add_action( 'before_delete_post', array( $this, 'delete_post_tables' ), 10, 3 );
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
	 * Delete all tables when their underlying post is deleted
	 *
	 * @since 1.1.0
	 *
	 * @param  $post_id  ID of the post being deleted
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
	 * Delete a table
	 *
	 * @since 1.1.0
	 *
	 * @param  int   $table_id  Table ID for table to delete
	 * @return void
	 */
	private function delete_table($table_id) {
		wp_set_current_user( get_current_user_id() );

		// Create rest request to create table
		$request = new \WP_REST_Request( 'DELETE', '/dynamic-table-blocks/v1/tables/' .  $table_id);

		// Execute the request
		$response = rest_do_request( $request );

		// Retrieve the response data
		$server = rest_get_server();
		$data   = $server->response_to_data( $response, false ); // Pass false to prevent authentication checks for internal requests

		if ( ! $data['deleted'] ) {
			error_log('Table was not deleted: table_id = ' . $table_id);
		}

		if ( is_wp_error( $data ) ) {
			// Convert to a WP_Error object.
			$error = $response->as_error();
			// $message = $response->get_error_message();
			// $error_data = $response->get_error_data();
			$status = isset( $error_data['status'] ) ? $error_data['status'] : 500;
			// wp_die( printf( '<p>An error occurred: %s (%d)</p>', $message, $error_data ) );
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
}

dtbk_new_instance( 'DTBLMaintenance' );
