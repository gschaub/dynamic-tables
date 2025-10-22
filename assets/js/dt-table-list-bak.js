jQuery(function ($) {
	function addNotice(message, type = 'success') {
		const $wrap = $('.wrap');
		const $n = $(`
      <div class="notice notice-${type} is-dismissible">
        <p>${message}</p>
        <button type="button" class="notice-dismiss"><span class="screen-reader-text">Dismiss</span></button>
      </div>
    `);
		$wrap.prepend($n);
		$n.on('click', '.notice-dismiss', () => $n.remove());
	}

	async function postView(id) {
		console.log('Nonce = ' + DT_TABLE_LIST.nonce);
		console.log('Ajax URL = ' + DT_TABLE_LIST.ajaxUrl);
		console.log('Table ID = ' + id);

		const fd = new FormData();
		fd.append('action', 'dt_view_table');
		fd.append('_ajax_nonce', DT_TABLE_LIST.nonce);
		fd.append('id', id);
		console.log(JSON.stringify(fd));
		const res = await fetch(DT_TABLE_LIST.ajaxUrl, {
			method: 'POST',
			body: fd,
			credentials: 'same-origin',
		});

		// console.log('result = ' + JSON.stringify(res, null, 5));
		// console.log('result = ' + JSON.stringify(res.json()));
		return res.json();
	}

	async function getTableBody(id) {
		console.log('Nonce = ' + DT_TABLE_LIST.nonce);
		console.log('Ajax URL = ' + DT_TABLE_LIST.ajaxUrl);

		const fd = new FormData();
		fd.append('action', 'dt_view_table');
		fd.append('_ajax_nonce', DT_TABLE_LIST.nonce);
		id.forEach(id => fd.append('id[]', id));
		const res = await fetch(DT_TABLE_LIST.ajaxUrl, {
			method: 'POST',
			body: fd,
			credentials: 'same-origin',
		});
		return res.json();
	}

	function openViewDialog(id) {
		$('#dt-dialog').dialog({
			modal: true,
			resizable: false,
			draggable: true,
			width: 420,
			title: DT_TABLE_LIST.i18n.confirmTitle,
			buttons: [
				{
					text: DT_TABLE_LIST.i18n.cancel,
					class: 'button',
					click: function () {
						$(this).dialog('close');
					},
				},
				{
					text: DT_TABLE_LIST.i18n.view,
					class: 'button button-primary',
					click: async function () {
						const dlg = $(this);
						try {
							const json = await getTableBody(id);
						} catch (e) {
							addNotice(DT_TABLE_LIST.i18n.error, 'error');
						}
						dlg.dialog('close');
					},
				},
			],
			close: function () {
				$(this).dialog('destroy');
			},
		});
	}

	// Process row actions (link in actions)

	// Row action = view
	$(document).on('click', 'a[data-dt-action="view"]', function (e) {
		e.preventDefault();
		// const id = parseInt($(this).data('id'), 10);
		const id = $(this).data('id');
		if (!id) return;
		const tabledata = postView(id);
		console.log(tabledata);
		// openViewDialog([id]);
	});
});

// try {
// 	const json = await postView(ids);
// 	if (json.success) {
// 		// remove rows
// 		ids.forEach(id => {
// 			const $row = $(`tbody input[name="ids[]"][value="${id}"]`).closest('tr');
// 			$row.remove();
// 		});
// 		addNotice(json.data.notice || 'Done', 'success');
// 	} else {
// 		addNotice(json?.data?.message || DT_TABLE_LIST.i18n.error, 'error');
// 	}
// } catch (e) {
// 	addNotice(DT_TABLE_LIST.i18n.error, 'error');
// }

// Row action: view
// document.addEventListener('click', async e => {
// 	const a = e.target.closest('a[data-dt-action="view"]');
// 	console.log('Target = ' + e.target);
// 	console.log('a = ' + a);

// 	if (!a) return;

// 	console.log('a found');

// 	e.preventDefault();
// 	if (!confirm(a.getAttribute('data-confirm') || 'View this item?')) return;

// 	const id = a.getAttribute('data-id');
// 	const fd = new FormData();

// 	fd.append('dt_view_table', 'view');
// 	fd.append('_ajax_nonce', DT_TABLE_LIST.nonce);
// 	fd.append('ids[]', id);

// 	console.log(fd);

// const res = await fetch(DT_TABLE_LIST.ajaxUrl, {
// 	method: 'POST',
// 	body: fd,
// 	credentials: 'same-origin',
// });

// alert('View Table id = ' + id);

// const json = await res.json();

// if (json.success) {
// 	// Remove the row
// 	const row = a.closest('tr');
// 	if (row) row.remove();
// 	// addNotice(json.data.notice, 'success');
// } else {
// 	// addNotice(json.data?.message || DT_DEMO.i18n.error, 'error');
// }
// });
