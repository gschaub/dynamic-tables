<?php
/**
 * This function will return true for a non empty array
 *
 * @since   5.4.0
 *
 * @param   mixed $array The variable to test.
 * @return  boolean
 */
namespace DynamicTables;

function dt_is_array($array) {
	return ( is_array($array) && ! empty($array) );
}

/**
 * Alias of dynamic_tables()->has_setting()
 *
 * @since   5.6.5
 *
 * @param   string $name Name of the setting to check for.
 * @return  boolean
 */
function dt_has_setting($name = '') {
	return dynamic_tables()->has_setting($name);
}

/**
 * dt_raw_setting
 *
 * alias of dynamic_tables()->get_setting()
 *
 * @since   5.6.5
 *
 * @param   n/a
 * @return  n/a
 */
function dt_raw_setting($name = '') {
	return dynamic_tables()->get_setting($name);
}

/**
 * dt_update_setting
 *
 * alias of dynamic_tables()->update_setting()
 *
 * @since   5.0.0
 *
 * @param   $name (string)
 * @param   $value (mixed)
 * @return  n/a
 */
function dt_update_setting($name, $value) {
	// validate name.
	$name = dt_validate_setting($name);

	// update.
	return dynamic_tables()->update_setting($name, $value);
}

/**
 * dt_validate_setting
 *
 * Returns the changed setting name if available.
 *
 * @since   5.6.5
 *
 * @param   n/a
 * @return  n/a
 */
function dt_validate_setting($name = '') {
	// return apply_filters('dt/validate_setting', $name);
	return $name;
}

/**
 * Alias of dynamic_tables()->get_setting()
 *
 * @since   5.0.0
 *
 * @param   string $name  The name of the setting to test.
 * @param string $value An optional default value for the setting if it doesn't exist.
 * @return  n/a
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
 * This function will create and echo a basic nonce input
 *
 * @since   1.0.0
 *
 * @param string $nonce The nonce parameter string.
 */
function dt_nonce_input($nonce = '') {
	echo '<input type="hidden" name="_dt_nonce" value="' . esc_attr(wp_create_nonce($nonce)) . '" />';
}

/**
 * This function will look at the $_POST['_dt_nonce'] value and return true or false
 *
 * @since   1.0.0
 *
 * @param   $nonce (string)
 * @return  (boolean)
 */
function dt_verify_nonce($value) {

	// vars
	$nonce = dt_maybe_get_POST('_dt_nonce');

	// bail early nonce does not match (post|user|comment|term)
	if ( ! $nonce || ! wp_verify_nonce($nonce, $value) ) {
		return false;
	}

	// reset nonce (only allow 1 save)
	$_POST['_dt_nonce'] = false;

	// return
	return true;
}

/**
 * This function will return a var if it exists in an array
 *
 * @since   1.0.0
 *
 * @param   $array (array) the array to look within
 * @param   $key (key) the array key to look for. Nested values may be found using '/'
 * @param   $default (mixed) the value returned if not found
 * @return  $post_id (int)
 */
function dt_maybe_get($array = [], $key = 0, $default = null) {

	return isset($array[ $key ]) ? $array[ $key ] : $default;
}

function dt_maybe_get_POST($key = '', $default = null) {

	// return isset( $_POST[ $key ] ) ? dt_sanitize_request_args( $_POST[ $key ] ) : $default; // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.NonceVerification.Missing -- Checked elsewhere.
}

function dt_maybe_get_GET($key = '', $default = null) {

	// return isset( $_GET[ $key ] ) ? dt_sanitize_request_args( $_GET[ $key ] ) : $default; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Checked elsewhere.
}
