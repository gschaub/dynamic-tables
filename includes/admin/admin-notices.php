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
			$notices['network-activation-error'] = $this->network_activation_error();

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

		public function network_activation_error() {
			$message_body = 'Dynamic tables may not be network activated.  Activate the plugin from the individual site(s).';
			$message_style = '"margin:5px 0 15px;padding:1px 12px;border:1px solid #c3c4c7;border-left-width:4px;';
			$message_style .= 'border-left-color:red;box-shadow:0 1px 1px rgba(0,0,0,.04)"';
			$message_body_style = '"margin:.5em 0;padding:2px;font-size:13px;line-height:1.5;"';
			$message = '<div style=' . $message_style . '>';
			$message .= '<p style=' . $message_body_style . '><strong>Error: </strong>' . $message_body . '</p>';
			$message .= '</div>';

			return $message;
		}
	}

	// Instantiate.
	dt_new_instance( 'DT_Admin_Notices' );
}
