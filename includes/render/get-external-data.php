<?php
/**
 * Functions that render the table body based on the render mode.
 *
 * @since 1.5.0
 */
namespace DynamicTableBlocks;

use WP_Query;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}


/**
 * Retrieve table cells that reference external WordPress data.
 *
 * External data is added only to the in-memory table used for rendering. It is
 * not persisted with the table entity.
 *
 * @since 1.5.0
 *
 * @param array $table Table data.
 * @return array Table data with external cell data attached.
 */
function get_table_external_data( array $table ) {
	if ( empty( $table['columns'] ) || empty( $table['cells'] ) ) {
		return $table;
	}

	$columns_by_id      = array();
	$requests_by_post   = array();
	$requested_post_types = array();
	$external_data_types = array( 'post' );
	$allowed_image_sizes = array_merge(
		array( 'full' ),
		get_intermediate_image_sizes()
	);

	foreach ( $table['columns'] as $column ) {
		if ( ! isset( $column['column_id'] ) ) {
			continue;
		}

		$columns_by_id[ (string) $column['column_id'] ] = $column;
	}


	foreach ( $table['cells'] as $cell_index => $cell ) {
		$column_id = isset( $cell['column_id'] )
			? (string) $cell['column_id']
			: '';
		$column    = $columns_by_id[ $column_id ];
		$data_type = $column['attributes']['columnDataType']['type'];

		switch ( $data_type ) {
			case 'post':
				$cell_value = $cell['attributes']['value'] ?? array();
				if ( ! is_array( $cell_value ) ) {
					continue 2;
				}

				$legacy_canonical = isset( $cell_value['cannonical'] ) && is_array( $cell_value['cannonical'] )
					? $cell_value['cannonical']
					: array();
				$canonical = isset( $cell_value['canonical'] ) && is_array( $cell_value['canonical'] )
					? $cell_value['canonical']
					: array();
				$canonical_value = array_merge( $legacy_canonical, $canonical );

				$cell_post_id   = (int) ( $canonical_value['postId'] ?? 0 );
				$cell_post_type = (string) ( $canonical_value['postType'] ?? '' );

				if ( $cell_post_id <= 0 || '' === $cell_post_type || ! post_type_exists( $cell_post_type ) ) {
					continue 2;
				}

				$column_options = $column['attributes']['columnDataType']['settings']['formatOptions'] ?? array();

				$image_size     = isset( $column_options['displayImageSize'] )
					? sanitize_key( $column_options['displayImageSize'] )
					: 'thumbnail';

				if ( ! in_array( $image_size, $allowed_image_sizes, true ) ) {
					$image_size = 'thumbnail';
				}

				$requests_by_post[ $cell_post_id ][] = array(
					'cell_index' => $cell_index,
					'post_type'  => $cell_post_type,
					'image_size' => $image_size,
				);
				$requested_post_types[ $cell_post_type ] = true;
				break;
			default:
				break;
		}
	}

	if ( empty( $requests_by_post ) ) {
		return $table;
	}

	foreach ( $external_data_types as $data_type ) {
		switch ( $data_type ) {
			case 'post':
				$query = new WP_Query(
					array(
						'post_type'           => array_keys( $requested_post_types ),
						'post_status'         => 'publish',
						'post__in'            => array_map( 'intval', array_keys( $requests_by_post ) ),
						'posts_per_page'      => -1,
						'no_found_rows'       => true,
						'orderby'             => 'post__in',
						'ignore_sticky_posts' => true,
					)
				);
				$image_cache = array();

				while ( $query->have_posts() ) {
					$query->the_post();

					$post = get_post();

					if ( ! $post || empty( $requests_by_post[ $post->ID ] ) ) {
						continue;
					}

					$post_type       = get_post_type( $post );
					$is_protected    = post_password_required( $post );
					$rendered_content = $is_protected
						? ''
						: $post->post_content;
					$rendered_excerpt = $is_protected
						? ''
						: get_the_excerpt( $post );
					$featured_media   = (int) get_post_thumbnail_id( $post );

					$post_data = array(
						'id'             => (int) $post->ID,
						'type'           => $post_type,
						'link'           => (string) get_permalink( $post ),
						'slug'           => $post->post_name,
						'status'         => $post->post_status,
						'author'         => (int) $post->post_author,
						'featured_media' => $featured_media,
						'title'          => array(
							'rendered' => get_the_title( $post ),
						),
						'content'        => array(
							'rendered'  => $rendered_content,
							'protected' => $is_protected,
						),
						'excerpt'        => array(
							'rendered'  => $rendered_excerpt,
							'protected' => $is_protected,
						),
						'date'           => get_post_time( 'Y-m-d\TH:i:s', false, $post ),
						'modified'       => get_post_modified_time( 'Y-m-d\TH:i:s', false, $post ),
					);

					$statistics = get_external_post_statistics(
						$rendered_content,
						$is_protected
					);

					$author_name = get_the_author_meta(
						'display_name',
						(int) $post->post_author
					);

					foreach ( $requests_by_post[ $post->ID ] as $request ) {
						if ( $request['post_type'] !== $post_type ) {
							continue;
						}

						$image_key = $featured_media . ':' . $request['image_size'];

						if ( ! array_key_exists( $image_key, $image_cache ) ) {
							$image_cache[ $image_key ] = get_external_post_image(
								$featured_media,
								$request['image_size']
							);
						}

						$cell_index = $request['cell_index'];

						$table['cells'][ $cell_index ]['attributes']['value']['externalData'] = array(
							'post'       => $post_data,
							'image'      => $image_cache[ $image_key ],
							'authorName' => $author_name ? $author_name : null,
							'statistics' => $statistics,
						);
					}
				}
				wp_reset_postdata();
				break;
			default:
				break;
		}
	}
	return $table;
}

/**
 * Retrieve a post's featured image in the editor external-data format.
 *
 * @since 1.5.0
 *
 * @param int    $attachment_id Attachment ID.
 * @param string $image_size    Requested WordPress image size.
 * @return array|null Formatted image data.
 */
function get_external_post_image( $attachment_id, $image_size ) {
	$attachment_id = absint( $attachment_id );

	if ( 0 === $attachment_id ) {
		return null;
	}

	$image = wp_get_attachment_image_src( $attachment_id, $image_size );

	if ( false === $image && 'full' !== $image_size ) {
		$image      = wp_get_attachment_image_src( $attachment_id, 'full' );
		$image_size = 'full';
	}

	if ( false === $image ) {
		return null;
	}

	$srcset = wp_get_attachment_image_srcset( $attachment_id, $image_size );

	return array(
		'src'     => $image[0],
		'loading' => 'lazy',
		'srcSet'  => false !== $srcset ? $srcset : null,
		'alt'     => (string) get_post_meta(
			$attachment_id,
			'_wp_attachment_image_alt',
			true
		),
		'width'   => (int) $image[1],
		'height'  => (int) $image[2],
	);
}

/**
 * Calculate post statistics in the editor external-data format.
 *
 * @since 1.5.0
 *
 * @param string $rendered_content Rendered post content.
 * @param bool   $is_protected     Whether the post is password protected.
 * @return array|null Post statistics.
 */
function get_external_post_statistics( $rendered_content, $is_protected ) {
	if ( $is_protected ) {
		return null;
	}

	$charset = get_bloginfo( 'charset' );
	$charset = $charset ? $charset : 'UTF-8';
	$text    = html_entity_decode(
		wp_strip_all_tags( strip_shortcodes( $rendered_content ) ),
		ENT_QUOTES,
		$charset
	);

	$word_count = preg_match_all(
		"/[\p{L}\p{N}]+(?:['\x{2019}\-][\p{L}\p{N}]+)*/u",
		$text,
		$matches
	);

	if ( false === $word_count ) {
		$word_count = 0;
	}

	$reading_minutes = 0 === $word_count
		? 0
		: max( 1, (int) round( $word_count / 189 ) );

	return array(
		'wordCount'      => $word_count,
		'readingMinutes' => $reading_minutes,
	);
}
