<?php
namespace DynamicTables;

/**
 * Determine if Dynamic Tables has a specific setting
 *
 * Alias of dynamic_tables()->has_setting()
 *
 * @since   1.0.0
 *
 * @param   string $name Name of the setting to check for.
 * @return  boolean Does setting exist
 */
function dt_has_setting($name = '') {
	return dynamic_tables()->has_setting($name);
}

/**
 * Retrieve the value of a dynamic tables setting
 *
 * alias of dynamic_tables()->get_setting()
 *
 * @since   1.0.0
 *
 * @param   string Setting name
 * @return  mixed setting value
 */
function dt_raw_setting($name = '') {
	return dynamic_tables()->get_setting($name);
}

/**
 * Update a dynamic tables setting
 *
 * alias of dynamic_tables()->update_setting()
 *
 * @since 1.0.0
 *
 * @param  string $name Setting name
 * @param  mixed $value New setting value
 * @return mixed updated setting
 */
function dt_update_setting($name, $value) {
	// validate name.
	$name = dt_validate_setting($name);

	// update.
	return dynamic_tables()->update_setting($name, $value);
}

/**
 * Returns the changed setting name if available.
 *
 * @since   1.0.0
 *
 * @param  string $name Setting name
 * @return mixed updated setting name if changed
 */
function dt_validate_setting($name = '') {
	return apply_filters('dt/validate_setting', $name);
	return $name;
}

/**
 * Retrieve a setting value based on its name
 *
 * Alias of dynamic_tables()->get_setting()
 *
 * @since   1.0.0
 *
 * @param   string $name  The name of the setting to test.
 * @param string $value An optional default value for the setting if it doesn't exist.
 * @return  mixed Setting value
 */
function dt_get_setting($name, $value = null) {
	$name = dt_validate_setting($name);

	// replace default setting value if it exists.
	if ( dt_has_setting($name) ) {
		$value = dt_raw_setting($name);
	}

	// filter.
	$value = apply_filters("dt/settings/{$name}", $value);

	return $value;
}

/**
 * Create and echo a basic nonce input
 *
 * @since   1.0.0
 *
 * @param string $nonce Nonce field.
 * @param string $nonce The nonce parameter string.
 */
function dt_nonce_input($name = '_dt_nonce', $nonce = '') {
	echo '<input type="hidden" name="' . esc_attr($name) . '" value="' . esc_attr(wp_create_nonce($nonce)) . '" />';
}

/**
 * Sanitizes and slashes nonce and verifies it.  Optionally verifies the user's permissions
 * to ensure authorization.
 *
 * Permission verification only supports one capability.
 *
 * @since 1.0.0
 *
 * @param  string $nonce Returned nonce value
 * @param  string $nonce_action Action being performed
 * @param  string $required_permissions
 * @return bool Is authorization granted
 */
function dt_verify_nonce($nonce, $nonce_action, $required_permissions = '') {

	$dt_admin_nonce_prepared = isset($_POST[ $nonce ]) ? sanitize_text_field( wp_unslash($_POST[ $nonce ])) : '';
	if ( ! wp_verify_nonce( $dt_admin_nonce_prepared, $nonce_action ) ) {
		return false;
	}

	if ( $required_permissions && ! current_user_can($required_permissions) ) {
		return false;
	}
	return true;
}

/**
 * Sanatized HTTP request arguments
 *
 * @since 1.0.0
 *
 * @param  mixed $args Arguments to be sanitized
 * @return mixed Sanitized arguments
 */
function dt_sanitize_request_args( $args = array() ) {
	switch ( gettype( $args ) ) {
		case 'boolean':
			return (bool) $args;
		case 'integer':
			return (int) $args;
		case 'double':
			return (float) $args;
		case 'array':
			$sanitized = array();
			foreach ( $args as $key => $value ) {
				$key               = sanitize_text_field( $key );
				$sanitized[ $key ] = dt_sanitize_request_args( $value );
			}
			return $sanitized;
		case 'object':
			return wp_kses_post_deep( $args );
		case 'string':
		default:
			return wp_kses( $args, 'dt' );
	}
}
