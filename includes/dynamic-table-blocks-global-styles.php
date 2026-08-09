<?php
/**
 * Dynamic Tables Global Styles.
 *
 * Supplies WordPress Global Styles defaults for the Dynamic Tables block.
 * Site Editor styles and individual block settings can override these
 * defaults.
 *
 * @package DynamicTableBlocks
 */

defined( 'ABSPATH' ) || exit;

/**
 * Add accessible link focus defaults to Dynamic Tables blocks.
 *
 * The theme data origin lets these defaults apply when a theme defines a
 * site-wide link color. Site Editor and individual block settings retain
 * higher priority.
 *
 * @since 1.4.6
 *
 *  @param WP_Theme_JSON_Data $theme_json Theme Global Styles data.
 * @return WP_Theme_JSON_Data
 */
function dtbk_add_block_global_style_defaults( $theme_json ) {
	if ( '1' !== get_option( 'dtbk_enable_block_defaults', '1' ) ) {
		return $theme_json;
	}

	$style_data = array(
		'version' => 3,
		'styles'  => array(
			'blocks' => array(
				'dynamic-table-blocks/dynamic-table-blocks' => array(
					// Default font size to medium
					'typography' => array(
						'fontSize' => 'var:preset|font-size|medium',
					),
					'elements'   => array(
						'link' => array(
							'color'          => array(
								'text' => 'var:preset|color|accent-3',
							),
							':hover'         => array(
								'color'      => array(
									'text' => 'var:preset|color|contrast',
								),
								'typography' => array(
									'textDecoration' => 'underline',
								),
							),
							':visited'       => array(
								'color' => array(
									'text' => 'var:preset|color|accent-4',
								),
							),
							':active'        => array(
								'color' => array(
									'text' => 'var:preset|color|contrast',
								),
							),
							':focus-visible' => array(
								'outline' => array(
									'color'  => 'currentColor',
									'offset' => '2px',
									'style'  => 'solid',
									'width'  => '2px',
								),
							),
						),
					),
				),
			),
		),
	);

	return $theme_json->update_with( $style_data );
}
add_filter( 'wp_theme_json_data_theme', 'dtbk_add_block_global_style_defaults' );
