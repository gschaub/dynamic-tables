<?php
/**
 * Render post information for display in a cell.
 *
 * @since 1.5.0
 */
namespace DynamicTableBlocks;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Format cells from columns of content type 'post' for front-end render
 *
 * @since 1.5.0
 *
 * @param  array $cell
 * @param  string $cell_classes
 * @return void
 */
function format_post_cell($cell, $cell_classes = '') {
	$content_format = $cell['data_type']['settings']['format'];
	$content_options = $cell['data_type']['settings']['formatOptions'];
	$cell_content = $cell['content'];
	$cell_value = $cell['attributes']['value'];

	if ( ! isset($cell_value['canonical']) ) return;

	$canonical = $cell_value['canonical'];
	$options       = $cell_value['options'] ?? array();
	$external_data = $cell_value['externalData'] ?? array();
	$index_text    = $cell_value['indexText'] ?? '';
	$post          = $external_data['post'] ?? null;

	$post_id   = (int) $canonical['postId'];
	$post_type = $canonical['postType'];

	if ( $post_id <= 0 || ! is_string( $post_type ) || $post_type === '' ) {
		return;
	}

	$post_link_in_new_tab = isset($options['newTab']) ? $options['newTab'] : false;
	$displayed_attributes = get_display_attributes($content_options);

	switch ( $content_format ) {
		case 'link':
			$post_link = ! empty( $post['link'] )
				? $post['link']
				: get_cell_link_url( $cell_content );

			if ( ! is_web_url( $post_link ) ) {
				return;
			}

			$link_label = trim( (string) $index_text ) !== ''
				? $index_text
				: html_to_index_text( $cell_content );
			?>
			<a
				href="<?php echo esc_url($post_link);?>"
				target="<?php echo $post_link_in_new_tab ? '_blank' : '_top';?>"
				<?php if ( $post_link_in_new_tab ) { ?>
					rel="noopener noreferrer"
				<?php } ?>
			>
				<?php echo esc_html( $link_label);?>
			</a><?php
			break;
		case 'narrow':
		case 'wide':
			if (
				! is_array( $post ) ||
				(int) ( $post['id'] ?? 0 ) !== $post_id ||
				( $post['type'] ?? null ) !== $post_type
			) {
				return;
			}

			if ( $content_format === 'narrow' ) {
				render_narrow_content(
					$external_data,
					$displayed_attributes,
					$content_options
				);
				break;
			}

			render_wide_content(
				$external_data,
				$displayed_attributes,
				$content_options,
			);
			break;
		default:
			return;
	}
}

/**
 * Render cells for the narrow post format
 *
 * @since 1.5.0
 *
 * @param  array $post_data              Retrieved post data
 * @param  array $displayed_attributes   Specific post attributes to be rendered
 * @param  array $content_options        Column display format options
 * @return void
 */
function render_narrow_content(
	$post_data,
	$displayed_attributes,
	$content_options,
) {

	?>
	<div class="dtbk-post-content dtbk-post-content--narrow"><?php
		foreach ( $displayed_attributes as $displayed_attribute ) {
			$formatted_content = get_display_attribute_markup(
				$displayed_attribute['attribute'],
				$post_data,
				$content_options
			);

			if ( trim( $formatted_content ) === '' ) {
				continue;
			}
			?>
			<div><?php echo wp_kses_post( $formatted_content ); ?></div>
			<?php
		}?>
	</div><?php
}

/**
 * Render cells for the wide post format
 *
 * @since 1.5.0
 *
 * @param  array $post_data              Retrieved post data
 * @param  array $displayed_attributes   Specific post attributes to be rendered
 * @param  array $content_options        Column display format options
 * @return void
 */
function render_wide_content(
	$post_data,
	$displayed_attributes,
	$content_options
) {
	$wide_column_split = $content_options['wideColumnSplit'] ?? 'equal';

	?>
	<div class="dtbk-post-content dtbk-post-content--wide">
		<div style="display: flex; flex-direction: column; gap: 10px; padding: 10px 10px;"><?php
			render_post_attribute_column(
				'span',
				$post_data,
				$displayed_attributes,
				$content_options
			);?>
		</div>
		<div
			class="dtbk-post-content__columns"
			data-column-split="<?php echo esc_attr( $wide_column_split ); ?>"
		>
			<div class="dtbk-post-content__column dtbk-post-content__column--left">
				<div style="display: flex; flex-direction: column; gap: 10px;"><?php
					render_post_attribute_column(
						'left',
						$post_data,
						$displayed_attributes,
						$content_options
					);
					?>
				</div>
			</div>
			<div class="dtbk-post-content__column dtbk-post-content__column--right">
				<div style="display: flex; flex-direction: column; gap: 10px;"><?php
					render_post_attribute_column(
						'right',
						$post_data,
						$displayed_attributes,
						$content_options
					);
					?>
				</div>
			</div>
		</div>
	</div><?php
}

/**
 * Render content position within the cell
 *
 * @since 1.5.0
 *
 * @param  string $column                Column into which to render attribute
 * @param  array $post_data              Retrieved post data
 * @param  array $displayed_attributes   Specific post attributes to be rendered
 * @param  array $content_options        Column display format options
 * @return void
 */
function render_post_attribute_column(
	$column,
	$post_data,
	$displayed_attributes,
	$content_options
) {
	foreach ( $displayed_attributes as $displayed_attribute ) {
		if ( $column !== $displayed_attribute['slot']['column'] ) {
			continue;
		}

		$formatted_content = get_display_attribute_markup(
			$displayed_attribute['attribute'],
			$post_data,
			$content_options
		);

		if ( trim( $formatted_content ) === '' ) {
			continue;
		}?>
		<div><?php echo wp_kses_post( $formatted_content ); ?></div>
		<?php
	}
}

/**
 * Retrieve markup for a post element to be rendered
 *
 * @since 1.5.0
 *
 * @param  array $displayed_attribute    Specific post attribute to be rendered
 * @param  array $post_data              Retrieved post data
 * @param  array $content_options        Column display format options
 * @return string                        HTML markup
 */
function get_display_attribute_markup(
	$displayed_attribute,
	$post_data,
	$content_options
) {
	ob_start();

	evaluate_display_attributes(
		$displayed_attribute,
		$post_data,
		$content_options
	);

	return (string) ob_get_clean();
}

/**
 * Identify the appropriate render for each
 *
 * Description - Each attribute type secific markup. Identify the type to be marked up
 *               and retrieve that markup.
 *
 * @since 1.5.0
 *
 * @param  array $displayed_attribute    Specific post attribute to be rendered
 * @param  array $post_data              Retrieved post data
 * @param  array $content_options        Column display format options
 * @return string                        HTML markup
 */
function evaluate_display_attributes(
	$displayed_attribute,
	$post_data,
	$content_options
) {
	$post = $post_data['post'];
	$image = $post_data['image'];
	$author_name = $post_data['authorName'];

	$display_title_in_cover = $content_options['displayTitleInCover'];
	$link_location = $content_options['linkLocation'];
	$post_link = $post['link'];

	switch ( $displayed_attribute ) {
		case 'title':
			if ($display_title_in_cover) return;
			render_post_title(
				$post['title']['rendered'],
				$link_location,
				$post_link
			);
			break;
		case 'image':
			render_post_image(
				$image,
				'auto',
				array(
					'is_link' => $link_location === 'image',
					'url'     => $post_link,
				),
				array(
					'embed_title' => $display_title_in_cover,
					'title'       => $post['title']['rendered'],
				)
			);
			break;
		case 'excerpt':
			render_post_except($post['excerpt']['rendered']);
			break;
		case 'author':
			render_post_author($author_name);
			break;
		case 'published':
			render_published_date($post['date']);
			break;
		case 'modified':
			render_modified_date($post['modified']);
			break;
		default:
			break;
	}
}

/**
 * Render HTML markup for post title
 *
 * @since 1.5.0
 *
 * @param  string $rendered_content  Post title as text
 * @param  string $link_location     Where the post link is to be located
 * @param  string $post_link         Post link url
 * @return void
 */
function render_post_title($rendered_content, $link_location, $post_link) {?>
	<div style="font-weight: 600; text-align: center;"><?php
		if ( 'title' === $link_location ) { ?>
			<a href="<?php echo esc_url($post_link); ?>">
				<?php echo esc_html($rendered_content); ?>
			</a><?php
		} else {
			echo esc_html($rendered_content);
		} ?>
	</div><?php
}

/**
 * Render HTML markup for post cover image
 *
 * @since 1.5.0
 *
 * @param  array|null $image  Image data, or null when no image is available.
 * @param  string     $sizes  Responsive image sizes value.
 * @param  array      $link   Image link settings including image url.
 * @param  array      $title  Embedded title settings including title text.
 * @return void
 */
function render_post_image($image, $sizes, $link, $title) {
	if ( ! $image ) {
		return;
	}?>

	<div class="dtbk-post-image">
		<?php if ( $link['is_link'] ) { ?>
			<a class="dtbk-post-image__link" href="<?php echo esc_url( $link['url'] ); ?>">
		<?php } ?>

		<span class="dtbk-post-image__frame">
			<img
				class="dtbk-post-image__media"
				src="<?php echo esc_url($image['src']);?>"
				loading="<?php echo esc_attr($image['loading']);?>"
				<?php if ( $sizes && ! empty( $image['srcSet'] ) ) { ?>
					srcset="<?php echo esc_attr( $image['srcSet'] ); ?>"
				<?php } ?>
				<?php if ( $sizes ) { ?>
					sizes="<?php echo esc_attr( $sizes ); ?>"
				<?php } ?>
				alt="<?php echo esc_attr($image['alt']);?>"
				width="<?php echo  esc_attr($image['width']);?>"
				height="<?php echo esc_attr($image['height']);?>"
			/><?php

			if ( $title['embed_title'] ) {?>
				<span class="dtbk-post-image__title"><?php
					echo esc_html(html_to_index_text($title['title']));?>
				</span><?php
			} ?>
		</span>

		<?php if ( $link['is_link'] ) { ?>
			</a>
		<?php } ?>
	</div><?php
}

/**
 * Render HTML markup for post excerpt
 *
 * @since 1.5.0
 *
 * @param  string $rendered_content   Post excerpt
 * @return void
 */
function render_post_except($rendered_content) {
	?>
	<div style="display: flex; gap: 8px; width: 100%">
		<em>
			<div class="dtb-post-excerpt">
				<?php echo wp_kses_post($rendered_content); ?>
			</div>
		</em>
	</div><?php
}

/**
 * Render HTML markup for post excerpt
 *
 * @since 1.5.0
 *
 * @param  string $author_name  Post Author's name in plain text
 * @return void
 */
function render_post_author($author_name) {
	$content_label = __('Author:', 'dynamic-table-blocks');
	$author_name = $author_name ? $author_name : '' ?>

	<div style="display: flex; gap: 8px; width: 100%;">
		<div>
			<strong><?php echo esc_html($content_label); ?></strong>
		</div>
		<span><?php echo esc_html($author_name); ?></span>
	</div><?php
}

/**
 * Render HTML markup for post publish date
 *
 * @since 1.5.0
 *
 * @param  string $rendered_content  Post published date
 * @return void
 */
function render_published_date($rendered_content) {
	$content_label = __('Published:', 'dynamic-table-blocks');
	$display_date = mysql2date( 'n/j/Y', $rendered_content );?>

	<div style="display: flex; gap: 8px; width: 100%;">
		<div>
			<strong><?php echo esc_html($content_label) ;?></strong>
		</div>
		<span><?php echo esc_html($display_date ); ?></span>
	</div><?php
}

/**
 * Render HTML markup for post last modified date
 *
 * @since 1.5.0
 *
 * @param  string $rendered_content  Post last modified date
 * @return void
 */
function render_modified_date($rendered_content) {
	$content_label = __('Last Updated:', 'dynamic-table-blocks');
	$display_date = mysql2date( 'n/j/Y', $rendered_content );?>

	<div style="display: flex; gap: 8px; width: 100%;">
		<div>
			<strong><?php echo esc_html($content_label); ?></strong>
		</div>
		<span><?php echo esc_html($display_date ); ?></span>
	</div><?php
}

/**
 * Provide a sorted list of post elements to display
 *
 * Description - Selected elements from the column configuration to display along with
 *               the location within the cell and the order. Result is sorted by location
 *               and then order (ascending)
 *
 * @since 1.5.0
 *
 * @param  array $content_options  Post elements
 * @return array                   Sorted post elements to display in cell
 */
function get_display_attributes($content_options) {
	$post_display_attributes = [];

	if ( $content_options['displayTitle']['display'] ) {
		array_push( $post_display_attributes, array(
			'attribute' => 'title',
			'slot'      => $content_options['displayTitle'],
		));

	}

	if ( $content_options['displayCoverImage']['display'] ) {
		array_push( $post_display_attributes, array(
			'attribute' => 'image',
			'slot'      => $content_options['displayCoverImage'],
		));

	}

	if ( $content_options['displayExcerpt']['display'] ) {
		array_push( $post_display_attributes, array(
			'attribute' => 'excerpt',
			'slot'      => $content_options['displayExcerpt'],
		));

	}

	if ( $content_options['displayAuthor']['display'] ) {
		array_push( $post_display_attributes, array(
			'attribute' => 'author',
			'slot'      => $content_options['displayAuthor'],
		));

	}

	if ( $content_options['displayPublishDate']['display'] ) {
		array_push( $post_display_attributes, array(
			'attribute' => 'published',
			'slot'      => $content_options['displayPublishDate'],
		));
	}

	if ( $content_options['displayModifiedDate']['display'] ) {
		array_push( $post_display_attributes, array(
			'attribute' => 'modified',
			'slot'      => $content_options['displayModifiedDate'],
		));

	}

	usort( $post_display_attributes, function ( $a, $b ) {
		$column_compare = strcmp(
			$a['slot']['column'],
			$b['slot']['column']
		);

		return $column_compare !== 0
			? $column_compare
			: $a['slot']['order'] <=> $b['slot']['order'];
	});

	return $post_display_attributes;
}

/**
 * Retrieve the url associated with the cell's content
 *
 * @since 1.5.0
 *
 * @param  string $content Cached markup for post
 * @return string          Post's link url
 */
function get_cell_link_url(string $content): string {
	if ( empty(trim($content) ) ) {
		return '';
	}

	$dom = new \DOMDocument();
	$previous_libxml_state = libxml_use_internal_errors( true );
	$loaded                = $dom->loadHTML(
		'<?xml encoding="utf-8" ?>' . $content,
		LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
	);

	libxml_clear_errors();
	libxml_use_internal_errors( $previous_libxml_state );

	if ( ! $loaded ) {
		return '';
	}

	$xpath = new \DOMXPath( $dom );
	$node  = $xpath->query( '//a[@href]' )->item( 0 );

	return $node instanceof \DOMElement
		? $node->getAttribute('href')
		: '';
}

/**
 * Validates a url
 *
 * @since 1.5.0
 *
 * @param  string $value  A url
 * @return bool           Is the url valid
 */
function is_web_url($value) {
	if ( ! is_string($value) || empty(trim($value)) ) {
		return false;
	}

	$trimmed = trim($value);

	if ( ! preg_match('/^[a-z0-9+.-]+:/i', $trimmed) ) {
		$trimmed = 'https://wordpress.invalid/' . ltrim($trimmed, '/');
	}

	if ( ! filter_var($trimmed, FILTER_VALIDATE_URL) ) {
		return false;
	}

	$scheme = wp_parse_url( $trimmed, PHP_URL_SCHEME );
	return $scheme === 'http' || $scheme === 'https';
}

/**
 * Convert html to plain text
 *
 * @since 1.5.0
 *
 * @param  string $html HTML to convert
 * @return string       Plain text representation of HTML
 */
function html_to_index_text( $html = '' ) {
	$charset = get_bloginfo( 'charset' );

	if ( ! $charset ) {
		$charset = 'UTF-8';
	}

	$text = html_entity_decode(
		wp_strip_all_tags( $html ),
		ENT_QUOTES | ENT_HTML5,
		$charset
	);

	return trim( (string) preg_replace( '/\s+/u', ' ', $text ) );
}
