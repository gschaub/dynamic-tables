<?php
namespace DynamicTables;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

if ( ! class_exists( DT_Admin_Notices::class ) ) {

	/**
	 * Library of noticices with methods to retrieve and pass them
	 * to the admin page form handlers
	 */
	class DT_Admin_Notices {


		/**
		 * Constructor.
		 *
		 * @since 5.0.0
		 */
		public function __construct() {
			// silence is golden.
		}

		/**
		 * Admin Notice Library.
		 *
		 * @date    28/09/13
		 * @since   5.0.0
		 */
		public function admin_notice_library( $notice_id ) {
			$notices                            = array();
			$notices['save-success']            = $this->save_success();
			$notices['save-fail-permissions']   = $this->save_fail_permissions();
			$notices['uninstall-table-warning'] = $this->uninstall_table_warning();

			return $notices[ $notice_id ];
		}

		/**
		 * Notice:  Save was successful
		 */
		public function save_success() {

			$message = 'Your selections were saved.';

			return wp_get_admin_notice(
				__( $message, 'Dynamic Tables' ),
				array(
					'type'           => 'success',
					'dismissible'    => false,
					'id'             => 'success',
					'paragraph_wrap' => true,
				)
			);
		}

		/**
		 * Notice:  Save failed - permissions
		 */
		public function save_fail_permissions() {
			$message = 'Sorry, you do not have permission to perform that action.';

			return wp_get_admin_notice(
				__( $message, 'Dynamic Tables' ),
				array(
					'type'           => 'error',
					'dismissible'    => false,
					'id'             => 'fail',
					'paragraph_wrap' => true,
				)
			);
		}

		/**
		 *  Notice:  Warning - Table data will be lost on plugin uninstall
		 */
		public function uninstall_table_warning() {
			$message  = 'All table data will be <strong>lost and unrecoverable</strong> if Dynamic Tables is uninstalled. ';
			$message .= 'This will break all posts that contain Dynamic Table blocks, if any. ';
			$message .= 'Check the box to keep Dynamic Table data upon plugin removal if you want ';
			$message .= 'retain the ability to restore existing Dynamic Table instances.';

			return wp_get_admin_notice(
				__( $message, 'Dynamic Tables' ),
				array(
					'type'               => 'warning',
					'dismissible'        => true,
					'id'                 => 'message',
					'additional_classes' => null,
					'attributes'         => null,
					'paragraph_wrap'     => true,
				)
			);
		}
	}

	// Instantiate.
	dt_new_instance( 'DT_Admin_Notices' );
}
