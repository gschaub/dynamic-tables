export function applyTableStoreChange({
	tableId,
	attribute,
	id,
	type,
	value,
	updateCell,
	updateRow,
	updateColumn,
	updateTableProp,
}) {
	switch (type) {
		case 'CONTENT':
			if (attribute === 'cell') {
				updateCell(tableId, id, 'content', value);
				return true;
			}
			return false;

		case 'ATTRIBUTES':
			if (attribute === 'cell') {
				updateCell(tableId, id, 'attributes', value);
				return true;
			}
			if (attribute === 'row') {
				updateRow(tableId, id, 'attributes', value);
				return true;
			}
			if (attribute === 'column') {
				updateColumn(tableId, id, 'attributes', value);
				return true;
			}
			if (attribute === 'table') {
				updateTableProp(tableId, 'attributes', value);
				return true;
			}
			return false;

		case 'CLASSES':
			if (attribute === 'cell') {
				updateCell(tableId, id, 'classes', value);
				return true;
			}
			if (attribute === 'column') {
				updateColumn(tableId, id, 'classes', value);
				return true;
			}
			return false;

		case 'PROP':
			if (attribute === 'column_name') {
				updateColumn(tableId, id, attribute, value);
				return true;
			}
			updateTableProp(tableId, attribute, value);
			return true;

		default:
			return false;
	}
}

export function mergeAttributes(currentAttributes, patch) {
	return {
		...(currentAttributes || {}),
		...patch,
	};
}
