/**
 * React component to render the post author's name
 *
 * @since 1.5.0
 * @param {string} authorName The post author's name
 * @return {Element} Markup for author's name
 */
export function PostAuthor({ authorName }) {
	if (!authorName) {
		return null;
	}

	return <>{authorName}</>;
}
