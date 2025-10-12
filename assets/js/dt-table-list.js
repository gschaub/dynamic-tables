// Row action: view
document.addEventListener('click', async e => {
	const a = e.target.closest('a[data-dt-action="view"]');
	console.log('Target = ' + e.target);
	console.log('a = ' + a);

	if (!a) return;

	console.log('a found');

	e.preventDefault();
	if (!confirm(a.getAttribute('data-confirm') || 'View this item?')) return;

	const id = a.getAttribute('data-id');
	const fd = new FormData();

	fd.append('dt_view_table', 'view');
	fd.append('_ajax_nonce', DT_TABLE_LIST.nonce);
	fd.append('ids[]', id);

	console.log(fd);

	// const res = await fetch(DT_TABLE_LIST.ajaxUrl, {
	// 	method: 'POST',
	// 	body: fd,
	// 	credentials: 'same-origin',
	// });

	alert('View Table id = ' + id);

	// const json = await res.json();



	// if (json.success) {
	// 	// Remove the row
	// 	const row = a.closest('tr');
	// 	if (row) row.remove();
	// 	// addNotice(json.data.notice, 'success');
	// } else {
	// 	// addNotice(json.data?.message || DT_DEMO.i18n.error, 'error');
	// }
});
