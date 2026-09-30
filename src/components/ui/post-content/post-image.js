/**
 * Internal dependencies
 */
import { htmlToIndexText } from '../../../utils';
import '../../../editor.scss';
import '../../../style.scss';

export function PostImage({ image, sizes, link = {}, title = {} }) {
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
			{link.isLink && <a href={link.url}>{renderedImage}</a>}
			{!link.isLink && <>{renderedImage}</>}
		</>
	);
}
