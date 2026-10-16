/**
 * Internal dependencies
 */
import { htmlToIndexText } from '../../../utils';
import '../../../editor.scss';
import '../../../style.scss';

/**
 * React component to render the post's cover image
 *
 * @since 1.5.0
 *
 * @param {Object} props
 * @param {Object} props.image The post's image and related meta
 * @param {string} props.sizes Image sizes attribute
 * @param {Object} props.link  The post's URL
 * @param {Object} props.title The post's title
 * @return {Element|null} Markup to render the cover image
 */
export function PostImage(props = {}) {
	const { image, sizes, link = {}, title = {} } = props;

	if (!image) {
		return null;
	}

	const renderedImage = (
		<span
			style={{
				position: 'relative',
				display: 'inline-block',
				maxWidth: '100%',
				verticalAlign: 'top',
			}}
		>
			<img
				src={image.src}
				loading={image.loading}
				srcSet={sizes ? image.srcSet : undefined}
				sizes={sizes}
				alt={image.alt}
				width={image.width}
				height={image.height}
				style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
			/>

			{title.embedTitle && (
				<span
					style={{
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
						padding: '12px',
						background: 'rgba(0, 0, 0, 0.65)',
						color: '#fff',
						fontWeight: 600,
						lineHeight: 1.3,
						overflowWrap: 'anywhere',
					}}
				>
					{htmlToIndexText(title.title)}
				</span>
			)}
		</span>
	);

	return (
		<>
			{link.isLink && (
				<a
					className="dtbk-post-image__link"
					href={link.url}
					target={link.newTab ? '_blank' : '_top'}
					rel={link.newTab ? 'noopener noreferrer' : undefined}
				>
					{renderedImage}
				</a>
			)}
			{!link.isLink && <>{renderedImage}</>}
		</>
	);
}
