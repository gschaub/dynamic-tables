<?php
/**
 * Provides the main Dynamic Tables admin page.
 */
namespace DynamicTables;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

if ( ! class_exists( \WP_List_Table::class) ) {
	require_once(ABSPATH . 'wp-admin/includes/screen.php');
	require_once(ABSPATH . 'wp-admin/includes/class-wp-list-table.php');
}

// add_filter('set-screen-option', 'set_screen_option', 5, 3);

if ( ! class_exists( DT_List_Dynamic_Tables::class ) ) {

	class DT_List_Dynamic_Tables extends \WP_List_Table {

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
				'ajax'     => false,
			) );

			// $this->screen = get_current_screen();
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

			foreach ( $tables as $index => $table ) {
				$table_data = $this->prepare_table($table);
				$table_items[] = $table_data;
			}

			$columns = $this->get_columns();
			$hidden = $this->get_hidden_columns();
			$sortable = $this->get_sortable_columns();

			$primary = 'id';
			$this->_column_headers = array( $columns, $hidden, $sortable, $primary );

			usort($table_items, array( &$this, 'usort_reorder' ));

			// Establish pagination
			$per_page = get_user_option( 'dynamic_tables_per_page', get_current_user_id() );
			if ( empty( $per_page ) || $per_page < 1 ) {
				$per_page = 5; // Default if not set or invalid
			}

			$current_page = $this->get_pagenum();
			$num_tables = count($tables);

			$table_items = array_slice($table_items, ( ( $current_page - 1 ) * $per_page ),$per_page);

			$this->set_pagination_args( array(
				'total_items' => $num_tables,
				'per_page'    => $per_page,
				'total_pages' => ceil( $num_tables / $per_page ),
			));

			$this->items = $table_items;
		}

		public function get_columns() {
			$columns = array(
				'cb'       => '<input type="checkbox" />',
				'id'       => __('Table Id', 'dynamic-table-cookie-consent'),
				'name'     => __('Description','dynamic-table-cookie-consent'),
				'status'   => __('Status', 'dynamic-table-cookie-consent'),
				'post'     => __('Post','dynamic-table-cookie-consent'),
				'posttype' => __('Post Type','dynamic-table-cookie-consent'),
			);
			return $columns;
		}

		public function get_hidden_columns() {
			$hidden = (
				is_array(get_user_meta( get_current_user_id(),
				'managedynamic-tables_page_list_dynamic_tablescolumnshidden', true)) ) ? get_user_meta(
				get_current_user_id(), 'managedynamic-tables_page_list_dynamic_tablescolumnshidden', true) :
				array();
			return $hidden;
		}

		protected function get_sortable_columns() {
			$sortable_columns = array(
				'id'       => array( 'id', false, __('Table ID'), '', 'asc' ),
				'name'     => array( 'name', false, __('Table Name'), __('Decsription of Table Contents') ),
				'status'   => array( 'status', false, __('Table Status') ),
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

			if ( $is_post ) {
				$post = get_post( (int) $table['post_id']);
				$post_title = $post->post_title;
				$post_type = $post->post_type;

				$post_link = get_edit_post_link($post);
				$post_display = '<a href="' . $post_link . '">' . $post_title . '</a>';
			}

			$transformed_table = array(
				'id'       => ( (int) $table['id'] ),
				'name'     => $table['table_name'],
				'status'   => $table['status'],
				'post'     => $post_display,
				'posttype' => $post_type,
			);
			return $transformed_table;
		}

		protected function column_default( $item, $column_name) {
			switch ( $column_name ) {
				case 'id':
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
	}
}
