<?php
/**
 * Provides the main Dynamic Tables admin page.
 */
namespace DynamicTableBlocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

if ( ! class_exists( \WP_List_Table::class) ) {
	require_once(ABSPATH . 'wp-admin/includes/screen.php');
	require_once(ABSPATH . 'wp-admin/includes/class-wp-list-table.php');
}

class DTBK_List_Dynamic_Table_Blocks extends \WP_List_Table {

	// private array $notices = new DTBK_Admin_Notices();

	/**
	 * Constructor.
	 *
	 * @since 1.1.0
	 */
	public function __construct() {
		// Set parent defaults
		parent::__construct( array(
			'singular' => 'table',
			'plural'   => 'tables',
			'ajax'     => true,
		) );

		add_action ( 'admin_head', array( &$this, 'custom_table_styles' ) );
	}

	/**
	 * Prepares the list of dynamic tables to be displayed.
	 *
	 * @since 1.1.0
	 *
	 * @return void
	 */
	public function prepare_items() {

		// Get table data
		$tables = get_tables();
		$table_items = array();

		foreach ( $tables as $table ) {
			$table_data = $this->prepare_table($table);

			// Filter results if submitted a search string
			if ( ! isset($_POST['s']) ) {
				$table_items[] = $table_data;
			} else {
				$found = false;
				foreach ( $table_data as $column ) {
					if ( ! $found ) {
						if ( stripos( strtolower($column), strtolower($_POST['s'])) !== false ) {
							$found = true;
						}
					}
				}
				if ( $found ) {
					$table_items[] = $table_data;
				}
			}
		}

		$columns = $this->get_columns();
		$hidden = $this->get_hidden_columns();
		$sortable = $this->get_sortable_columns();

		$primary = 'name';
		$this->_column_headers = array( $columns, $hidden, $sortable, $primary );

		usort($table_items, array( &$this, 'usort_reorder' ));

		// Establish pagination
		$per_page = get_user_option( 'dynamic_table_blocks_per_page', get_current_user_id() );
		if ( empty( $per_page ) || $per_page < 1 ) {
			$per_page = 5; // Default if not set or invalid
		}

		$current_page = $this->get_pagenum();
		$num_tables = count($table_items);

		$table_items = array_slice($table_items, ( ( $current_page - 1 ) * $per_page ),$per_page);

		$this->set_pagination_args( array(
			'total_items' => $num_tables,
			'per_page'    => $per_page,
			'total_pages' => ceil( $num_tables / $per_page ),
		));
		error_log('Table Items = '. print_r(json_encode($table_items), true));

		$this->items = $table_items;
		$this->process_action();
	}

	public function get_columns() {
		$columns = array(
			'cb'       => '<input type="checkbox" />',
			'name'     => __('Table Name','dynamic-table-blocks'),
			'id'       => __('ID', 'dynamic-table-blocks'),
			'status'   => __('Status', 'dynamic-table-blocks'),
			'post'     => __('Post','dynamic-table-blocks'),
			'posttype' => __('Post Type','dynamic-table-blocks'),
		);
		return $columns;
	}

	public function get_hidden_columns() {
		$hidden = (
			is_array(get_user_meta( get_current_user_id(),
			'managedynamic-table-blocks_page_list_dynamic_table_blockscolumnshidden', true)) ) ? get_user_meta(
			get_current_user_id(), 'managedynamic-table-blocks_page_list_dynamic_table_blockscolumnshidden', true) :
			array();
		return $hidden;
	}

	protected function get_sortable_columns() {
		$sortable_columns = array(
			'name'     => array( 'name', false, __('Table Name','dynamic-table-blocks'), __('Decsription of Table Contents','dynamic-table-blocks') ),
			'status'   => array( 'status', false, __('Table Status','dynamic-table-blocks') ),
			'post'     => array( 'post', false ),
			'posttype' => array( 'posttype', false ),
		);

		return $sortable_columns;
	}

	/**
	 * Perform sorting base on response to column heading clicks
	 *
	 * @since 1.1.0
	 *
	 * @param  [type] $a
	 * @param  [type] $b
	 * @return array Sorted table data
	 */
	protected function usort_reorder( $a, $b) {
		// If no sort, default to user_login
		$orderby = ( ! empty($_GET['orderby']) ) ? $_GET['orderby'] : 'id';

		// If no order, default to asc
		$order = ( ! empty($_GET['order']) ) ? $_GET['order'] : 'asc';

		// Determine sort order
		$is_numeric = is_numeric($a[ $orderby ]) && is_numeric($b[ $orderby ]) ? true : false;

		if ( $is_numeric ) {
			$result = $a[ $orderby ] > $b[ $orderby ] ? 1 : -1;
		} else {
			$result = strcmp($a[ $orderby ], $b[ $orderby ]);
		}

		// Send final sort direction to usort
		return ( $order === 'asc' ) ? $result : -$result;
	}

	public function prepare_table($table) {
		$is_post = null !== get_post( $table['post_id']);
		$post_type = 'No Post';
		$post_display = 'No Post';

		/**
		 * Lookup post from post_id and return post description and edit link. If
		 * the post_id is invalid, return "No Post" instead.
		 */
		if ( $is_post ) {
			$post = get_post( (int) $table['post_id']);
			$post_title = $post->post_title;
			$post_type = $post->post_type;

			$post_link = get_edit_post_link($post);
			$post_display = '<a href="' . $post_link . '">' . $post_title . '</a>';
		}

		$transformed_table = array(
			'name'     => $table['table_name'],
			'id'       => ( (int) $table['id'] ),
			'status'   => $table['status'],
			'post'     => $post_display,
			'posttype' => $post_type,
		);
		return $transformed_table;
	}

	protected function column_default( $item, $column_name) {
		switch ( $column_name ) {
			case 'name':
			case 'status':
			case 'post':
			case 'posttype':
				return $item[ $column_name ];
			default:
				return print_r($item, true );
		}
	}

	protected function column_cb ($item) {
		return sprintf(
			'<input type="checkbox" name="%1$s[]" value="%2$s" />',
			$this->_args['singular'],
			$item['id']
		);
	}

	protected function column_name ($item) {
		$actions = array(
			'update_status' => sprintf('<a href="?page=%s&action=%s&element=%s">' . __('Update Status', 'dynamic-table-blocks') . '</a>',
				$_REQUEST['page'],
				'update_status',
				$item['id']),

			'export'        => sprintf('<a href="?page=%s&action=%s&element=%s">' . __('Export', 'dynamic-table-blocks') . '</a>',
				$_REQUEST['page'],
				'export',
				$item['id']),

			'view'          => sprintf('<a href="#" data-dtbk-action="view" data-id="%d">%s</a>',
				(int) $item['id'],
				esc_html__( 'View', 'dynamic-table-blocks' )),

			'delete'        => sprintf('<a href="?page=%s&action=%s&element=%s">' . __('Delete', 'dynamic-table-blocks') . '</a>',
				$_REQUEST['page'],
				'delete',
				$item['id']),
		);
		return sprintf('%1$s %2$s', $item['id'], $this->row_actions($actions));
	}

	function get_bulk_actions() {
		return array(
			'update_all_statuses' => __('Update Status', 'dynamic-table-blocks'),
			'delete_all'          => __('Delete', 'dynamic-table-blocks'),
		);
	}

	/**
	 * Custom styling for list table
	 *
	 * Consider enqueueing in a CSS.
	 *
	 * @since 1.1.0
	 *
	 * @return void
	 */
	function custom_table_styles() {
		echo '<style type="text/css">';

		// limit width of the narrow table id column
		echo '.wp-list-table .column-id { width: 16em; }';
		echo '</style>';
	}

	public function process_action() {
		$notices = new DTBK_Admin_Notices();

		// Verify nonce for security
		// if ( ! isset( $_REQUEST['_wpnonce'] ) || ! wp_verify_nonce( $_REQUEST['_wpnonce'], 'bulk-' . $this->screen->id ) ) {
		//  wp_die( 'Security check failed.' );
		// }

		error_log('GET Request = ' . wp_json_encode( $_REQUEST));

		$action = $this->current_action();
		$bulk_action = isset( $_REQUEST['bulk_action'] );

		$item_ids = null;
		$item_id = null;

		if ( $bulk_action ) {
			$item_ids = isset( $_REQUEST['table'] ) ? (array) $_REQUEST['table'] : array();
		} elseif ( $action ) {
			$item_id = isset( $_REQUEST['element'] ) ? $_REQUEST['element'] : '';
		}

		if ( $bulk_action ) {
			switch ( $action ) {
				case 'update_all_statuses':
					// Update all statuses to the supplied value
					if ( ! empty( $item_ids ) ) {
						foreach ( $item_ids as $item_id ) {
							error_log('Update Status Bulk Rows, row = ' . $item_id);
						}

						if ( ! dtbk_verify_nonce( 'dtbkAdminNonce', 'saveSettings', 'edit_plugins' ) ) {
							echo $notices->admin_notice_library( 'bulk-status-update-success' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Trusted HTML
						}
					}
					break;
				case 'delete_all':
					// Handle deletion of selected items
					if ( ! empty( $item_ids ) ) {
						foreach ( $item_ids as $item_id ) {
							error_log('Delete Bulk Rows, row = ' . $item_id);
						}

						if ( ! dtbk_verify_nonce( 'dtbkAdminNonce', 'saveSettings', 'edit_plugins' ) ) {
							echo $notices->admin_notice_library( 'bulk-delete-success' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Trusted HTML
						}
					}
					break;
			}
		} else {
			switch ( $action ) {
				case 'update_status':
					// Update statuse to the supplied value
					if ( ! empty( $item_id ) ) {

						error_log('Update Status, row = ' . $item_id);

						if ( ! dtbk_verify_nonce( 'dtbkAdminNonce', 'saveSettings', 'edit_plugins' ) ) {
							echo $notices->admin_notice_library( 'bulk-status-update-success' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Trusted HTML
						}
					}
					break;
				case 'export':
					// Handle deletion of selected item
					if ( ! empty( $item_id ) ) {

						error_log('Export, row = ' . $item_id);

						if ( ! dtbk_verify_nonce( 'dtbkAdminNonce', 'saveSettings', 'edit_plugins' ) ) {
							echo $notices->admin_notice_library( 'bulk-delete-success' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Trusted HTML
						}
					}
					break;
				case 'view':
					// Handle deletion of selected item
					if ( ! empty( $item_id ) ) {

						error_log('View, row = ' . $item_id);

						if ( ! dtbk_verify_nonce( 'dtbkAdminNonce', 'saveSettings', 'edit_plugins' ) ) {
							echo $notices->admin_notice_library( 'bulk-delete-success' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Trusted HTML
						}
					}
					break;
				case 'delete':
					// Handle deletion of selected item
					if ( ! empty( $item_id ) ) {

						error_log('Delete, row = ' . $item_id);

						if ( ! dtbk_verify_nonce( 'dtbkAdminNonce', 'saveSettings', 'edit_plugins' ) ) {
							echo $notices->admin_notice_library( 'bulk-delete-success' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Trusted HTML
						}
					}
					break;
			}
		}
	}
}
