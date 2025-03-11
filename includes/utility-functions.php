<?php
namespace DynamicTables;

// Globals.
global $dt_instances;

// Initialize plaeholders.
$dt_stores    = [];
$dt_instances = [];

/**
 * acf_new_instance
 *
 * Creates a new instance of the given class and stores it in the instances data store.
 *
 * @date    9/1/19
 * @since   5.7.10
 *
 * @param   string $class The class name.
 * @return  object The instance.
 */
function dt_new_instance($class = '', $namespace = '') {
	if ( ! $namespace ) {
		$namespace = 'DynamicTables';
	}
	$class = $namespace . "\\" . $class;

	global $dt_instances;
	return $dt_instances[ $class ] = new $class();
}

/**
 * Returns an instance for the given class.
 *
 * @date  9/1/19
 * @since 5.7.10
 *
 * @param string $class The class name.
 * @return object The instance.
 */
function dt_get_instance($class = '', $namespace = '') {
	if ( ! $namespace ) {
		$namespace = 'DynamicTables';
	}
	$class = $namespace . "\\" . $class;

	global $acf_instances;
	if ( ! isset($dt_instances[ $class ]) ) {
		$acf_instances[ $class ] = new $class();
	}
	return $dt_instances[ $class ];
}

/**
 * acf_get_path
 *
 * Returns the plugin path to a specified file.
 *
 * @date    28/9/13
 * @since   5.0.0
 *
 * @param   string $filename The specified file.
 * @return  string
 */
function dt_get_path($filename = '') {
	return DT_PATH . ltrim($filename, '/');
}

/**
 * acf_get_url
 *
 * Returns the plugin url to a specified file.
 * This function also defines the ACF_URL constant.
 *
 * @date    12/12/17
 * @since   5.6.8
 *
 * @param   string $filename The specified file.
 * @return  string
 */
function dt_get_url($filename = '') {
	if ( ! defined('ACF_URL') ) {
		define('ACF_URL', dt_get_setting('url'));
	}
	return ACF_URL . ltrim($filename, '/');
}
