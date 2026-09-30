export function PostAuthor({ authorName }) {
	if (!authorName) {
		return null;
	}

	return <>{authorName}</>;
}
