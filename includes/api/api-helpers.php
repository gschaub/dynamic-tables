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
 * dt_append_setting
 *
 * This function will add a value into the settings array found in the dt object
 *
 * @since   5.0.0
 *
 * @param   $name (string)
 * @param   $value (mixed)
 * @return  n/a
 */
function dt_append_setting($name, $value) {

	// vars
	$setting = dt_raw_setting($name);

	// bail early if not array
	if ( ! is_array($setting) ) {
		$setting = [];
	}

	// append
	$setting[] = $value;

	// update
	return dt_update_setting($name, $setting);
}

/**
 * dt_get_data
 *
 * Returns data.
 *
 * @since   5.0.0
 *
 * @param   string $name
 * @return  mixed
 */
function dt_get_data($name) {
	return dynamic_tables()->get_data($name);
}

/**
 * dt_set_data
 *
 * Sets data.
 *
 * @since   5.0.0
 *
 * @param   string $name
 * @param   mixed  $value
 * @return  n/a
 */
function dt_set_data($name, $value) {
	return dynamic_tables()->set_data($name, $value);
}

/**
 * Appends data to an existing key.
 *
 * @since   5.9.0
 *
 * @param string $name The data name.
 * @param mixed  $data The data to append to name.
 */
function dt_append_data($name, $data) {
	$prev_data = dynamic_tables()->get_data($name);
	if ( is_array($prev_data) ) {
		$data = array_merge($prev_data, $data);
	}
	dynamic_tables()->set_data($name, $data);
}

/**
 * Alias of dynamic_tables()->init() - the core DT init function.
 *
 * @since   5.0.0
 */
function dt_init() {
	dynamic_tables()->init();
}

/**
 * dt_has_done
 *
 * This function will return true if this action has already been done
 *
 * @since   5.3.2
 *
 * @param   $name (string)
 * @return  (boolean)
 */
function dt_has_done($name) {

	// return true if already done
	// if (dt_raw_setting("has_done_{$name}")) {
	//     return true;
	// }

	// update setting and return
	dt_update_setting("has_done_{$name}", true);
	return false;
}

/**
 * This function will return the path to a file within an external folder
 *
 * @since   5.5.8
 *
 * @param   string $file Directory path.
 * @param   string $path Optional file path.
 * @return  string File path.
 */
function dt_get_external_path($file, $path = '') {
	return plugin_dir_path($file) . $path;
}

/**
 * This function will return the url to a file within an internal DT folder
 *
 * @since   5.5.8
 *
 * @param   string $file Directory path.
 * @param   string $path Optional file path.
 * @return  string File path.
 */
function dt_get_external_dir($file, $path = '') {
	return dt_plugin_dir_url($file) . $path;
}

/**
 * This function will calculate the url to a plugin folder.
 * Different to the WP plugin_dir_url(), this function can calculate for urls outside of the plugins folder (theme include).
 *
 * @since   5.6.8
 *
 * @param   string $file A file path inside the DT plugin to get the plugin directory path from.
 * @return  string The plugin directory path.
 */
function dt_plugin_dir_url($file) {
	$path = plugin_dir_path($file);
	$path = wp_normalize_path($path);

	// check plugins.
	$check_path = wp_normalize_path(realpath(WP_PLUGIN_DIR));
	if ( strpos($path, $check_path) === 0 ) {
		return str_replace($check_path, plugins_url(), $path);
	}

	// check wp-content.
	$check_path = wp_normalize_path(realpath(WP_CONTENT_DIR));
	if ( strpos($path, $check_path) === 0 ) {
		return str_replace($check_path, content_url(), $path);
	}

	// check root.
	$check_path = wp_normalize_path(realpath(ABSPATH));
	if ( strpos($path, $check_path) === 0 ) {
		return str_replace($check_path, site_url('/'), $path);
	}

	// return.
	return plugin_dir_url($file);
}

/**
 * This function will merge together 2 arrays and also convert any numeric values to ints
 *
 * @since   5.0.0
 *
 * @param   array $args     The configured arguments array.
 * @param   array $defaults The default properties for the passed args to inherit.
 * @return  array $args Parsed arguments with defaults applied.
 */
function dt_parse_args($args, $defaults = []) {
	$args = wp_parse_args($args, $defaults);

	// parse types
	$args = dt_parse_types($args);

	return $args;
}

/**
 * dt_parse_types
 *
 * This function will convert any numeric values to int and trim strings
 *
 * @since   5.0.0
 *
 * @param   $var (mixed)
 * @return  $var (mixed)
 */
function dt_parse_types($array) {
	return array_map('dt_parse_type', $array);
}

/**
 * dt_parse_type
 *
 * description
 *
 * @since   5.0.9
 *
 * @param   $post_id (int)
 * @return  $post_id (int)
 */
function dt_parse_type($v) {

	// Check if is string.
	if ( is_string($v) ) {

		// Trim ("Word " = "Word").
		$v = trim($v);

		// Convert int strings to int ("123" = 123).
		if ( is_numeric($v) && strval(intval($v)) === $v ) {
			$v = intval($v);
		}
	}

	// return.
	return $v;
}

/**
 * This function will load in a file from the 'admin/views' folder and allow variables to be passed through
 *
 * @since   5.0.0
 *
 * @param string $view_path
 * @param array  $view_args
 */
function dt_get_view($view_path = '', $view_args = []) {
	// allow view file name shortcut
	if ( substr($view_path, -4) !== '.php' ) {
		// $view_path = dt_get_path("includes/admin/views/{$view_path}.php");
	}

	// include
	if ( file_exists($view_path) ) {
		// Use `EXTR_SKIP` here to prevent `$view_path` from being accidentally/maliciously overridden.
		extract($view_args, EXTR_SKIP);
		include $view_path;
	}
}

/**
 * dt_merge_atts
 *
 * description
 *
 * @since   5.0.9
 *
 * @param   $post_id (int)
 * @return  $post_id (int)
 */
function dt_merge_atts($atts, $extra = []) {

	// bail early if no $extra
	if ( empty($extra) ) {
		return $atts;
	}

	// trim
	$extra = array_map('trim', $extra);
	$extra = array_filter($extra);

	// merge in new atts
	foreach ( $extra as $k => $v ) {

		// append
		if ( $k == 'class' || $k == 'style' ) {
			$atts[ $k ] .= ' ' . $v;

			// merge
		} else {
			$atts[ $k ] = $v;
		}
	}

	return $atts;
}

/**
 * This function will create and echo a basic nonce input
 *
 * @since   5.6.0
 *
 * @param string $nonce The nonce parameter string.
 */
function dt_nonce_input($nonce = '') {
	echo '<input type="hidden" name="_dt_nonce" value="' . esc_attr(wp_create_nonce($nonce)) . '" />';
}

/**
 * This function will remove the var from the array, and return the var
 *
 * @since   5.0.0
 *
 * @param array  $extract_array an array passed as reference to be extracted.
 * @param string $key           The key to extract from the array.
 * @param mixed  $default_value The default value if it doesn't exist in the extract array.
 * @return mixed Extracted var or default.
 */
function dt_extract_var(&$extract_array, $key, $default_value = null) {
	// check if exists - uses array_key_exists to extract NULL values (isset will fail).
	if ( is_array($extract_array) && array_key_exists($key, $extract_array) ) {

		// store and unset value.
		$v = $extract_array[ $key ];
		unset($extract_array[ $key ]);

		return $v;
	}

	return $default_value;
}

/**
 * This function will remove the vars from the array, and return the vars
 *
 * @since   5.0.0
 *
 * @param array $extract_array an array passed as reference to be extracted.
 * @param array $keys          An array of keys to extract from the original array.
 * @return array An array of extracted values.
 */
function dt_extract_vars(&$extract_array, $keys) {
	$r = [];

	foreach ( $keys as $key ) {
		$r[ $key ] = dt_extract_var($extract_array, $key);
	}

	return $r;
}

/**
 * dt_get_sub_array
 *
 * This function will return a sub array of data
 *
 * @since   5.3.2
 *
 * @param   $post_id (int)
 * @return  $post_id (int)
 */
function dt_get_sub_array($array, $keys) {

	$r = [];

	foreach ( $keys as $key ) {
		$r[ $key ] = $array[ $key ];
	}

	return $r;
}

/**
 * dt_verify_nonce
 *
 * This function will look at the $_POST['_dt_nonce'] value and return true or false
 *
 * @since   5.0.0
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
 * Returns true if the current AJAX request is valid.
 * It's action will also allow WPML to set the lang and avoid AJAX get_posts issues
 *
 * @since   5.2.3
 *
 * @param string  $nonce           The nonce to check.
 * @param string  $action          The action of the nonce.
 * @param boolean $action_is_field If the action is a field, modify the action to match validate the field type.
 * @return boolean
 */
function dt_verify_ajax($nonce = '', $action = '', $action_is_field = false) {
	// Bail early if we don't have a nonce to check.
	if ( empty($nonce) && empty($_REQUEST['nonce']) ) {
		return false;
	}

	// Build the action if we're trying to validate a specific field nonce.
	if ( $action_is_field ) {
		// if (! dt_is_field_key($action)) {
		//     return false;
		// }

		// $field = dt_get_field($action);

		if ( empty($field['type']) ) {
			return false;
		}

		$action = 'dt_field_' . $field['type'] . '_' . $action;
	}

	$nonce_to_check = ! empty($nonce) ? $nonce : $_REQUEST['nonce']; // phpcs:ignore WordPress.Security -- We're verifying a nonce here.
	$nonce_action   = ! empty($action) ? $action : 'dt_nonce';

	// Bail if nonce can't be verified.
	if ( ! wp_verify_nonce(sanitize_text_field($nonce_to_check), $nonce_action) ) {
		return false;
	}

	// Action for 3rd party customization (WPML).
	do_action('dt/verify_ajax');

	return true;
}

/**
 * dt_get_image_sizes
 *
 * This function will return an array of available image sizes
 *
 * @since   5.0.0
 *
 * @param   n/a
 * @return  (array)
 */
function dt_get_image_sizes() {

	// vars
	$sizes = [
		'thumbnail' => __('Thumbnail', 'dt'),
		'medium'    => __('Medium', 'dt'),
		'large'     => __('Large', 'dt'),
	];

	// find all sizes
	$all_sizes = get_intermediate_image_sizes();

	// add extra registered sizes
	if ( ! empty($all_sizes) ) {
		foreach ( $all_sizes as $size ) {

			// bail early if already in array
			if ( isset($sizes[ $size ]) ) {
				continue;
			}

			// append to array
			$label          = str_replace('-', ' ', $size);
			$label          = ucwords($label);
			$sizes[ $size ] = $label;
		}
	}

	// add sizes
	foreach ( array_keys($sizes) as $s ) {

		// vars
		$data = dt_get_image_size($s);

		// append
		if ( $data['width'] && $data['height'] ) {
			$sizes[ $s ] .= ' (' . $data['width'] . ' x ' . $data['height'] . ')';
		}
	}

	// add full end
	$sizes['full'] = __('Full Size', 'dt');

	// filter for 3rd party customization
	$sizes = apply_filters('dt/get_image_sizes', $sizes);

	// return
	return $sizes;
}

function dt_get_image_size($s = '') {

	// global
	global $_wp_additional_image_sizes;

	// rename for nicer code
	$_sizes = $_wp_additional_image_sizes;

	// vars
	$data = [
		'width'  => isset($_sizes[ $s ]['width']) ? $_sizes[ $s ]['width'] : get_option("{$s}_size_w"),
		'height' => isset($_sizes[ $s ]['height']) ? $_sizes[ $s ]['height'] : get_option("{$s}_size_h"),
	];

	// return
	return $data;
}

/**
 * dt_array
 *
 * Casts the value into an array.
 *
 * @since   5.7.10
 *
 * @param   mixed $val The value to cast.
 * @return  array
 */
function dt_array($val = []) {
	return (array) $val;
}

/**
 * Returns a non-array value.
 *
 * @since   5.8.10
 *
 * @param   mixed $val The value to review.
 * @return  mixed
 */
function dt_unarray($val) {
	if ( is_array($val) ) {
		return reset($val);
	}
	return $val;
}

/**
 * dt_get_array
 *
 * This function will force a variable to become an array
 *
 * @since   5.0.0
 *
 * @param   $var (mixed)
 * @return  (array)
 */
function dt_get_array($var = false, $delimiter = '') {

	// array
	if ( is_array($var) ) {
		return $var;
	}

	// bail early if empty
	// if (dt_is_empty($var)) {
	//     return [  ];
	// }

	// string
	if ( is_string($var) && $delimiter ) {
		return explode($delimiter, $var);
	}

	// place in array
	return (array) $var;
}

/**
 * dt_get_numeric
 *
 * This function will return numeric values
 *
 * @since   5.4.0
 *
 * @param   $value (mixed)
 * @return  (mixed)
 */
function dt_get_numeric($value = '') {

	// vars
	$numbers  = [];
	$is_array = is_array($value);

	// loop
	foreach ( (array) $value as $v ) {
		if ( is_numeric($v) ) {
			$numbers[] = (int) $v;
		}
	}

	// bail early if is empty
	if ( empty($numbers) ) {
		return false;
	}

	// convert array
	if ( ! $is_array ) {
		$numbers = $numbers[0];
	}

	// return
	return $numbers;
}

function dt_order_by_search($array, $search) {

	// vars
	$weights = [];
	$needle  = strtolower($search);

	// add key prefix
	foreach ( array_keys($array) as $k ) {
		$array[ '_' . $k ] = dt_extract_var($array, $k);
	}

	// add search weight
	foreach ( $array as $k => $v ) {

		// vars
		$weight   = 0;
		$haystack = strtolower($v);
		$strpos   = strpos($haystack, $needle);

		// detect search match
		if ( $strpos !== false ) {

			// set eright to length of match
			$weight = strlen($search);

			// increase weight if match starts at begining of string
			if ( $strpos == 0 ) {
				++$weight;
			}
		}

		// append to wights
		$weights[ $k ] = $weight;
	}

	// sort the array with menu_order ascending
	array_multisort($weights, SORT_DESC, $array);

	// remove key prefix
	foreach ( array_keys($array) as $k ) {
		$array[ substr($k, 1) ] = dt_extract_var($array, $k);
	}

	// return
	return $array;
}

/**
 * dt_str_exists
 *
 * This function will return true if a sub string is found
 *
 * @since   5.0.0
 *
 * @param   $needle (string)
 * @param   $haystack (string)
 * @return  (boolean)
 */
function dt_str_exists($needle, $haystack) {

	// return true if $haystack contains the $needle
	if ( is_string($haystack) && strpos($haystack, $needle) !== false ) {
		return true;
	}

	// return
	return false;
}

/**
 * dt_encode_choices
 *
 * description
 *
 * @since   5.0.0
 *
 * @param   $post_id (int)
 * @return  $post_id (int)
 */
function dt_encode_choices($array = [], $show_keys = true) {

	// bail early if not array (maybe a single string)
	if ( ! is_array($array) ) {
		return $array;
	}

	// bail early if empty array
	if ( empty($array) ) {
		return '';
	}

	// vars
	$string = '';

	// if allowed to show keys (good for choices, not for default values)
	if ( $show_keys ) {

		// loop
		foreach ( $array as $k => $v ) {

			// ignore if key and value are the same
			if ( strval($k) == strval($v) ) {
				continue;
			}

			// show key in the value
			$array[ $k ] = $k . ' : ' . $v;
		}
	}

	// implode
	$string = implode("\n", $array);

	// return
	return $string;
}

function dt_decode_choices($string = '', $array_keys = false) {

	// bail early if already array
	if ( is_array($string) ) {
		return $string;

		// allow numeric values (same as string)
	} elseif ( is_numeric($string) ) {

		// do nothing
		// bail early if not a string
	} elseif ( ! is_string($string) ) {
		return [];

		// bail early if is empty string
	} elseif ( $string === '' ) {
		return [];
	}

	// vars
	$array = [];

	// explode
	$lines = explode("\n", $string);

	// key => value
	foreach ( $lines as $line ) {

		// vars
		$k = trim($line);
		$v = trim($line);

		// look for ' : '
		if ( dt_str_exists(' : ', $line) ) {
			$line = explode(' : ', $line);

			$k = trim($line[0]);
			$v = trim($line[1]);
		}

		// append
		$array[ $k ] = $v;
	}

	// return only array keys? (good for checkbox default_value)
	if ( $array_keys ) {
		return array_keys($array);
	}

	// return
	return $array;
}

/**
 * dt_str_replace
 *
 * This function will replace an array of strings much like str_replace
 * The difference is the extra logic to avoid replacing a string that has alread been replaced
 * This is very useful for replacing date characters as they overlap with eachother
 *
 * @since   5.3.8
 *
 * @param   $post_id (int)
 * @return  $post_id (int)
 */
function dt_str_replace($string = '', $search_replace = []) {

	// vars
	$ignore = [];

	// remove potential empty search to avoid PHP error
	unset($search_replace['']);

	// loop over conversions
	foreach ( $search_replace as $search => $replace ) {

		// ignore this search, it was a previous replace
		if ( in_array($search, $ignore) ) {
			continue;
		}

		// bail early if subsctring not found
		if ( strpos($string, $search) === false ) {
			continue;
		}

		// replace
		$string = str_replace($search, $replace, $string);

		// append to ignore
		$ignore[] = $replace;
	}

	// return
	return $string;
}

/**
 * date & time formats
 *
 * These settings contain an association of format strings from PHP => JS
 *
 * @since   5.3.8
 *
 * @param   n/a
 * @return  n/a
 */

dt_update_setting(
	'php_to_js_date_formats',
	[

		// Year
		'Y' => 'yy', // Numeric, 4 digits                                1999, 2003
		'y' => 'y',  // Numeric, 2 digits                                99, 03

					// Month
		'm' => 'mm', // Numeric, with leading zeros                      01–12
		'n' => 'm',  // Numeric, without leading zeros                   1–12
		'F' => 'MM', // Textual full                                     January – December
		'M' => 'M',  // Textual three letters                            Jan - Dec

					// Weekday
		'l' => 'DD', // Full name  (lowercase 'L')                       Sunday – Saturday
		'D' => 'D',  // Three letter name                                Mon – Sun

					// Day of Month
		'd' => 'dd', // Numeric, with leading zeros                      01–31
		'j' => 'd',  // Numeric, without leading zeros                   1–31
		'S' => '',   // The English suffix for the day of the month      st, nd or th in the 1st, 2nd or 15th.

	]
);

dt_update_setting(
	'php_to_js_time_formats',
	[

		'a' => 'tt', // Lowercase Ante meridiem and Post meridiem        am or pm
		'A' => 'TT', // Uppercase Ante meridiem and Post meridiem        AM or PM
		'h' => 'hh', // 12-hour format of an hour with leading zeros     01 through 12
		'g' => 'h',  // 12-hour format of an hour without leading zeros  1 through 12
		'H' => 'HH', // 24-hour format of an hour with leading zeros     00 through 23
		'G' => 'H',  // 24-hour format of an hour without leading zeros  0 through 23
		'i' => 'mm', // Minutes with leading zeros                       00 to 59
		's' => 'ss', // Seconds, with leading zeros                      00 through 59

	]
);

/**
 * dt_split_date_time
 *
 * This function will split a format string into seperate date and time
 *
 * @since   5.3.8
 *
 * @param   $date_time (string)
 * @return  $formats (array)
 */
function dt_split_date_time($date_time = '') {

	// vars
	$php_date = dt_get_setting('php_to_js_date_formats');
	$php_time = dt_get_setting('php_to_js_time_formats');
	$chars    = str_split($date_time);
	$type     = 'date';

	// default
	$data = [
		'date' => '',
		'time' => '',
	];

	// loop
	foreach ( $chars as $i => $c ) {

		// find type
		// - allow misc characters to append to previous type
		if ( isset($php_date[ $c ]) ) {
			$type = 'date';
		} elseif ( isset($php_time[ $c ]) ) {
			$type = 'time';
		}

		// append char
		$data[ $type ] .= $c;
	}

	// trim
	$data['date'] = trim($data['date']);
	$data['time'] = trim($data['time']);

	// return
	return $data;
}

/**
 * dt_convert_date_to_php
 *
 * This fucntion converts a date format string from JS to PHP
 *
 * @since   5.0.0
 *
 * @param   $date (string)
 * @return  (string)
 */
function dt_convert_date_to_php($date = '') {

	// vars
	// $php_to_js = dt_get_setting('php_to_js_date_formats');
	// $js_to_php = array_flip($php_to_js);

	// return
	// return dt_str_replace($date, $js_to_php);
}

/**
 * dt_convert_date_to_js
 *
 * This fucntion converts a date format string from PHP to JS
 *
 * @since   5.0.0
 *
 * @param   $date (string)
 * @return  (string)
 */
function dt_convert_date_to_js($date = '') {

	// vars
	$php_to_js = dt_get_setting('php_to_js_date_formats');

	// return
	return dt_str_replace($date, $php_to_js);
}

/**
 * dt_convert_time_to_php
 *
 * This fucntion converts a time format string from JS to PHP
 *
 * @since   5.0.0
 *
 * @param   $time (string)
 * @return  (string)
 */
function dt_convert_time_to_php($time = '') {

	// vars
	// $php_to_js = dt_get_setting('php_to_js_time_formats');
	// $js_to_php = array_flip($php_to_js);

	// return
	// return dt_str_replace($time, $js_to_php);
}

/**
 * dt_convert_time_to_js
 *
 * This fucntion converts a date format string from PHP to JS
 *
 * @since   5.0.0
 *
 * @param   $time (string)
 * @return  (string)
 */
function dt_convert_time_to_js($time = '') {

	// vars
	$php_to_js = dt_get_setting('php_to_js_time_formats');

	// return
	return dt_str_replace($time, $php_to_js);
}

// STOPPED HERE

/**
 * dt_update_user_setting
 *
 * description
 *
 * @since   5.0.0
 *
 * @param   $post_id (int)
 * @return  $post_id (int)
 */
function dt_update_user_setting($name, $value) {

	// get current user id
	$user_id = get_current_user_id();

	// get user settings
	$settings = get_user_meta($user_id, 'dt_user_settings', true);

	// ensure array
	$settings = dt_get_array($settings);

	// delete setting (allow 0 to save)
	// if ( dt_is_empty( $value ) ) {
	//  unset( $settings[ $name ] );

	//  // append setting
	// } else {
	//  $settings[ $name ] = $value;
	// }

	// update user data
	return update_metadata('user', $user_id, 'dt_user_settings', $settings);
}

/**
 * dt_get_user_setting
 *
 * description
 *
 * @since   5.0.0
 *
 * @param   $post_id (int)
 * @return  $post_id (int)
 */
function dt_get_user_setting($name = '', $default = false) {

	// get current user id
	$user_id = get_current_user_id();

	// get user settings
	$settings = get_user_meta($user_id, 'dt_user_settings', true);

	// ensure array
	$settings = dt_get_array($settings);

	// bail arly if no settings
	if ( ! isset($settings[ $name ]) ) {
		return $default;
	}

	// return
	return $settings[ $name ];
}

/**
 * dt_in_array
 *
 * description
 *
 * @since   5.0.0
 *
 * @param   $post_id (int)
 * @return  $post_id (int)
 */
function dt_in_array($value = '', $array = false) {

	// bail early if not array
	if ( ! is_array($array) ) {
		return false;
	}

	// find value in array
	return in_array($value, $array);
}

/**
 * This function will walk through the $_FILES data and upload each found.
 *
 * @since   5.0.9
 *
 * @param array $ancestors An internal parameter, not required.
 */
function dt_upload_files($ancestors = []) {

	if ( empty($_FILES['dt']) ) {
		return;
	}

	// $file = dt_sanitize_files_array( $_FILES['dt'] ); // phpcs:disable WordPress.Security.NonceVerification.Missing -- Verified upstream.

	// walk through ancestors.
	if ( ! empty($ancestors) ) {
		foreach ( $ancestors as $a ) {
			foreach ( array_keys($file) as $k ) {
				$file[ $k ] = $file[ $k ][ $a ];
			}
		}
	}

	// is array?
	if ( is_array($file['name']) ) {
		foreach ( array_keys($file['name']) as $k ) {
			$_ancestors = array_merge($ancestors, [ $k ]);

			dt_upload_files($_ancestors);
		}

		return;
	}

	// Bail early if file has error (no file uploaded).
	if ( $file['error'] ) {
		return;
	}

	$field_key  = end($ancestors);
	$nonce_name = $field_key . '_file_nonce';

	if ( empty($_REQUEST['dt'][ $nonce_name ]) || ! wp_verify_nonce(sanitize_text_field($_REQUEST['dt'][ $nonce_name ]), 'dt/file_uploader_nonce/' . $field_key) ) {
		return;
	}

	// Assign global _dtuploader for media validation.
	$_POST['_dtuploader'] = $field_key;

	// file found!
	$attachment_id = dt_upload_file($file);

	// update $_POST
	array_unshift($ancestors, 'dt');
	dt_update_nested_array($_POST, $ancestors, $attachment_id);
}

/**
 * dt_upload_file
 *
 * This function will uploade a $_FILE
 *
 * @since   5.0.9
 *
 * @param   $uploaded_file (array) array found from $_FILE data
 * @return  $id (int) new attachment ID
 */
function dt_upload_file($uploaded_file) {

															// required
															// require_once( ABSPATH . "/wp-load.php" ); // WP should already be loaded
	require_once ABSPATH . '/wp-admin/includes/media.php'; // video functions
	require_once ABSPATH . '/wp-admin/includes/file.php';
	require_once ABSPATH . '/wp-admin/includes/image.php';

	// required for wp_handle_upload() to upload the file
	$upload_overrides = [ 'test_form' => false ];

	// upload
	$file = wp_handle_upload($uploaded_file, $upload_overrides);

	// bail early if upload failed
	if ( isset($file['error']) ) {
		return $file['error'];
	}

	// vars
	$url      = $file['url'];
	$type     = $file['type'];
	$file     = $file['file'];
	$filename = basename($file);

	// Construct the object array
	$object = [
		'post_title'     => $filename,
		'post_mime_type' => $type,
		'guid'           => $url,
	];

	// Save the data
	$id = wp_insert_attachment($object, $file);

	// Add the meta-data
	wp_update_attachment_metadata($id, wp_generate_attachment_metadata($id, $file));

	/** This action is documented in wp-admin/custom-header.php */
	do_action('wp_create_file_in_uploads', $file, $id); // For replication

	// return new ID
	return $id;
}

/**
 * dt_update_nested_array
 *
 * This function will update a nested array value. Useful for modifying the $_POST array
 *
 * @since   5.0.9
 *
 * @param   $array (array) target array to be updated
 * @param   $ancestors (array) array of keys to navigate through to find the child
 * @param   $value (mixed) The new value
 * @return  (boolean)
 */
function dt_update_nested_array(&$array, $ancestors, $value) {

	// if no more ancestors, update the current var
	if ( empty($ancestors) ) {
		$array = $value;

		// return
		return true;
	}

	// shift the next ancestor from the array
	$k = array_shift($ancestors);

	// if exists
	if ( isset($array[ $k ]) ) {
		return dt_update_nested_array($array[ $k ], $ancestors, $value);
	}

	// return
	return false;
}

/**
 * dt_is_screen
 *
 * This function will return true if all args are matched for the current screen
 *
 * @since   5.1.5
 *
 * @param   $post_id (int)
 * @return  $post_id (int)
 */
function dt_is_screen($id = '') {

	// bail early if not defined
	if ( ! function_exists('get_current_screen') ) {
		return false;
	}

	// vars
	$current_screen = get_current_screen();

	// no screen
	if ( ! $current_screen ) {
		return false;

		// array
	} elseif ( is_array($id) ) {
		return in_array($current_screen->id, $id);

		// string
	} else {
		return ( $id === $current_screen->id );
	}
}

/**
 * Check if we're in an DT admin screen
 *
 * @since  6.2.2
 *
 * @return boolean Returns true if the current screen is an DT admin screen.
 */
function dt_is_dt_admin_screen() {
	if ( ! is_admin() || ! function_exists('get_current_screen') ) {
		return false;
	}
	$screen = get_current_screen();
	if ( $screen && ! empty($screen->post_type) && substr($screen->post_type, 0, 4) === 'dt-' ) {
		return true;
	}

	return false;
}

/**
 * dt_maybe_get
 *
 * This function will return a var if it exists in an array
 *
 * @since   5.1.5
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

/**
 * Returns an array of attachment data.
 *
 * @since   5.1.5
 *
 * @param   integer|WP_Post The attachment ID or object
 * @return  array|false
 */
function dt_get_attachment($attachment) {

	// Allow filter to short-circuit load attachment logic.
	// Alternatively, this filter may be used to switch blogs for multisite media functionality.
	$response = apply_filters('dt/pre_load_attachment', null, $attachment);
	if ( $response !== null ) {
		return $response;
	}

	// Get the attachment post object.
	$attachment = get_post($attachment);
	if ( ! $attachment ) {
		return false;
	}
	if ( $attachment->post_type !== 'attachment' ) {
		return false;
	}

	// Load various attachment details.
	$meta          = wp_get_attachment_metadata($attachment->ID);
	$attached_file = get_attached_file($attachment->ID);
	if ( strpos($attachment->post_mime_type, '/') !== false ) {
		list($type, $subtype) = explode('/', $attachment->post_mime_type);
	} else {
		list($type, $subtype) = [ $attachment->post_mime_type, '' ];
	}

	// Generate response.
	$response = [
		'ID'          => $attachment->ID,
		'id'          => $attachment->ID,
		'title'       => $attachment->post_title,
		'filename'    => wp_basename($attached_file),
		'filesize'    => 0,
		'url'         => wp_get_attachment_url($attachment->ID),
		'link'        => get_attachment_link($attachment->ID),
		'alt'         => get_post_meta($attachment->ID, '_wp_attachment_image_alt', true),
		'author'      => $attachment->post_author,
		'description' => $attachment->post_content,
		'caption'     => $attachment->post_excerpt,
		'name'        => $attachment->post_name,
		'status'      => $attachment->post_status,
		'uploaded_to' => $attachment->post_parent,
		'date'        => $attachment->post_date_gmt,
		'modified'    => $attachment->post_modified_gmt,
		'menu_order'  => $attachment->menu_order,
		'mime_type'   => $attachment->post_mime_type,
		'type'        => $type,
		'subtype'     => $subtype,
		'icon'        => wp_mime_type_icon($attachment->ID),
	];

	// Append filesize data.
	if ( isset($meta['filesize']) ) {
		$response['filesize'] = $meta['filesize'];
	} else {
		/**
		 * Allows shortcutting our DT's `filesize` call to prevent us making filesystem calls.
		 * Mostly useful for third party plugins which may offload media to other services, and filesize calls will induce a remote download.
		 *
		 * @since 6.2.2
		 *
		 * @param int|null The default filesize.
		 * @param WP_Post $attachment The attachment post object we're looking for the filesize for.
		 */
		$shortcut_filesize = apply_filters('dt/filesize', null, $attachment);
		if ( $shortcut_filesize ) {
			$response['filesize'] = intval($shortcut_filesize);
		} elseif ( file_exists($attached_file) ) {
			$response['filesize'] = filesize($attached_file);
		}
	}

	// Restrict the loading of image "sizes".
	$sizes_id = 0;

	// Type specific logic.
	switch ( $type ) {
		case 'image':
			$sizes_id = $attachment->ID;
			$src      = wp_get_attachment_image_src($attachment->ID, 'full');
			if ( $src ) {
				$response['url']    = $src[0];
				$response['width']  = $src[1];
				$response['height'] = $src[2];
			}
			break;
		case 'video':
			$response['width']  = dt_maybe_get($meta, 'width', 0);
			$response['height'] = dt_maybe_get($meta, 'height', 0);
			if ( $featured_id = get_post_thumbnail_id($attachment->ID) ) {
				$sizes_id = $featured_id;
			}
			break;
		case 'audio':
			if ( $featured_id = get_post_thumbnail_id($attachment->ID) ) {
				$sizes_id = $featured_id;
			}
			break;
	}

	// Load array of image sizes.
	if ( $sizes_id ) {
		$sizes      = get_intermediate_image_sizes();
		$sizes_data = [];
		foreach ( $sizes as $size ) {
			$src = wp_get_attachment_image_src($sizes_id, $size);
			if ( $src ) {
				$sizes_data[ $size ]             = $src[0];
				$sizes_data[ $size . '-width' ]  = $src[1];
				$sizes_data[ $size . '-height' ] = $src[2];
			}
		}
		$response['sizes'] = $sizes_data;
	}

	/**
	 * Filters the attachment $response after it has been loaded.
	 *
	 * @since   5.9.0
	 *
	 * @param   array $response Array of loaded attachment data.
	 * @param   WP_Post $attachment Attachment object.
	 * @param   array|false $meta Array of attachment meta data, or false if there is none.
	 */
	return apply_filters('dt/load_attachment', $response, $attachment, $meta);
}

/**
 * This function will truncate and return a string
 *
 * @since   5.0.0
 *
 * @param string  $text   The text to truncate.
 * @param integer $length The number of characters to allow in the string.
 *
 * @return  string
 */
function dt_get_truncated($text, $length = 64) {
	$text       = trim($text);
	$the_length = function_exists('mb_strlen') ? mb_strlen($text) : strlen($text);

	$cut_length = $length - 3;
	$return     = function_exists('mb_substr') ? mb_substr($text, 0, $cut_length) : substr($text, 0, $cut_length);

	if ( $the_length > $cut_length ) {
		$return .= '...';
	}

	return $return;
}

/**
 * dt_current_user_can_admin
 *
 * This function will return true if the current user can administrate the DT field groups
 *
 * @since   5.1.5
 *
 * @param   $post_id (int)
 * @return  $post_id (int)
 */
function dt_current_user_can_admin() {

	if ( dt_get_setting('show_admin') && current_user_can(dt_get_setting('capability')) ) {
		return true;
	}

	// return
	return false;
}

/**
 * Wrapper function for current_user_can( 'edit_post', $post_id ).
 *
 * @since 6.3.4
 *
 * @param integer $post_id The post ID to check.
 * @return boolean
 */
function dt_current_user_can_edit_post(int $post_id): bool {
	/**
	 * The `edit_post` capability is a meta capability, which
	 * gets converted to the correct post type object `edit_post`
	 * equivalent.
	 *
	 * If the post type does not have `map_meta_cap` enabled and the user is
	 * not manually mapping the `edit_post` capability, this will fail
	 * unless the role has the `edit_post` capability added to a user/role.
	 *
	 * However, more (core) stuff will likely break in this scenario.
	 */
	$user_can_edit = current_user_can('edit_post', $post_id);

	return (bool) apply_filters('dt/current_user_can_edit_post', $user_can_edit, $post_id);
}

/**
 * dt_get_filesize
 *
 * This function will return a numeric value of bytes for a given filesize string
 *
 * @since   5.1.5
 *
 * @param   $size (mixed)
 * @return  (int)
 */
function dt_get_filesize($size = 1) {

	// vars
	$unit  = 'MB';
	$units = [
		'TB' => 4,
		'GB' => 3,
		'MB' => 2,
		'KB' => 1,
	];

	// look for $unit within the $size parameter (123 KB)
	if ( is_string($size) ) {

		// vars
		$custom = strtoupper(substr($size, -2));

		foreach ( $units as $k => $v ) {
			if ( $custom === $k ) {
				$unit = $k;
				$size = substr($size, 0, -2);
			}
		}
	}

	// calc bytes
	$bytes = floatval($size) * pow(1024, $units[ $unit ]);

	// return
	return $bytes;
}

/**
 * dt_format_filesize
 *
 * This function will return a formatted string containing the filesize and unit
 *
 * @since   5.1.5
 *
 * @param   $size (mixed)
 * @return  (int)
 */
function dt_format_filesize($size = 1) {

	// convert
	$bytes = dt_get_filesize($size);

	// vars
	$units = [
		'TB' => 4,
		'GB' => 3,
		'MB' => 2,
		'KB' => 1,
	];

	// loop through units
	foreach ( $units as $k => $v ) {
		$result = $bytes / pow(1024, $v);

		if ( $result >= 1 ) {
			return $result . ' ' . $k;
		}
	}

	// return
	return $bytes . ' B';
}

/**
 * dt_validate_attachment
 *
 * This function will validate an attachment based on a field's restrictions and return an array of errors
 *
 * @since   5.2.3
 *
 * @param   $attachment (array) attachment data. Changes based on context
 * @param   $field (array) field settings containing restrictions
 * @param   context (string)                                     $file is different when uploading / preparing
 * @return  $errors (array)
 */
function dt_validate_attachment($attachment, $field, $context = 'prepare') {

	// vars
	$errors = [];
	$file   = [
		'type'   => '',
		'width'  => 0,
		'height' => 0,
		'size'   => 0,
	];

	// upload
	if ( $context == 'upload' ) {

		// vars
		$file['type'] = pathinfo($attachment['name'], PATHINFO_EXTENSION);
		$file['size'] = filesize($attachment['tmp_name']);

		if ( strpos($attachment['type'], 'image') !== false ) {
			$size             = getimagesize($attachment['tmp_name']);
			$file['width']  = dt_maybe_get($size, 0);
			$file['height'] = dt_maybe_get($size, 1);
		}

		// prepare
	} elseif ( $context == 'prepare' ) {
		$use_path         = isset($attachment['filename']) ? $attachment['filename'] : $attachment['url'];
		$file['type']   = pathinfo($use_path, PATHINFO_EXTENSION);
		$file['size']   = dt_maybe_get($attachment, 'filesizeInBytes', 0);
		$file['width']  = dt_maybe_get($attachment, 'width', 0);
		$file['height'] = dt_maybe_get($attachment, 'height', 0);

		// custom
	} else {
		$file           = array_merge($file, $attachment);
		$use_path       = isset($attachment['filename']) ? $attachment['filename'] : $attachment['url'];
		$file['type'] = pathinfo($use_path, PATHINFO_EXTENSION);
	}

	// image
	if ( $file['width'] || $file['height'] ) {

		// width
		$min_width = (int) dt_maybe_get($field, 'min_width', 0);
		$max_width = (int) dt_maybe_get($field, 'max_width', 0);

		if ( $file['width'] ) {
			if ( $min_width && $file['width'] < $min_width ) {

				// min width
				$errors['min_width'] = sprintf(__('Image width must be at least %dpx.', 'dt'), $min_width);
			} elseif ( $max_width && $file['width'] > $max_width ) {

				// min width
				$errors['max_width'] = sprintf(__('Image width must not exceed %dpx.', 'dt'), $max_width);
			}
		}

		// height
		$min_height = (int) dt_maybe_get($field, 'min_height', 0);
		$max_height = (int) dt_maybe_get($field, 'max_height', 0);

		if ( $file['height'] ) {
			if ( $min_height && $file['height'] < $min_height ) {

				// min height
				$errors['min_height'] = sprintf(__('Image height must be at least %dpx.', 'dt'), $min_height);
			} elseif ( $max_height && $file['height'] > $max_height ) {

				// min height
				$errors['max_height'] = sprintf(__('Image height must not exceed %dpx.', 'dt'), $max_height);
			}
		}
	}

	// file size
	if ( $file['size'] ) {
		$min_size = dt_maybe_get($field, 'min_size', 0);
		$max_size = dt_maybe_get($field, 'max_size', 0);

		if ( $min_size && $file['size'] < dt_get_filesize($min_size) ) {

			// min width
			$errors['min_size'] = sprintf(__('File size must be at least %s.', 'dt'), dt_format_filesize($min_size));
		} elseif ( $max_size && $file['size'] > dt_get_filesize($max_size) ) {

			// min width
			$errors['max_size'] = sprintf(__('File size must not exceed %s.', 'dt'), dt_format_filesize($max_size));
		}
	}

	// file type
	if ( $file['type'] ) {
		// $mime_types = dt_maybe_get( $field, 'mime_types', '' );

		// lower case
		$file['type'] = strtolower($file['type']);
		// $mime_types   = strtolower( $mime_types );

		// explode
		$mime_types = str_replace([ ' ', '.' ], '', $mime_types);
		$mime_types = explode(',', $mime_types); // split pieces
		$mime_types = array_filter($mime_types); // remove empty pieces

		if ( ! empty($mime_types) && ! in_array($file['type'], $mime_types) ) {

			// glue together last 2 types
			if ( count($mime_types) > 1 ) {
				$last1 = array_pop($mime_types);
				$last2 = array_pop($mime_types);

				$mime_types[] = $last2 . ' ' . __('or', 'dt') . ' ' . $last1;
			}

			$errors['mime_types'] = sprintf(__('File type must be %s.', 'dt'), implode(', ', $mime_types));
		}
	}

	/**
	 * Filters the errors for a file before it is uploaded or displayed in the media modal.
	 *
	 * @since   5.2.3
	 *
	 * @param   array $errors An array of errors.
	 * @param   array $file An array of data for a single file.
	 * @param   array $attachment An array of attachment data which differs based on the context.
	 * @param   array $field The field array.
	 * @param   string $context The curent context (uploading, preparing)
	 */
	$errors = apply_filters("dt/validate_attachment/type={$field[ 'type' ]}", $errors, $file, $attachment, $field, $context);
	$errors = apply_filters("dt/validate_attachment/name={$field[ '_name' ]}", $errors, $file, $attachment, $field, $context);
	$errors = apply_filters("dt/validate_attachment/key={$field[ 'key' ]}", $errors, $file, $attachment, $field, $context);
	$errors = apply_filters('dt/validate_attachment', $errors, $file, $attachment, $field, $context);

	// return
	return $errors;
}

/**
 * _dt_settings_uploader
 *
 * Dynamic logic for uploader setting
 *
 * @since   5.2.3
 *
 * @param   $uploader (string)
 * @return  $uploader
 */

add_filter('dt/settings/uploader', '_dt_settings_uploader');

function _dt_settings_uploader($uploader) {

	// if can't upload files
	if ( ! current_user_can('upload_files') ) {
		$uploader = 'basic';
	}

	// return
	return $uploader;
}

/**
 * dt_translate
 *
 * This function will translate a string using the new 'l10n_textdomain' setting
 * Also works for arrays which is great for fields - select -> choices
 *
 * @since   5.3.2
 *
 * @param   $string (mixed) string or array containins strings to be translated
 * @return  $string
 */
function dt_translate($string) {

	// vars
	$l10n       = dt_get_setting('l10n');
	$textdomain = dt_get_setting('l10n_textdomain');

	// bail early if not enabled
	if ( ! $l10n ) {
		return $string;
	}

	// bail early if no textdomain
	if ( ! $textdomain ) {
		return $string;
	}

	// is array
	if ( is_array($string) ) {
		return array_map('dt_translate', $string);
	}

	// bail early if not string
	if ( ! is_string($string) ) {
		return $string;
	}

	// bail early if empty
	if ( $string === '' ) {
		return $string;
	}

	// allow for var_export export
	if ( dt_get_setting('l10n_var_export') ) {

		// bail early if already translated
		if ( substr($string, 0, 7) === '!!__(!!' ) {
			return $string;
		}

		// return
		return "!!__(!!'" . $string . "!!', !!'" . $textdomain . "!!')!!";
	}

	// vars
	return __($string, $textdomain);
}

/**
 * dt_maybe_add_action
 *
 * This function will determine if the action has already run before adding / calling the function
 *
 * @since   5.3.2
 *
 * @param   $post_id (int)
 * @return  $post_id (int)
 */
function dt_maybe_add_action($tag, $function_to_add, $priority = 10, $accepted_args = 1) {

	// if action has already run, execute it
	// - if currently doing action, allow $tag to be added as per usual to allow $priority ordering needed for 3rd party asset compatibility
	if ( did_action($tag) && ! doing_action($tag) ) {
		call_user_func($function_to_add);

		// if action has not yet run, add it
	} else {
		add_action($tag, $function_to_add, $priority, $accepted_args);
	}
}

/**
 * dt_is_row_collapsed
 *
 * This function will return true if the field's row is collapsed
 *
 * @since   5.3.2
 *
 * @param   $post_id (int)
 * @return  $post_id (int)
 */
function dt_is_row_collapsed($field_key = '', $row_index = 0) {

	// collapsed
	$collapsed = dt_get_user_setting('collapsed_' . $field_key, '');

	// cookie fallback ( version < 5.3.2 )
	if ( $collapsed === '' ) {
		$collapsed = dt_extract_var($_COOKIE, "dt_collapsed_{$field_key}", '');
		$collapsed = str_replace('|', ',', $collapsed);

		// update
		dt_update_user_setting('collapsed_' . $field_key, $collapsed);
	}

	// explode
	$collapsed = explode(',', $collapsed);
	$collapsed = array_filter($collapsed, 'is_numeric');

	// collapsed class
	return in_array($row_index, $collapsed);
}

/**
 * Return an image tag for the provided attachment ID
 *
 * @since 5.5.0
 * @deprecated 6.3.2
 *
 * @param integer $attachment_id The attachment ID
 * @param string  $size          The image size to use in the image tag.
 * @return false
 */
function dt_get_attachment_image($attachment_id = 0, $size = 'thumbnail') {
	// report function as deprecated
	_deprecated_function(__FUNCTION__, '6.3.2');
	return false;
}

/**
 * dt_get_browser
 *
 * Returns the name of the current browser.
 *
 * @since   5.0.0
 *
 * @param   void
 * @return  string
 */
function dt_get_browser() {

	// Check server var.
	if ( isset($_SERVER['HTTP_USER_AGENT']) ) {
		$agent = sanitize_text_field($_SERVER['HTTP_USER_AGENT']);

		// Loop over search terms.
		$browsers = [
			'Firefox' => 'firefox',
			'Trident' => 'msie',
			'MSIE'    => 'msie',
			'Edge'    => 'edge',
			'Chrome'  => 'chrome',
			'Safari'  => 'safari',
		];
		foreach ( $browsers as $k => $v ) {
			if ( strpos($agent, $k) !== false ) {
				return $v;
			}
		}
	}

	// Return default.
	return '';
}

/**
 * dt_is_ajax
 *
 * This function will reutrn true if performing a wp ajax call
 *
 * @since   5.3.8
 *
 * @param   n/a
 * @return  (boolean)
 */
function dt_is_ajax($action = '') {

	// vars
	$is_ajax = false;

	// check if is doing ajax
	if ( defined('DOING_AJAX') && DOING_AJAX ) {
		$is_ajax = true;
	}

    // phpcs:disable WordPress.Security.NonceVerification.Missing
	// check $action
	if ( $action && dt_maybe_get($_POST, 'action') !== $action ) {
        // phpcs:enable WordPress.Security.NonceVerification.Missing
		$is_ajax = false;
	}

	// return
	return $is_ajax;
}

/**
 * Returns a date value in a formatted string.
 *
 * @since 5.3.8
 *
 * @param string $value  The date value to format.
 * @param string $format The format to use.
 * @return string
 */
function dt_format_date($value, $format) {
	// Bail early if no value or value is not what we expect.
	if ( ! $value || ( ! is_string($value) && ! is_int($value) ) ) {
		return $value;
	}

	// Numeric (either unix or YYYYMMDD).
	if ( is_numeric($value) && strlen($value) !== 8 ) {
		$unixtimestamp = $value;
	} else {
		$unixtimestamp = strtotime($value);
	}

	return date_i18n($format, $unixtimestamp);
}

/**
 * Previously, deletes the debug.log file.
 *
 * @since      5.7.10
 * @deprecated 6.2.7
 */
function dt_clear_log() {
	_deprecated_function(__FUNCTION__, '6.2.7');
	return false;
}

/**
 * dt_log
 *
 * description
 *
 * @since   5.3.8
 *
 * @param   $post_id (int)
 * @return  $post_id (int)
 */
function dt_log() {

	// vars
	$args = func_get_args();

	// loop
	foreach ( $args as $i => $arg ) {

		// array | object
		if ( is_array($arg) || is_object($arg) ) {
			$arg = print_r($arg, true);

			// bool
		} elseif ( is_bool($arg) ) {
			$arg = 'bool(' . ( $arg ? 'true' : 'false' ) . ')';
		}

		// update
		$args[ $i ] = $arg;
	}

	// log
	error_log(implode(' ', $args));
}

/**
 * dt_dev_log
 *
 * Used to log variables only if DT_DEV is defined
 *
 * @since   5.7.4
 *
 * @param   mixed
 * @return  void
 */
// function dt_dev_log() {
//  if ( defined( 'DT_DEV' ) && DT_DEV ) {
//      call_user_func_array( 'dt_log', func_get_args() );
//  }
// }

/**
 * dt_doing
 *
 * This function will tell DT what task it is doing
 *
 * @since   5.3.8
 *
 * @param   $event (string)
 * @param   context (string)
 * @return  n/a
 */
function dt_doing($event = '', $context = '') {

	dt_update_setting('doing', $event);
	dt_update_setting('doing_context', $context);
}

/**
 * dt_is_doing
 *
 * This function can be used to state what DT is doing, or to check
 *
 * @since   5.3.8
 *
 * @param   $event (string)
 * @param   context (string)
 * @return  (boolean)
 */
function dt_is_doing($event = '', $context = '') {

	// vars
	$doing = false;

	// task
	if ( dt_get_setting('doing') === $event ) {
		$doing = true;
	}

	// context
	if ( $context && dt_get_setting('doing_context') !== $context ) {
		$doing = false;
	}

	// return
	return $doing;
}

/**
 * dt_is_plugin_active
 *
 * This function will return true if the DT plugin is active
 * - May be included within a theme or other plugin
 *
 * @since   5.4.0
 *
 * @param   $basename (int)
 * @return  $post_id (int)
 */
function dt_is_plugin_active() {

	// vars
	$basename = dt_get_setting('basename');

	// ensure is_plugin_active() exists (not on frontend)
	if ( ! function_exists('is_plugin_active') ) {
		include_once ABSPATH . 'wp-admin/includes/plugin.php';
	}

	// return
	return is_plugin_active($basename);
}

/**
 * dt_send_ajax_results
 *
 * This function will print JSON data for a Select2 AJAX query
 *
 * @since   5.4.0
 *
 * @param   $response (array)
 * @return  n/a
 */
function dt_send_ajax_results($response) {

	// validate
	$response = wp_parse_args(
		$response,
		[
			'results' => [],
			'more'    => false,
			'limit'   => 0,
		]
	);

	// limit
	if ( $response['limit'] && $response['results'] ) {

		// vars
		$total = 0;

		foreach ( $response['results'] as $result ) {

			// parent
			++$total;

			// children
			if ( ! empty($result['children']) ) {
				$total += count($result['children']);
			}
		}

		// calc
		if ( $total >= $response['limit'] ) {
			$response['more'] = true;
		}
	}

	// return
	wp_send_json($response);
}

/**
 * dt_is_sequential_array
 *
 * This function will return true if the array contains only numeric keys
 *
 * @source  http://stackoverflow.com/questions/173400/how-to-check-if-php-array-is-associative-or-sequential
 *
 * @since   5.4.0
 *
 * @param   $array (array)
 * @return  (boolean)
 */
function dt_is_sequential_array($array) {

	// bail early if not array
	if ( ! is_array($array) ) {
		return false;
	}

	// loop
	foreach ( $array as $key => $value ) {

		// bail early if is string
		if ( is_string($key) ) {
			return false;
		}
	}

	// return
	return true;
}

/**
 * dt_is_associative_array
 *
 * This function will return true if the array contains one or more string keys
 *
 * @source  http://stackoverflow.com/questions/173400/how-to-check-if-php-array-is-associative-or-sequential
 *
 * @since   5.4.0
 *
 * @param   $array (array)
 * @return  (boolean)
 */
function dt_is_associative_array($array) {

	// bail early if not array
	if ( ! is_array($array) ) {
		return false;
	}

	// loop
	foreach ( $array as $key => $value ) {

		// bail early if is string
		if ( is_string($key) ) {
			return true;
		}
	}

	// return
	return false;
}

/**
 * dt_add_array_key_prefix
 *
 * This function will add a prefix to all array keys
 * Useful to preserve numeric keys when performing array_multisort
 *
 * @since   5.4.0
 *
 * @param   $array (array)
 * @param   $prefix (string)
 * @return  (array)
 */
function dt_add_array_key_prefix($array, $prefix) {

	// vars
	$array2 = [];

	// loop
	foreach ( $array as $k => $v ) {
		$k2            = $prefix . $k;
		$array2[ $k2 ] = $v;
	}

	// return
	return $array2;
}

/**
 * dt_remove_array_key_prefix
 *
 * This function will remove a prefix to all array keys
 * Useful to preserve numeric keys when performing array_multisort
 *
 * @since   5.4.0
 *
 * @param   $array (array)
 * @param   $prefix (string)
 * @return  (array)
 */
function dt_remove_array_key_prefix($array, $prefix) {

	// vars
	$array2 = [];
	$l      = strlen($prefix);

	// loop
	foreach ( $array as $k => $v ) {
		$k2            = ( substr($k, 0, $l) === $prefix ) ? substr($k, $l) : $k;
		$array2[ $k2 ] = $v;
	}

	// return
	return $array2;
}

/**
 * This function will remove the proticol from a url
 * Used to allow licenses to remain active if a site is switched to https
 *
 * @since   5.5.4
 *
 * @param   string $url The URL to strip the protocol from.
 * @return  string
 */
function dt_strip_protocol($url) {

	// strip the protocol
	return str_replace([ 'http://', 'https://' ], '', $url);
}

/**
 * dt_encrypt
 *
 * This function will encrypt a string using PHP
 * https://bhoover.com/using-php-openssl_encrypt-openssl_decrypt-encrypt-decrypt-data/
 *
 * @since   5.5.8
 *
 * @param   $data (string)
 * @return  (string)
 */
function dt_encrypt($data = '') {

	// bail early if no encrypt function
	if ( ! function_exists('openssl_encrypt') ) {
		return base64_encode($data);
	}

	// generate a key
	$key = wp_hash('dt_encrypt');

	// Generate an initialization vector
	$iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-cbc'));

	// Encrypt the data using AES 256 encryption in CBC mode using our encryption key and initialization vector.
	$encrypted_data = openssl_encrypt($data, 'aes-256-cbc', $key, 0, $iv);

	// The $iv is just as important as the key for decrypting, so save it with our encrypted data using a unique separator (::)
	return base64_encode($encrypted_data . '::' . $iv);
}

/**
 * dt_decrypt
 *
 * This function will decrypt an encrypted string using PHP
 * https://bhoover.com/using-php-openssl_encrypt-openssl_decrypt-encrypt-decrypt-data/
 *
 * @since   5.5.8
 *
 * @param   $data (string)
 * @return  (string)
 */
function dt_decrypt($data = '') {

	// bail early if no decrypt function
	if ( ! function_exists('openssl_decrypt') ) {
		return base64_decode($data);
	}

	// generate a key
	$key = wp_hash('dt_encrypt');

	// To decrypt, split the encrypted data from our IV - our unique separator used was "::"
	list($encrypted_data, $iv) = explode('::', base64_decode($data), 2);

	// decrypt
	return openssl_decrypt($encrypted_data, 'aes-256-cbc', $key, 0, $iv);
}

/**
 * dt_parse_markdown
 *
 * A very basic regex-based Markdown parser function based off [slimdown](https://gist.github.com/jbroadway/2836900).
 *
 * @since   5.7.2
 *
 * @param   string $text The string to parse.
 * @return  string
 */
function dt_parse_markdown($text = '') {

	// trim
	$text = trim($text);

	// rules
	$rules = [
		'/=== (.+?) ===/'            => '<h2>$1</h2>',                  // headings
		'/== (.+?) ==/'              => '<h3>$1</h3>',                  // headings
		'/= (.+?) =/'                => '<h4>$1</h4>',                  // headings
		'/\[([^\[]+)\]\(([^\)]+)\)/' => '<a href="$2">$1</a>',          // links
		'/(\*\*)(.*?)\1/'            => '<strong>$2</strong>',          // bold
		'/(\*)(.*?)\1/'              => '<em>$2</em>',                  // intalic
		'/`(.*?)`/'                  => '<code>$1</code>',              // inline code
		'/\n\*(.*)/'                 => "\n<ul>\n\t<li>$1</li>\n</ul>", // ul lists
		'/\n[0-9]+\.(.*)/'           => "\n<ol>\n\t<li>$1</li>\n</ol>", // ol lists
		'/<\/ul>\s?<ul>/'            => '',                             // fix extra ul
		'/<\/ol>\s?<ol>/'            => '',                             // fix extra ol
	];
	foreach ( $rules as $k => $v ) {
		$text = preg_replace($k, $v, $text);
	}

	// autop
	$text = wpautop($text);

	// return
	return $text;
}

/**
 * dt_get_sites
 *
 * Returns an array of sites for a network.
 *
 * @since   5.4.0
 *
 * @param   void
 * @return  array
 */
function dt_get_sites() {
	$results = [];
	$sites   = get_sites([ 'number' => 0 ]);
	if ( $sites ) {
		foreach ( $sites as $site ) {
			$results[] = get_site($site)->to_array();
		}
	}
	return $results;
}

/**
 * dt_register_ajax
 *
 * Regsiters an ajax callback.
 *
 * @since   5.7.7
 *
 * @param   string  $name     The ajax action name.
 * @param   array   $callback The callback function or array.
 * @param   boolean $public   Whether to allow access to non logged in users.
 * @return  void
 */
function dt_register_ajax($name = '', $callback = false, $public = false) {

	// vars
	$action = "dt/ajax/$name";

	// add action for logged-in users
	add_action("wp_ajax_$action", $callback);

	// add action for non logged-in users
	if ( $public ) {
		add_action("wp_ajax_nopriv_$action", $callback);
	}
}

/**
 * dt_str_camel_case
 *
 * Converts a string into camelCase.
 * Thanks to https://stackoverflow.com/questions/31274782/convert-array-keys-from-underscore-case-to-camelcase-recursively
 *
 * @since   5.8.0
 *
 * @param   string $string The string ot convert.
 * @return  string
 */
function dt_str_camel_case($string = '') {
	return lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $string))));
}

/**
 * dt_array_camel_case
 *
 * Converts all aray keys to camelCase.
 *
 * @since   5.8.0
 *
 * @param   array $array The array to convert.
 * @return  array
 */
function dt_array_camel_case($array = []) {
	$array2 = [];
	foreach ( $array as $k => $v ) {
		$array2[ dt_str_camel_case($k) ] = $v;
	}
	return $array2;
}

/**
 * Returns true if the current screen is using the block editor.
 *
 * @since 5.8.0
 *
 * @return boolean
 */
function dt_is_block_editor() {
	if ( function_exists('get_current_screen') ) {
		$screen = get_current_screen();
		if ( $screen && method_exists($screen, 'is_block_editor') ) {
			return $screen->is_block_editor();
		}
	}
	return false;
}

/**
 * Detect if we're on a multisite subsite.
 *
 * @since 6.2.4
 *
 * @return boolean true if we're in a multisite install and not on the main site
 */
function dt_is_multisite_sub_site() {
	if ( is_multisite() && ! is_main_site() ) {
		return true;
	}
	return false;
}

/**
 * Detect if we're on a multisite main site.
 *
 * @since 6.2.4
 *
 * @return boolean true if we're in a multisite install and on the main site
 */
function dt_is_multisite_main_site() {
	if ( is_multisite() && is_main_site() ) {
		return true;
	}
	return false;
}

/**
 * Allow filterable permissions metabox callbacks.
 *
 * @since   6.3.10
 *
 * @param   boolean $enable_meta_box_cb_edit Can the current user edit metabox callbacks.
 * @return  boolean
 */
// function dt_settings_enable_meta_box_cb_edit( $enable_meta_box_cb_edit ): bool {
//  if ( ! is_super_admin() ) {
//      return false;
//  }

//  return (bool) $enable_meta_box_cb_edit;
// }
// add_filter( 'dt/settings/enable_meta_box_cb_edit', 'dt_settings_enable_meta_box_cb_edit', 1 );dt_str_replace($time, $php_to_js);
