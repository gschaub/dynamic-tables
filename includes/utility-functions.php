<?php
namespace DynamicTableBlocks;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Globals.
global $dtbk_instances;

// Initialize plaeholders.
$dtbk_stores    = array();
$dtbk_instances = array();

/**
 * dtbk_new_instance
 *
 * Creates a new instance of the given class and stores it in the instances data store.
 *
 * @since   1.0.0
 *
 * @param   string $class The class name.
 * @return  object The instance.
 */
function dtbk_new_instance( $class = '', $namespace = '' ) {
	if ( ! $namespace ) {
		$namespace = 'DynamicTableBlocks';
	}
	$class = $namespace . '\\' . $class;

	global $dtbk_instances;
	return $dtbk_instances[ $class ] = new $class();
}
