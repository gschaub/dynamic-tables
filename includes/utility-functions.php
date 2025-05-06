<?php
namespace DynamicTables;

// Globals.
global $dt_instances;

// Initialize plaeholders.
$dt_stores    = [];
$dt_instances = [];

/**
 * dt_new_instance
 *
 * Creates a new instance of the given class and stores it in the instances data store.
 *
 * @since   1.0.0
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
