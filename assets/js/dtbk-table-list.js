/* global jQuery, DTBK_TABLE_LIST */

jQuery($ => {
	'use strict';

	class Admin {
		constructor($) {
			// Store the jQuery object for the selected element
			this.$ = $;
			this.$doc = this.$(document);

			// Dialog element id's
			this.listRowId = 'data-id';
			this.importDialogId = 'dtbk-import-dialog';
			this.exportDialogId = 'dtbk-export-dialog';

			// Runtime state for exports
			this.exportIds = '';
			this.exportNonce = '';

			// Runtime state for imports
			this.importState = this.getEmptyImportState();

			this.isProSubscribed = false;

			this.exportUi = {
				title: DTBK_TABLE_LIST?.i18n?.exportTitle || 'Export Dynamic Table(s)',
				prompt: DTBK_TABLE_LIST?.i18n?.exportPrompt || 'Select export format:',
				formats: {
					json: DTBK_TABLE_LIST?.i18n?.exportJson || 'Backup (JSON)',
					csv: DTBK_TABLE_LIST?.i18n?.exportCsv || 'CSV',
					xlsx: DTBK_TABLE_LIST?.i18n?.exportXlsx || 'Excel (XLSX)',
				},
				cancelText: DTBK_TABLE_LIST?.i18n?.cancel || DTBK_TABLE_LIST?.i18n?.close || 'Cancel',
				width: 520,
			};

			this.changeStatusUI = {
				title: DTBK_TABLE_LIST?.i18n?.statusTitle || 'Change Table Status',
				current: DTBK_TABLE_LIST?.i18n?.statusCurrent || 'Current Status',
			};

			this.deleteTableUI = {
				title: DTBK_TABLE_LIST?.i18n?.deleteTitle || 'Delete Table',
				success: DTBK_TABLE_LIST?.i18n?.deletedSuccess || 'Table successfully deleted',
			};

			this.importUi = {
				title: DTBK_TABLE_LIST?.i18n?.importTitle || 'Import Dynamic Table(s)',
				prompt: DTBK_TABLE_LIST?.i18n?.importPrompt || 'Select import format:',
				formats: {
					json: DTBK_TABLE_LIST?.i18n?.importJson || 'Restore (JSON)',
					csv: DTBK_TABLE_LIST?.i18n?.importCsv || 'CSV',
					xlsx: DTBK_TABLE_LIST?.i18n?.importXlsx || 'Excel (XLSX)',
				},
				cancelText: DTBK_TABLE_LIST?.i18n?.cancel || DTBK_TABLE_LIST?.i18n?.close || 'Cancel',
				width: 520,
			};

			this.initEvents();
		}

		/**
		 * Initialize event handlers.
		 *
		 * @since    1.1.1  Added support for table exports.
		 * @since    1.1.0
		 */
		initEvents() {
			// Prepare the dialog container
			this.ensureViewDialog();
			this.ensureExportDialog();
			this.ensureChangeStatusDialog();
			this.ensureDeleteDialog();
			this.ensureImportDialog();

			// Handle click on row "view" links
			this.$doc.on('click', 'a[data-dtbk-action="view"]', e => this.prepareViewTable(e));
			this.$doc.on('click', 'a[data-dtbk-action="export"]', e => this.prepareExportTable(e));
			this.$doc.on('click', '#dtbk-import-table-trigger', e => this.prepareImportTable(e));
			this.$doc.on('click', 'a[data-dtbk-action="change_status"]', e =>
				this.prepareChangeTableStatus(e)
			);
			this.$doc.on('click', 'a[data-dtbk-action="delete"]', e => this.prepareDeleteTable(e));
		}

		// methods

		/**
		 * Initialize View dialog box.
		 *
		 * @since    1.1.0
		 * @since    1.1.1  Renamed from endureDialog to ensureViewDialog.
		 */
		ensureViewDialog() {
			if (this.$(`#${this.listRowId}`).length) {
				return;
			}

			const title = DTBK_TABLE_LIST?.i18n?.view || 'Table Data';
			this.$('body').append(
				`<div id="${this.listRowId}" title="${this.escapeAttr(title)}" style="display:none"></div>`
			);
		}

		/**
		 * Retrieve table id and prepare viewing data retrieval.
		 *
		 * @since    1.1.0
		 *
		 * @param {Object} e Event object.
		 */
		prepareViewTable(e) {
			e.preventDefault();

			const $link = this.$(e.currentTarget);
			const id = Number.parseInt($link.data('id'), 10);

			if (!id) {
				return;
			}

			this.openViewTable(id);
		}

		/**
		 * Get table data and build HTML for display.
		 *
		 * @since    1.1.0
		 *
		 * @param {number} id Table ID.
		 */
		async openViewTable(id) {
			this.openViewDialog('<p>Loading…</p>');

			const htmlHeader = `
				<div class="dtbk-view-table-data">
				<p class="dtbk-view-table-data">Table ID: ${id}</p>
			`;

			try {
				const response = await this.postView(id);
				const tableData = response.data.cells ? JSON.parse(response.data.cells) : null;

				let htmlBody = `<tbody>`;

				tableData.forEach(row => {
					htmlBody += `<tr><td>${this.escapeAttr(row.row_id)}</td>`;

					row.cells.forEach(cell => {
						htmlBody += `<td>${this.escapeAttr(cell)}</td>`;
					});

					htmlBody += `</tr>`;
				});
				htmlBody += `</tbody>`;

				const html = `${htmlHeader}<table border="1" cellpadding="5" cellspacing="0">${htmlBody}</table></div>`;
				this.openViewDialog(html);
			} catch (error) {
				const message = DTBK_TABLE_LIST?.i18n?.error || 'Request failed. Please try again.';

				this.openViewDialog(
					`<div class="notice notice-error"><p>${this.escapeHtml(message)}</p></div>`
				);
			}
		}

		/**
		 * Fetch the table data for viewing.
		 *
		 * @since    1.1.0
		 *
		 * @param {number} id Table ID.
		 * @return {string} Formatted JSON of table data.
		 */
		async postView(id) {
			// Create the request call
			const fd = new FormData();
			fd.append('action', 'dtbk_view_table');
			fd.append('_ajax_nonce', DTBK_TABLE_LIST.nonce);
			fd.append('id', id);

			// Fetch the data
			const res = await fetch(DTBK_TABLE_LIST.ajaxUrl, {
				method: 'POST',
				body: fd,
				credentials: 'same-origin',
			});

			// Capture and return the JSON response
			const json = await res.json();
			return json;
		}

		/**
		 * Open dialog to select the export format and trigger the download.
		 *
		 * @since    1.1.0
		 *
		 * @param {string} contentHtml
		 */
		openViewDialog(contentHtml) {
			const $dlg = this.$(`#${this.listRowId}`);
			const minWidth = Math.min(1000, this.$(window).width() - 80);
			const tableWidth = $dlg.html(contentHtml).width;

			$dlg.html(contentHtml).dialog({
				modal: true,
				resizable: true,
				draggable: true,
				width: Math.min(minWidth, tableWidth),
				position: { my: 'center', at: 'center', of: window },
				buttons: [
					{
						text: DTBK_TABLE_LIST?.i18n?.close || 'Close',
						class: 'button',
						click() {
							$dlg.dialog('close');
						},
					},
				],
				close() {
					$dlg.dialog('destroy');
				},
			});
		}

		/**
		 * Initialize Export dialog box.
		 *
		 * @since    1.1.1
		 */
		ensureExportDialog() {
			if (this.$(`#${this.exportDialogId}`).length) {
				return;
			}

			this.$('body').append(`<div id="${this.exportDialogId}" style="display:none;"></div>`);
		}

		/**
		 * Retrieve table id(s) and prepare for export.
		 *
		 * @since    1.1.1
		 *
		 * @param {Object} e Event object.
		 */
		prepareExportTable(e) {
			e.preventDefault();

			const $link = this.$(e.currentTarget);

			// Support either data-id (single) or data-ids (future bulk reuse)
			const id = $link.data('id');
			const ids = $link.data('ids');

			this.exportIds = '';

			if (ids) {
				this.exportIds = String(ids);
			} else if (id) {
				this.exportIds = String(Number.parseInt(id, 10));
			}

			if (!this.exportIds) {
				return;
			}

			this.exportNonce = String($link.data('nonce') || DTBK_TABLE_LIST?.exportNonce || '');

			this.openExportDialog();
		}

		/**
		 * Get table data and build HTML for export display.
		 *
		 * @since    1.1.1
		 *
		 * @param {number} id Table ID.
		 */
		openExportDialog() {
			const $dlg = this.$(`#${this.exportDialogId}`);

			const title = this.exportUi.title;
			const prompt = this.exportUi.prompt;
			const comingSoon = DTBK_TABLE_LIST?.i18n?.comingSoon || 'Coming soon';
			// const isProSubscribed = false; // flip to true when subscription active
			const showComingSoonBadges = true; // independent toggle

			const formats = {
				json: {
					iconKey: 'fileJSON',
					label: this.exportUi.formats.json,
					isPro: false,
					isComingSoon: false,
					isBackup: true,
				},
				csv: {
					iconKey: 'fileCSV',
					label: this.exportUi.formats.csv,
					isPro: true,
					isComingSoon: true, // you can turn this off later even if still Pro
					isBackup: false,
				},
				xlsx: {
					iconKey: 'fileXLSX',
					label: this.exportUi.formats.xlsx,
					isPro: true,
					isComingSoon: true,
					isBackup: false,
				},
			};

			const optionTile = ({ format, label, iconKey, isPro, isComingSoon, isBackup }) => {
				const iconUrl = DTBK_TABLE_LIST?.icons?.[iconKey] || '';

				// --- enable/disable logic ---
				let enabled = true;
				if (isComingSoon) enabled = false;
				if (isPro && !this.isProSubscribed) enabled = false;

				// const disabledAttr = enabled ? '' : 'disabled="disabled" aria-disabled="true"';
				const disabledAttr = enabled ? '' : 'aria-disabled="true"';
				const lockedClass = enabled ? '' : 'is-locked';

				// --- PRO+LOCK unified badge (only when pro feature AND not subscribed) ---
				const proLockBadge =
					isPro && !this.isProSubscribed
						? `
						<span class="dtbk-tile-badge dtbk-tile-badge--prolock" aria-hidden="true">
							<span class="dtbk-pro-text">PRO</span>
							<span class="dashicons dashicons-lock dtbk-pro-lock-icon" aria-hidden="true"></span>
						</span>
					`
						: '';

				const comingSoonBadge =
					showComingSoonBadges && isComingSoon
						? `
							<a href="#"
								class="dtbk-tile-info"
								data-dtbk-coming-soon="1"
								aria-label="${this.escapeAttr(comingSoon)}"
								role="button"
								tabindex="-1"
							>
								<span class="dashicons dashicons-info-outline" aria-hidden="true"></span>
								<span class="dtbk-tooltip" role="tooltip">${this.escapeHtml(comingSoon)}</span>
							</a>
						`
						: '';

				return `
					<button type="button"
						class="dtbk-export-tile ${lockedClass}"
						data-dtbk-export-format="${this.escapeAttr(format)}"
						aria-label="${this.escapeAttr(label)}"
						tabindex="0"
						${disabledAttr}
					>
						${comingSoonBadge}
						${proLockBadge}

						<div>
							${
								iconUrl
									? `<img class="dtbk-export-tile__icon"
										src="${this.escapeAttr(iconUrl)}"
										alt=""
										aria-hidden="true" />`
									: ''
							}

							${isBackup ? `<strong><em>Backup</em></strong>` : ''}
						</div>

						<span class="screen-reader-text">${this.escapeHtml(label)}</span>
					</button>
				`;
			};

			const bodyHtml = `
				<div class="dtbk-export-dialog-body">
					<p class="dtbk-export-prompt">${this.escapeHtml(prompt)}</p>

					<div class="dtbk-export-tile-grid">
						${optionTile({ format: 'json', ...formats.json })}
						${optionTile({ format: 'csv', ...formats.csv })}
						${optionTile({ format: 'xlsx', ...formats.xlsx })}
					</div>
				</div>
			`;

			$dlg.attr('title', this.escapeAttr(title)).html(bodyHtml);

			this.$doc.off('click.dtbkExportPick');
			this.$doc.on(
				'click.dtbkExportPick',
				`#${this.exportDialogId} [data-dtbk-export-format]`,
				e => {
					e.preventDefault();

					const $btn = this.$(e.currentTarget);
					const isAriaDisabled = String($btn.attr('aria-disabled')) === 'true';
					const isLocked = $btn.hasClass('is-locked');

					// locked options do nothing (or show an upsell notice if you want)
					if (isAriaDisabled || isLocked) {
						return;
					}

					const format = $btn.attr('data-dtbk-export-format');
					this.startDownload(format);
				}
			);

			this.$doc.off('click.dtbkComingSoon');
			this.$doc.on('click.dtbkComingSoon', `#${this.exportDialogId} .dtbk-tile-info`, e => {
				e.preventDefault();
				e.stopPropagation();
			});

			$dlg.dialog({
				modal: true,
				resizable: false,
				draggable: true,
				width: this.exportUi.width,
				position: { my: 'center', at: 'center', of: window },
				buttons: [
					{
						text: DTBK_TABLE_LIST?.i18n?.cancel || 'Cancel',
						class: 'button',
						click: () => $dlg.dialog('close'),
					},
				],
				close: () => {
					$dlg.dialog('destroy');
				},
			});
		}

		/**
		 * Initialize Change Status dialog box.
		 *
		 * @since    1.4.1
		 */
		ensureChangeStatusDialog() {
			if (this.$(`#${this.listRowId}`).length) {
				return;
			}

			this.$('body').append(`<div id="${this.listRowId}" style="display:none"></div>`);
		}

		/**
		 * Retrieve table id and prepare data retrieval.
		 *
		 * @since    1.4.1
		 *
		 * @param {Object} e Event object.
		 */
		prepareChangeTableStatus(e) {
			e.preventDefault();

			const $link = this.$(e.currentTarget);
			const id = Number.parseInt($link.data('id'), 10);

			if (!id) {
				return;
			}

			this.openChangeTableStatus(id);
		}

		/**
		 * Get table data and build HTML for display.
		 *
		 * @since    1.4.1
		 *
		 * @param {number} id Table ID.
		 */
		async openChangeTableStatus(id) {
			this.openChangeTableStatusDialog('<p>Loading...</p>', id, true);

			try {
				const response = await this.getTableMeta(id);
				const tableMeta = response?.data?.table_meta ? JSON.parse(response.data.table_meta) : null;

				if (!response?.success || !tableMeta?.status) {
					throw new Error(
						DTBK_TABLE_LIST?.i18n?.unexpectedResponse ||
							'The server returned an unexpected response.'
					);
				}

				let newStatus = '';
				switch (tableMeta.status) {
					case 'saved':
						return;
					case 'new':
						if (tableMeta.link_status === 'Linked') {
							newStatus = 'saved';
						} else if (tableMeta.link_status === 'Unlinked' || tableMeta.link_status === 'Broken') {
							newStatus = 'loaded';
						} else {
							return;
						}
						break;
					case 'orphan':
					case 'deleted':
					case 'unknown':
						if (tableMeta.link_status === 'Linked') {
							newStatus = 'saved';
						} else if (tableMeta.link_status === 'Unlinked' || tableMeta.link_status === 'Broken') {
							newStatus = 'loaded';
						} else {
							return;
						}
						break;
				}
				console.log('Link status = ', tableMeta);

				const currentTableStatus =
					tableMeta.status.charAt(0).toUpperCase() + tableMeta.status.slice(1);
				const newTableStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

				const html = `
					<form class="dtbk-change-table-status">
						<div class="dtbk-field-pair-block">
							<strong class="dtbk-field-pair-label">Current status for table: "${this.escapeHtml(tableMeta.name)} (${id})":</strong>
							<span class="dtbk-field-pair-value">${this.escapeHtml(currentTableStatus)}</span>
						</div>

						<div class="dtbk-field-pair-block">
							<strong class="dtbk-field-pair-label">Confirm you would like to change this table's status to: "${this.escapeHtml(tableMeta.name)} (${id})":</strong>
							<span
								class="dtbk-field-pair-value"
								id="new-status"
								data="newStatus"
								>${this.escapeHtml(newTableStatus)}
							</span>
						</div>
					</form>
				`;

				this.openChangeTableStatusDialog(html, id, false, newStatus);
			} catch (error) {
				const message = DTBK_TABLE_LIST?.i18n?.error || 'Request failed. Please try again.';

				this.openChangeTableStatusDialog(
					`<div class="notice notice-error"><p>${this.escapeHtml(message)}</p></div>`
				);
			}
		}

		/**
		 * Fetch metadata for one table.
		 *
		 * @since    1.4.1
		 *
		 * @param {number} id Table ID.
		 * @return {string} Formatted JSON of table data.
		 */
		async getTableMeta(id) {
			// Create the request call
			const fd = new FormData();
			fd.append('action', 'dtbk_get_table_status');
			fd.append('_ajax_nonce', DTBK_TABLE_LIST.nonce);
			fd.append('id', id);

			// Fetch the data
			const res = await fetch(DTBK_TABLE_LIST.ajaxUrl, {
				method: 'POST',
				body: fd,
				credentials: 'same-origin',
			});

			// Capture and return the JSON response
			const json = await res.json();
			return json;
		}

		/**
		 * Open dialog for updating table status.
		 *
		 * @since    1.4.1
		 *
		 * @param {string}  contentHtml      Formatted HTML for the Change Stateus Dialog.
		 * @param {number}  id               Table ID
		 * @param {boolean} isSubmitDisabled Disable the delete button
		 * @param {string}  newStatus        New table status for update
		 */
		async openChangeTableStatusDialog(
			contentHtml,
			id = 0,
			isSubmitDisabled = false,
			newStatus = ''
		) {
			const title = this.changeStatusUI.title;
			const $dlg = this.$(`#${this.listRowId}`);
			const maxWidth = Math.min(1000, this.$(window).width() - 80);
			$dlg.attr('title', this.escapeAttr(title)).html(contentHtml);

			const contentWidth = Math.ceil($dlg.get(0)?.scrollWidth || 0);
			const dialogWidth = Math.max(400, Math.min(maxWidth, contentWidth + 40));

			$dlg.html(contentHtml).dialog({
				modal: true,
				resizable: true,
				draggable: true,
				width: dialogWidth,
				minWidth: 400,
				position: { my: 'center', at: 'center', of: window },
				buttons: [
					{
						text: DTBK_TABLE_LIST?.i18n?.close || 'Close',
						class: 'button',
						click() {
							$dlg.dialog('close');
						},
					},
					{
						text: DTBK_TABLE_LIST?.i18n?.submit || 'Submit',
						id: 'dtbkDialogSubmit',
						class: 'button-primary',
						click: async () => {
							await this.submitChangeTableStatus(id, newStatus);
						},
					},
				],
				close() {
					$dlg.dialog('destroy');
				},
			});

			const $submitButton = this.$('#dtbkDialogSubmit');
			const disableSubmit = isSubmitDisabled || !id || !newStatus;

			$submitButton.prop('disabled', disableSubmit);
			$submitButton.toggleClass('disabled', disableSubmit);
		}

		/**
		 * Submit a status change request.
		 *
		 * @since    1.4.1
		 *
		 * @param {number} id        Table ID.
		 * @param {string} newStatus Status to set for table.
		 */
		async submitChangeTableStatus(id, newStatus = '') {
			const requestedStatus = String(newStatus || '').trim();

			if (!id || !requestedStatus) {
				return;
			}

			const $dlg = this.$(`#${this.listRowId}`);
			const $submitButton = this.$('#dtbkDialogSubmit');

			$submitButton.prop('disabled', true).addClass('disabled');

			try {
				const response = await this.updateTableStatus(id, requestedStatus);
				const successMessage = response?.data?.message || 'Table status updated successfully.';

				$dlg.dialog('close');
				this.openViewDialog(
					`<div class="notice notice-success"><p>${this.escapeHtml(successMessage)}</p></div>`
				);
				window.setTimeout(() => window.location.reload(), 700);
				window.location.reload();
			} catch (error) {
				const message =
					error?.message || DTBK_TABLE_LIST?.i18n?.error || 'Request failed. Please try again.';
				$dlg.find('.dtbk-status-error').remove();
				$dlg
					.find('.dtbk-change-table-status')
					.prepend(
						`<div class="notice notice-error dtbk-status-error"><p>${this.escapeHtml(message)}</p></div>`
					);
			} finally {
				$submitButton.prop('disabled', false).removeClass('disabled');
			}
		}

		/**
		 * Update table status.
		 *
		 * @since    1.4.1
		 *
		 * @param {number} id        Table ID.
		 * @param {string} newStatus Requested table status.
		 * @return {string} Formatted JSON of table data.
		 */
		async updateTableStatus(id, newStatus) {
			// Create the request call
			const fd = new FormData();
			fd.append('action', 'dtbk_put_update_status');
			fd.append('_ajax_nonce', DTBK_TABLE_LIST.nonce);
			fd.append('id', id);
			fd.append('newStatus', newStatus);

			// Fetch the data
			const res = await fetch(DTBK_TABLE_LIST.ajaxUrl, {
				method: 'POST',
				body: fd,
				credentials: 'same-origin',
			});

			const text = await res.text();
			let json = null;

			try {
				json = text ? JSON.parse(text) : null;
			} catch (err) {
				throw new Error(
					DTBK_TABLE_LIST?.i18n?.unexpectedResponse || 'The server returned an unexpected response.'
				);
			}

			if (!json) {
				throw new Error(
					DTBK_TABLE_LIST?.i18n?.unexpectedResponse || 'The server returned an unexpected response.'
				);
			}

			if (!res.ok || !json?.success) throw new Error(json?.data?.message || 'Request failed.');

			return json;
		}

		/**
		 * Initialize Change Status dialog box.
		 *
		 * @since    1.4.1
		 */
		ensureDeleteDialog() {
			if (this.$(`#${this.listRowId}`).length) {
				return;
			}

			this.$('body').append(`<div id="${this.listRowId}" style="display:none"></div>`);
		}

		/**
		 * Retrieve table id and prepare delete.
		 *
		 * @since    1.4.1
		 *
		 * @param {Object} e Event object.
		 */
		prepareDeleteTable(e) {
			e.preventDefault();

			const $link = this.$(e.currentTarget);
			const id = Number.parseInt($link.data('id'), 10);

			if (!id) {
				return;
			}

			this.openDeleteTable(id);
		}

		/**
		 * Get table data and build HTML for display.
		 *
		 * @since    1.4.1
		 *
		 * @param {number} id Table ID.
		 */
		async openDeleteTable(id) {
			this.openDeleteTableDialog('<p>Loading...</p>', id, true);

			try {
				const response = await this.getTableMeta(id);
				const tableMeta = response?.data?.table_meta ? JSON.parse(response.data.table_meta) : null;

				if (!response?.success || !tableMeta?.status) {
					throw new Error(
						DTBK_TABLE_LIST?.i18n?.unexpectedResponse ||
							'The server returned an unexpected response.'
					);
				}

				const multipleLinks =
					tableMeta.link_status === 'Corrupted' && tableMeta.link_details.matched_block_count > 1
						? true
						: false;

				console.log('Table meta returned: ', tableMeta);
				let html = '';

				switch (tableMeta.link_status) {
					case 'Unlinked':
					case 'Broken': // No matching block
						html = `
							<form class="dtbk-delete-table">
								<strong>Confirm delete for table "${this.escapeHtml(tableMeta.name)} (${id})"</strong>
								</br>
								<p><em>This action cannot be undone.</em></p>
							</form>
						`;
						break;
					case 'Corrupted':
						if (multipleLinks) {
							html = `
								<form class="dtbk-delete-table-corrupted-link">
									<strong>Table "${this.escapeHtml(tableMeta.name)} (${id})"</strong> is linked to
										multiple blocks.  Would you like to remove the related post blocks?  If so, note
										this will change the appearance if the impacted posts.
										</br>
									<p><em>This action cannot be undone.</em></p>
								</form>
							`;
							break;
						} else {
							html = `
								<form class="dtbk-delete-table-corrupted-link">
									<strong>Table "${this.escapeHtml(tableMeta.name)} (${id})"</strong> contains partially
										linked blocks.  Would you like to remove the related post block?  If so, note
										this will change the appearance if the impacted post.
										</br>
									<p><em>This action cannot be undone.</em></p>
								</form>
							`;
							break;
						}
				}
				this.openDeleteTableDialog(html, id);
			} catch (error) {
				const message = DTBK_TABLE_LIST?.i18n?.error || 'Request failed. Please try again.';

				this.openDeleteTableDialog(
					`<div class="notice notice-error"><p>${this.escapeHtml(message)}</p></div>`
				);
			}
		}

		/**
		 * Open dialog for updating table status.
		 *
		 * @since    1.4.1
		 *
		 * @param {string}  contentHtml      Formatted HTML for the Change Stateus Dialog.
		 * @param {number}  id               Table id
		 * @param {boolean} isDeleteDisabled Disable the delete button
		 */
		async openDeleteTableDialog(contentHtml, id = 0, isDeleteDisabled = false) {
			const title = this.deleteTableUI.title;
			const $dlg = this.$(`#${this.listRowId}`);

			const hasCorruptedLinkForm =
				this.$(contentHtml).filter('.dtbk-delete-table-corrupted-link').length > 0 ||
				this.$(contentHtml).find('.dtbk-delete-table-corrupted-link').length > 0;

			const deleteClass = hasCorruptedLinkForm ? 'button-secondary' : 'button-primary';

			const buttons = [
				{
					text: DTBK_TABLE_LIST?.i18n?.close || 'Close',
					class: 'button',
					click() {
						$dlg.dialog('close');
					},
				},
				{
					text: DTBK_TABLE_LIST?.i18n?.delete || 'Delete Table',
					id: 'dtbkDialogDelete',
					class: deleteClass,
					click: async () => {
						await this.submitDeleteTable(id, false);
					},
				},
			];

			if (hasCorruptedLinkForm) {
				buttons.push({
					text: DTBK_TABLE_LIST?.i18n?.deleteWithBlock || 'Delete Table & Block',
					id: 'dtbkDialogDeleteCorrupted',
					class: 'button-primary',
					click: async () => {
						await this.submitDeleteTable(id, true);
					},
				});
			}

			const maxWidth = Math.min(1000, this.$(window).width() - 80);

			$dlg.attr('title', this.escapeAttr(title)).html(contentHtml);
			const contentWidth = Math.ceil($dlg.get(0)?.scrollWidth || 0);
			const dialogWidth = Math.max(400, Math.min(maxWidth, contentWidth + 40));

			$dlg.html(contentHtml).dialog({
				modal: true,
				resizable: true,
				draggable: true,
				width: dialogWidth,
				minWidth: 400,
				position: { my: 'center', at: 'center', of: window },
				buttons,
				close() {
					$dlg.dialog('destroy');
				},
			});

			const $deleteButton = this.$('#dtbkDialogDelete');
			const $deleteButtonAndBlock = this.$('#dtbkDialogDeleteCorrupted');
			const disableDelete = isDeleteDisabled || !id;

			$deleteButton.prop('disabled', disableDelete);
			$deleteButton.toggleClass('disabled', disableDelete);

			if (hasCorruptedLinkForm) {
				$deleteButtonAndBlock.prop('disabled', disableDelete);
				$deleteButtonAndBlock.toggleClass('disabled', disableDelete);
			}
		}

		/**
		 * Submit a status change request.
		 *
		 * @since    1.4.1
		 *
		 * @param {number}  id           Table ID.
		 * @param {boolean} includeBlock Delete attached block(s) too
		 */
		async submitDeleteTable(id, includeBlock = false) {
			if (!id) {
				return;
			}

			const $dlg = this.$(`#${this.listRowId}`);
			const $deleteButton = this.$('#dtbkDialogDelete');
			const $deleteButtonCorrupted = this.$('#dtbkDialogDeleteCorrupted');
			$deleteButton.prop('disabled', true).addClass('disabled');
			$deleteButtonCorrupted.prop('disabled', true).addClass('disabled');

			try {
				const response = await this.deleteTable(id, includeBlock);

				if (!response?.data?.deleted) {
					throw new Error(
						DTBK_TABLE_LIST?.i18n?.unexpectedResponse ||
							'The server returned an unexpected response.'
					);
				}

				const successMessage =
					response?.data?.message || this.deleteTableUI.success || 'Table deleted.';

				$dlg.dialog('close');
				this.openViewDialog(
					`<div class="notice notice-success"><p>${this.escapeHtml(successMessage)}</p></div>`
				);

				window.setTimeout(() => window.location.reload(), 700);
			} catch (error) {
				const message =
					error?.message || DTBK_TABLE_LIST?.i18n?.error || 'Request failed. Please try again.';

				$dlg.find('.dtbk-status-error').remove();

				const errorNotice = `<div class="notice notice-error dtbk-status-error"><p>${this.escapeHtml(message)}</p></div>`;
				const $form = $dlg.find('.dtbk-delete-table');

				if ($form.length) {
					$form.prepend(errorNotice);
				} else {
					$dlg.prepend(errorNotice);
				}
			} finally {
				$deleteButton.prop('disabled', false).removeClass('disabled');
				$deleteButtonCorrupted.prop('disabled', true).removeClass('disabled');
			}
		}

		/**
		 * Delete table AJAX call.
		 *
		 * @since    1.4.1
		 *
		 * @param {number}  id           Table ID.
		 * @param {boolean} includeBlock Delete attached block(s) too
		 * @return {string} Formatted JSON of table data.
		 */
		async deleteTable(id, includeBlock = false) {
			// Create the request call
			const fd = new FormData();
			fd.append('action', 'dtbk_delete_table');
			fd.append('_ajax_nonce', DTBK_TABLE_LIST.nonce);
			fd.append('id', id);
			fd.append('id', id);
			fd.append('delete_related_block', includeBlock);

			// Fetch the data
			const res = await fetch(DTBK_TABLE_LIST.ajaxUrl, {
				method: 'POST',
				body: fd,
				credentials: 'same-origin',
			});

			const text = await res.text();
			let json = null;

			try {
				json = text ? JSON.parse(text) : null;
			} catch (err) {
				throw new Error(
					DTBK_TABLE_LIST?.i18n?.unexpectedResponse || 'The server returned an unexpected response.'
				);
			}

			if (!json) {
				throw new Error(
					DTBK_TABLE_LIST?.i18n?.unexpectedResponse || 'The server returned an unexpected response.'
				);
			}

			if (!res.ok || !json?.success) throw new Error(json?.data?.message || 'Request failed.');

			return json;
		}

		/**
		 * Initialize Export dialog box.
		 *
		 * @since    1.1.1
		 */
		ensureImportDialog() {
			if (this.$(`#${this.importDialogId}`).length) {
				return;
			}

			this.$('body').append(`<div id="${this.importDialogId}" style="display:none;"></div>`);
		}

		/**
		 * Retrieve table id(s) and prepare for import.
		 *
		 * @since    1.4.0
		 *
		 * @param {Object} e Event object.
		 */
		prepareImportTable(e) {
			e.preventDefault();
			this.openImportDialog();
		}

		/**
		 * Get table data and build HTML for import display.
		 *
		 * @since    1.4.0
		 *
		 * @param {number} id Table ID.
		 */
		openImportDialog() {
			const $dlg = this.$(`#${this.importDialogId}`);

			const title = this.importUi.title;
			const prompt = this.importUi.prompt;
			const comingSoon = DTBK_TABLE_LIST?.i18n?.comingSoon || 'Coming soon';
			// const isProSubscribed = false; // flip to true when subscription active
			const showComingSoonBadges = true; // independent toggle

			const formats = {
				json: {
					iconKey: 'fileJSON',
					label: this.importUi.formats.json,
					isPro: false,
					isComingSoon: false,
					isBackup: true,
				},
				csv: {
					iconKey: 'fileCSV',
					label: this.importUi.formats.csv,
					isPro: false,
					isComingSoon: false,
					isBackup: false,
				},
				xlsx: {
					iconKey: 'fileXLSX',
					label: this.importUi.formats.xlsx,
					isPro: true,
					isComingSoon: true,
					isBackup: false,
				},
			};

			const optionTile = ({ format, label, iconKey, isPro, isComingSoon, isBackup }) => {
				const iconUrl = DTBK_TABLE_LIST?.icons?.[iconKey] || '';

				// --- enable/disable logic ---
				let enabled = true;
				if (isComingSoon) enabled = false;
				if (isPro && !this.isProSubscribed) enabled = false;

				// const disabledAttr = enabled ? '' : 'disabled="disabled" aria-disabled="true"';
				const disabledAttr = enabled ? '' : 'aria-disabled="true"';
				const lockedClass = enabled ? '' : 'is-locked';

				// --- PRO+LOCK unified badge (only when pro feature AND not subscribed) ---
				const proLockBadge =
					isPro && !this.isProSubscribed
						? `
						<span class="dtbk-tile-badge dtbk-tile-badge--prolock" aria-hidden="true">
							<span class="dtbk-pro-text">PRO</span>
							<span class="dashicons dashicons-lock dtbk-pro-lock-icon" aria-hidden="true"></span>
						</span>
					`
						: '';

				const comingSoonBadge =
					showComingSoonBadges && isComingSoon
						? `
							<a href="#"
								class="dtbk-tile-info"
								data-dtbk-coming-soon="1"
								aria-label="${this.escapeAttr(comingSoon)}"
								role="button"
								tabindex="-1"
							>
								<span class="dashicons dashicons-info-outline" aria-hidden="true"></span>
								<span class="dtbk-tooltip" role="tooltip">${this.escapeHtml(comingSoon)}</span>
							</a>
						`
						: '';

				return `
					<button type="button"
						class="dtbk-import-tile ${lockedClass}"
						data-dtbk-import-format="${this.escapeAttr(format)}"
						aria-label="${this.escapeAttr(label)}"
						tabindex="0"
						${disabledAttr}
					>
						${comingSoonBadge}
						${proLockBadge}

						<div>
							${
								iconUrl
									? `<img class="dtbk-import-tile__icon"
										src="${this.escapeAttr(iconUrl)}"
										alt=""
										aria-hidden="true" />`
									: ''
							}

							${isBackup ? `<strong><em>Restore</em></strong>` : ''}
						</div>

						<span class="screen-reader-text">${this.escapeHtml(label)}</span>
					</button>
				`;
			};

			const bodyHtml = `
				<div class="dtbk-import-dialog-body">
					<p class="dtbk-import-prompt">${this.escapeHtml(prompt)}</p>

					<div class="dtbk-import-tile-grid">
						${optionTile({ format: 'json', ...formats.json })}
						${optionTile({ format: 'csv', ...formats.csv })}
						${optionTile({ format: 'xlsx', ...formats.xlsx })}
					</div>
				</div>
			`;

			$dlg.attr('title', this.escapeAttr(title)).html(bodyHtml);

			this.$doc.off('click.dtbkImportPick');
			this.$doc.on(
				'click.dtbkImportPick',
				`#${this.importDialogId} [data-dtbk-import-format]`,
				e => {
					e.preventDefault();

					const $btn = this.$(e.currentTarget);
					const isAriaDisabled = String($btn.attr('aria-disabled')) === 'true';
					const isLocked = $btn.hasClass('is-locked');

					// locked options do nothing (or show an upsell notice if you want)
					if (isAriaDisabled || isLocked) {
						return;
					}

					const format = $btn.attr('data-dtbk-import-format');
					this.openImportUploadStep(format);
				}
			);

			this.$doc.off('click.dtbkComingSoon');
			this.$doc.on('click.dtbkComingSoon', `#${this.importDialogId} .dtbk-tile-info`, e => {
				e.preventDefault();
				e.stopPropagation();
			});

			$dlg.dialog({
				modal: true,
				resizable: false,
				draggable: true,
				width: this.importUi.width,
				position: { my: 'center', at: 'center', of: window },
				buttons: [
					{
						text: DTBK_TABLE_LIST?.i18n?.cancel || 'Cancel',
						class: 'button',
						click: () => $dlg.dialog('close'),
					},
				],
				close: () => {
					this.$doc.off('.dtbkImportUpload');
					this.importState = this.getEmptyImportState();
					$dlg.dialog('destroy');
				},
			});
		}

		/**
		 * Create an empty import state template.
		 *
		 * @since    1.4.0
		 */
		getEmptyImportState() {
			return {
				format: '',
				file: null,
				analysis: null,
				isBusy: false,
				options: {
					firstRowHeader: true,
					itemIndex: 0,
					restoreMode: 'create',
				},
			};
		}

		/**
		 * Open dialog to upload the file for importing
		 *
		 * @since    1.4.0
		 *
		 * @param {string} format Selected file format to import.
		 */
		openImportUploadStep(format) {
			const $dlg = this.$(`#${this.importDialogId}`);
			const isCsv = format === 'csv';
			const formatLabel = this.importUi?.formats?.[format] || String(format).toUpperCase();
			const accept = this.getImportAccept(format);

			this.importState.format = format;
			this.importState.file = null;
			this.importState.analysis = null;
			this.importState.options = {
				firstRowHeader: true,
				itemIndex: 0,
				restoreMode: 'create',
			};

			$dlg.html(`
				<div class="dtbk-import-upload">
					<p class="dtbk-import-upload__intro">
						${this.escapeHtml(
							DTBK_TABLE_LIST?.i18n?.importAnalyzePrompt ||
								'Upload a file to validate and preview the import.'
						)}
					</p>

					<p class="dtbk-import-upload__target">
						${this.escapeHtml(
							DTBK_TABLE_LIST?.i18n?.importIndependentNotice ||
								'Imported tables are added to the library. JSON restores can replace an existing local table when the imported table ID already exists.'
						)}
					</p>

					<div class="dtbk-import-dropzone" data-dtbk-import-dropzone tabindex="0" role="button"
						aria-label="${this.escapeAttr(
							DTBK_TABLE_LIST?.i18n?.importDropPrompt || 'Drop a file here or click to browse.'
						)}">
						<input class="dtbk-import-file-input" type="file" hidden
							accept="${this.escapeAttr(accept)}" />
						<strong>${this.escapeHtml(formatLabel)}</strong>
						<span>${this.escapeHtml(
							DTBK_TABLE_LIST?.i18n?.importDropPrompt || 'Drop a file here or click to browse.'
						)}</span>
						<button type="button" class="button" data-dtbk-import-browse>
							${this.escapeHtml(DTBK_TABLE_LIST?.i18n?.importSelectFile || 'Choose file')}
						</button>
						<p class="description" data-dtbk-import-file-name>
							${this.escapeHtml(DTBK_TABLE_LIST?.i18n?.importNoFile || 'No file selected.')}
						</p>
					</div>

					<div class="dtbk-import-options">
						<div>
							${
								isCsv
									? `<label class="dtbk-import-option">
										<input type="checkbox" data-dtbk-import-first-row checked />
										${this.escapeHtml(DTBK_TABLE_LIST?.i18n?.importFirstRowHeader || 'Treat first row as headers')}
									</label>`
									: ''
							}
						</div>

						<div class="dtbk-import-actions">
							<button type="button" class="button" data-dtbk-import-back>
								${this.escapeHtml(DTBK_TABLE_LIST?.i18n?.back || 'Back')}
							</button>
							<button type="button" class="button button-primary" data-dtbk-import-analyze>
								${this.escapeHtml(DTBK_TABLE_LIST?.i18n?.importAnalyze || 'Analyze File')}
							</button>
						</div>
					</div>

					<div class="dtbk-import-status" data-dtbk-import-status></div>
					<div class="dtbk-import-review" data-dtbk-import-review></div>
				</div>
			`);

			this.bindImportUploadEvents();
		}

		/**
		 * Bind import dialog to events and code for processing
		 *
		 * @since    1.4.0
		 */
		bindImportUploadEvents() {
			const dialogSelector = `#${this.importDialogId}`;
			const openImportFilePicker = () => {
				const input = this.$(`${dialogSelector} .dtbk-import-file-input`).get(0);
				if (input) {
					// File inputs need the native DOM click here; jQuery trigger() is ignored.
					input.click();
				}
			};

			this.$doc.off('.dtbkImportUpload');

			this.$doc.on('click.dtbkImportUpload', `${dialogSelector} [data-dtbk-import-browse]`, e => {
				e.preventDefault();
				openImportFilePicker();
			});

			this.$doc.on('change.dtbkImportUpload', `${dialogSelector} .dtbk-import-file-input`, e => {
				const file =
					e.currentTarget.files && e.currentTarget.files[0] ? e.currentTarget.files[0] : null;
				this.setImportSelectedFile(file);
			});

			this.$doc.on(
				'change.dtbkImportUpload',
				`${dialogSelector} [data-dtbk-import-first-row]`,
				() => {
					this.importState.analysis = null;
					this.$(`${dialogSelector} [data-dtbk-import-review]`).empty();
				}
			);

			this.$doc.on('click.dtbkImportUpload', `${dialogSelector} [data-dtbk-import-back]`, e => {
				e.preventDefault();
				this.importState = this.getEmptyImportState();
				this.openImportDialog();
			});

			this.$doc.on('click.dtbkImportUpload', `${dialogSelector} [data-dtbk-import-analyze]`, e => {
				e.preventDefault();
				void this.analyzeImport();
			});

			this.$doc.on('click.dtbkImportUpload', `${dialogSelector} [data-dtbk-import-commit]`, e => {
				e.preventDefault();
				void this.commitImport();
			});

			this.$doc.on(
				'change.dtbkImportUpload',
				`${dialogSelector} [data-dtbk-import-item-index]`,
				() => {
					void this.analyzeImport();
				}
			);

			this.$doc.on(
				'change.dtbkImportUpload',
				`${dialogSelector} [data-dtbk-import-restore-mode]`,
				e => {
					if (!this.importState.analysis) {
						return;
					}

					const restoreMode = String(this.$(e.currentTarget).val() || 'create');
					const nextAnalysis = {
						...this.importState.analysis,
						options: {
							...(this.importState.analysis.options || {}),
							restoreMode,
						},
						target:
							restoreMode === 'replace' && this.importState.analysis?.restore?.hasExistingTable
								? {
										id: Number(this.importState.analysis.restore.existingTableId || 0),
										tableName: this.importState.analysis.restore.existingTableName || '',
									}
								: { id: 0, tableName: DTBK_TABLE_LIST?.i18n?.importNewTableLabel || 'New table' },
					};
					this.importState.analysis = nextAnalysis;
					this.renderImportAnalysis(nextAnalysis);
				}
			);

			this.$doc.on(
				'input.dtbkImportUpload change.dtbkImportUpload',
				`${dialogSelector} [data-dtbk-import-header-name]`,
				() => {
					this.syncCsvPreviewHeaders();
				}
			);

			this.$doc.on('click.dtbkImportUpload', `${dialogSelector} [data-dtbk-import-dropzone]`, e => {
				if (this.$(e.target).closest('button').length) {
					return;
				}

				openImportFilePicker();
			});

			this.$doc.on(
				'keydown.dtbkImportUpload',
				`${dialogSelector} [data-dtbk-import-dropzone]`,
				e => {
					if (e.key !== 'Enter' && e.key !== ' ') {
						return;
					}

					e.preventDefault();
					openImportFilePicker();
				}
			);

			this.$doc.on(
				'dragenter.dtbkImportUpload dragover.dtbkImportUpload',
				`${dialogSelector} [data-dtbk-import-dropzone]`,
				e => {
					e.preventDefault();
					e.stopPropagation();
					this.$(e.currentTarget).addClass('is-dragover');
				}
			);

			this.$doc.on(
				'dragleave.dtbkImportUpload dragend.dtbkImportUpload drop.dtbkImportUpload',
				`${dialogSelector} [data-dtbk-import-dropzone]`,
				e => {
					e.preventDefault();
					e.stopPropagation();
					this.$(e.currentTarget).removeClass('is-dragover');

					if (e.type !== 'drop') {
						return;
					}

					const dt = e.originalEvent?.dataTransfer;
					const file = dt?.files && dt.files[0] ? dt.files[0] : null;
					this.setImportSelectedFile(file);
				}
			);
		}

		/**
		 * Retrieve user input in preparation for processing the file
		 *
		 * @since    1.4.0
		 */
		collectImportOptions() {
			const $dlg = this.$(`#${this.importDialogId}`);

			this.importState.options = {
				firstRowHeader: $dlg.find('[data-dtbk-import-first-row]').is(':checked'),
				itemIndex: Number.parseInt($dlg.find('[data-dtbk-import-item-index]').val(), 10) || 0,
				headerNames: $dlg
					.find('[data-dtbk-import-header-name]')
					.map((index, el) => this.$(el).val())
					.get(),
				restoreMode: String(
					$dlg.find('[data-dtbk-import-restore-mode]:checked').val() ||
						this.importState?.analysis?.options?.restoreMode ||
						this.importState?.options?.restoreMode ||
						'create'
				),
			};

			return this.importState.options;
		}

		/**
		 * Render JSON restore options when the imported table ID already exists locally.
		 *
		 * @since    1.4.0
		 *
		 * @param analysis
		 */
		renderImportRestoreOptions(analysis) {
			const restore = analysis?.restore || {};
			const restoreMode = analysis?.options?.restoreMode || 'create';

			if (analysis?.format !== 'json' || !restore?.hasExistingTable) {
				return '';
			}

			const replaceLabel = `${DTBK_TABLE_LIST?.i18n?.importReplaceExisting || 'Replace existing table'} ${
				restore?.existingTableName || ''
			}${restore?.existingTableId ? ` (#${restore.existingTableId})` : ''}`;

			return `
				<div class="dtbk-import-restore-options">
					<p><strong>${this.escapeHtml(
						DTBK_TABLE_LIST?.i18n?.importRestoreModeTitle || 'Restore Options'
					)}</strong></p>
					<p class="description">${this.escapeHtml(
						DTBK_TABLE_LIST?.i18n?.importExistingTableFound ||
							'A local table with the imported table ID already exists.'
					)}</p>
					<label class="dtbk-import-option">
						<input type="radio" name="dtbk-import-restore-mode" data-dtbk-import-restore-mode value="replace"
							${restoreMode === 'replace' ? 'checked' : ''} />
						${this.escapeHtml(replaceLabel)}
					</label>
					<label class="dtbk-import-option">
						<input type="radio" name="dtbk-import-restore-mode" data-dtbk-import-restore-mode value="create"
							${restoreMode === 'create' ? 'checked' : ''} />
						${this.escapeHtml(DTBK_TABLE_LIST?.i18n?.importCreateNew || 'Create new independent table')}
					</label>
				</div>
			`;
		}

		/**
		 * Keep the CSV preview headers in sync with the custom header-name inputs
		 * without forcing another upload/analyze request on every keystroke.
		 *
		 * @since    1.4.0
		 */
		syncCsvPreviewHeaders() {
			const $dlg = this.$(`#${this.importDialogId}`);
			const headerNames = $dlg
				.find('[data-dtbk-import-header-name]')
				.map((index, el) => String(this.$(el).val() || '').trim())
				.get();

			if (!headerNames.length) {
				return;
			}

			this.importState.options = {
				...this.importState.options,
				headerNames,
			};

			$dlg.find('.dtbk-import-preview-table thead th').each((index, el) => {
				if (index === 0) {
					return;
				}

				const label = headerNames[index - 1];
				this.$(el).text(label || '');
			});
		}

		/**
		 * Display names of columns from imported file
		 *
		 * @since    1.4.0
		 *
		 * @param {Array} analysis Table data returned from REST.
		 */
		renderImportHeaderInputs(analysis) {
			const inputs = Array.isArray(analysis?.csvHeaderInputs) ? analysis.csvHeaderInputs : [];

			if (analysis?.format !== 'csv' || analysis?.options?.firstRowHeader || !inputs.length) {
				return '';
			}

			return `
				<div class="dtbk-import-header-editor">
					<p><strong>${this.escapeHtml(
						DTBK_TABLE_LIST?.i18n?.importHeaderNamesTitle || 'Column Names'
					)}</strong></p>
					<div class="dtbk-import-header-grid">
						${inputs
							.map(
								input => `
									<label class="dtbk-import-header-field">
										<span>${this.escapeHtml(input.label)}</span>
										<input type="text"
											class="regular-text"
											data-dtbk-import-header-name
											value="${this.escapeAttr(input.value || '')}" />
									</label>
								`
							)
							.join('')}
					</div>
				</div>
			`;
		}

		/**
		 * Attach the file name and size to the import dialog id
		 *
		 * @since    1.4.0
		 *
		 * @param file
		 */
		setImportSelectedFile(file) {
			this.importState.file = file || null;
			this.importState.analysis = null;

			const label = file
				? `${file.name} (${this.formatBytes(file.size || 0)})`
				: DTBK_TABLE_LIST?.i18n?.importNoFile || 'No file selected.';

			this.$(`#${this.importDialogId} [data-dtbk-import-file-name]`).text(label);
			this.clearImportStatus();
			this.$(`#${this.importDialogId} [data-dtbk-import-review]`).empty();
		}

		/**
		 * Clear transient import status messaging without disturbing the review UI.
		 *
		 * @since    1.4.0
		 */
		clearImportStatus() {
			this.$(`#${this.importDialogId} [data-dtbk-import-status]`).empty();
		}

		/**
		 * Render notices associated with import file review or commit
		 *
		 * @since    1.4.0
		 *
		 * @param {string} message Text of notice
		 * @param {string} type    Notice type
		 */
		renderImportReviewNotice(message, type = 'info') {
			const noticeType = ['error', 'warning', 'success'].includes(type) ? type : 'info';
			const $target = this.$(`#${this.importDialogId} [data-dtbk-import-status]`);

			$target.html(`
				<div class="notice notice-${this.escapeAttr(noticeType)}">
					<p>${this.escapeHtml(message)}</p>
				</div>
			`);
		}

		/**
		 * Render summary table data from the imported file prior to saving
		 *
		 * @since    1.4.0
		 *
		 * @param {Array} preview Table data to render
		 */
		renderImportPreviewTable(preview = {}) {
			const columns = Array.isArray(preview.columns) ? preview.columns : [];
			const rows = Array.isArray(preview.rows) ? preview.rows : [];

			if (!columns.length || !rows.length) {
				return '';
			}

			const headerHtml = columns
				.map(label => `<th scope="col">${this.escapeHtml(label)}</th>`)
				.join('');

			const bodyHtml = rows
				.map(
					row => `
						<tr class="${row.isHeader ? 'is-header' : ''}">
							<th scope="row">${this.escapeHtml(`Row ${row.rowId}`)}</th>
							${(Array.isArray(row.cells) ? row.cells : [])
								.map(cell => `<td>${this.escapeHtml(cell)}</td>`)
								.join('')}
						</tr>
					`
				)
				.join('');

			return `
				<div class="dtbk-import-preview">
					<p><strong>${this.escapeHtml(DTBK_TABLE_LIST?.i18n?.importPreviewTitle || 'Preview')}</strong></p>
					<table class="widefat striped dtbk-import-preview-table">
						<thead>
							<tr>
								<th scope="col">Row</th>
								${headerHtml}
							</tr>
						</thead>
						<tbody>${bodyHtml}</tbody>
					</table>
					${
						preview.truncated
							? `<p class="description">Preview truncated to the first few rows and columns.</p>`
							: ''
					}
			</div>
			`;
		}

		/**
		 * Render HTML preview table of imported file
		 *
		 * @since    1.4.0
		 *
		 * @param {Array} analysis Summary table data
		 */
		renderImportAnalysis(analysis) {
			const warnings = Array.isArray(analysis.warnings) ? analysis.warnings : [];
			const itemOptions = Array.isArray(analysis?.source?.availableItems)
				? analysis.source.availableItems
				: [];
			const targetId = Number(analysis?.target?.id || 0);
			const targetName =
				analysis?.target?.tableName || DTBK_TABLE_LIST?.i18n?.importNewTableLabel || 'New table';

			const itemPicker =
				itemOptions.length > 1
					? `
						<p class="dtbk-import-option">
							<label for="dtbk-import-item-index">
								${this.escapeHtml(DTBK_TABLE_LIST?.i18n?.importChooseItem || 'Backup item')}
							</label>
							<select id="dtbk-import-item-index" data-dtbk-import-item-index>
								${itemOptions
									.map(
										item => `
											<option value="${this.escapeAttr(item.value)}"
												${Number(item.value) === Number(analysis?.source?.selectedItemIndex) ? 'selected' : ''}>
												${this.escapeHtml(item.label)}
											</option>
										`
									)
									.join('')}
							</select>
						</p>
					`
					: '';

			const warningHtml = warnings.length
				? `
					<div class="notice notice-warning">
						<p><strong>${this.escapeHtml(DTBK_TABLE_LIST?.i18n?.importWarningsTitle || 'Warnings')}</strong></p>
						<ul>
							${warnings.map(message => `<li>${this.escapeHtml(message)}</li>`).join('')}
						</ul>
					</div>
				`
				: '';

			this.clearImportStatus();
			this.$(`#${this.importDialogId} [data-dtbk-import-review]`).html(`
				<div class="dtbk-import-review__content">
					${itemPicker}

					<div class="dtbk-import-summary-grid">
						<div>
							<strong>${this.escapeHtml(DTBK_TABLE_LIST?.i18n?.importSourceLabel || 'Source')}</strong>
							<div>${this.escapeHtml(analysis?.source?.tableName || analysis?.source?.fileName || '')}</div>
						</div>

						<div>
							<strong>${this.escapeHtml(DTBK_TABLE_LIST?.i18n?.importTargetLabel || 'Target')}</strong>
							<div>
								${this.escapeHtml(targetName)}
								${targetId ? ` (#${this.escapeHtml(String(targetId))})` : ''}
							</div>
						</div>

						<div>
							<strong>${this.escapeHtml(DTBK_TABLE_LIST?.i18n?.importRowsLabel || 'Rows')}</strong>
							<div>${this.escapeHtml(analysis?.summary?.rows || 0)}</div>
						</div>

						<div>
							<strong>${this.escapeHtml(DTBK_TABLE_LIST?.i18n?.importColumnsLabel || 'Columns')}</strong>
							<div>${this.escapeHtml(analysis?.summary?.columns || 0)}</div>
						</div>

						<div>
							<strong>${this.escapeHtml(DTBK_TABLE_LIST?.i18n?.importCellsLabel || 'Cells')}</strong>
							<div>${this.escapeHtml(analysis?.summary?.cells || 0)}</div>
						</div>
					</div>

					${this.renderImportRestoreOptions(analysis)}
					${warningHtml}
					${this.renderImportHeaderInputs(analysis)}
					${this.renderImportPreviewTable(analysis?.preview || {})}

					<div class="dtbk-import-actions">
						<button type="button" class="button button-primary" data-dtbk-import-commit>
							${this.escapeHtml(DTBK_TABLE_LIST?.i18n?.importCommit || 'Import Table')}
						</button>
					</div>
				</div>
			`);
		}

		/**
		 * Process file for analysis prior to saving via AJAX
		 *
		 * @since    1.4.0
		 */
		async analyzeImport() {
			if (!this.importState.file) {
				this.renderImportReviewNotice(
					DTBK_TABLE_LIST?.i18n?.importFileMissing || 'Select a file to import.',
					'error'
				);
				return;
			}

			const fd = new FormData();
			fd.append('action', DTBK_TABLE_LIST?.importAnalyzeAction || 'dtbk_import_analyze');
			fd.append('_ajax_nonce', DTBK_TABLE_LIST.nonce);
			fd.append('format', this.importState.format);
			fd.append('options', JSON.stringify(this.collectImportOptions()));
			fd.append('file', this.importState.file);

			this.setImportBusy(true, DTBK_TABLE_LIST?.i18n?.loading || 'Loading...');

			try {
				const response = await this.postAjaxImportForm(fd);

				if (!response?.success) {
					throw new Error(response?.data?.message || 'Import validation failed.');
				}

				this.importState.analysis = response.data;
				this.renderImportAnalysis(response.data);
			} catch (error) {
				this.renderImportReviewNotice(
					error?.message || DTBK_TABLE_LIST?.i18n?.error || 'Something went wrong.',
					'error'
				);
			} finally {
				this.setImportBusy(false);
			}
		}

		/**
		 * Save imported file via AJAX
		 *
		 * @since    1.4.0
		 */
		async commitImport() {
			if (!this.importState.file) {
				this.renderImportReviewNotice(
					DTBK_TABLE_LIST?.i18n?.importFileMissing || 'Select a file to import.',
					'error'
				);
				return;
			}

			const options = this.collectImportOptions();

			if (
				this.importState.format === 'csv' &&
				!options.firstRowHeader &&
				(!Array.isArray(options.headerNames) ||
					!options.headerNames.length ||
					options.headerNames.some(name => !String(name).trim()))
			) {
				this.renderImportReviewNotice(
					DTBK_TABLE_LIST?.i18n?.importHeaderNameMissing || 'Enter a name for every column.',
					'error'
				);
				return;
			}

			const fd = new FormData();
			fd.append('action', DTBK_TABLE_LIST?.importCommitAction || 'dtbk_import_commit');
			fd.append('_ajax_nonce', DTBK_TABLE_LIST.nonce);
			fd.append('format', this.importState.format);
			fd.append('options', JSON.stringify(options));
			fd.append('file', this.importState.file);

			this.setImportBusy(true, DTBK_TABLE_LIST?.i18n?.loading || 'Loading...');

			try {
				const response = await this.postAjaxImportForm(fd);

				if (!response?.success) {
					throw new Error(response?.data?.message || 'Import failed.');
				}

				const successMessage =
					response?.data?.message ||
					DTBK_TABLE_LIST?.i18n?.importSuccess ||
					'Table imported successfully.';

				this.closeImportDialog();
				this.openViewDialog(
					`<div class="notice notice-success"><p>${this.escapeHtml(successMessage)}</p></div>`
				);
				window.setTimeout(() => window.location.reload(), 700);
			} catch (error) {
				this.renderImportReviewNotice(
					error?.message || DTBK_TABLE_LIST?.i18n?.error || 'Something went wrong.',
					'error'
				);
			} finally {
				this.setImportBusy(false);
			}
		}

		/**
		 * Disable dialog while file is being processed and providing feedback to the user
		 * about what is currently happening asyncronously.
		 *
		 * @since    1.1.0
		 *
		 * @param {boolean} isBusy  Is an action currently happening that requires disablement?
		 * @param {string}  message Optional message to display to identify the reason the system is busy
		 */
		setImportBusy(isBusy, message = '') {
			this.importState.isBusy = isBusy;

			const $dlg = this.$(`#${this.importDialogId}`);
			$dlg.attr('aria-busy', isBusy ? 'true' : 'false');
			$dlg
				.find(
					'[data-dtbk-import-analyze], [data-dtbk-import-commit], [data-dtbk-import-back], [data-dtbk-import-browse], [data-dtbk-import-first-row], [data-dtbk-import-item-index], [data-dtbk-import-restore-mode], [data-dtbk-import-header-name]'
				)
				.prop('disabled', isBusy);
			$dlg.find('[data-dtbk-import-dropzone]').toggleClass('is-busy', isBusy);

			if (isBusy && message) {
				this.renderImportReviewNotice(message, 'info');
			}
		}

		/**
		 * Close the import dialog after the file has been successfully uploaded/processed.
		 *
		 * @since    1.4.0
		 */
		closeImportDialog() {
			const $dlg = this.$(`#${this.importDialogId}`);

			if (!$dlg.length) {
				return;
			}

			try {
				$dlg.dialog('close');
			} catch (err) {}
		}

		/**
		 * Execute AJAX for file import processing
		 *
		 * @since    1.4.0
		 *
		 * @param {FormData} fd Data for AJAX processing.
		 */
		async postAjaxImportForm(fd) {
			const res = await fetch(DTBK_TABLE_LIST.ajaxUrl, {
				method: 'POST',
				body: fd,
				credentials: 'same-origin',
			});

			const text = await res.text();
			let json = null;

			try {
				json = text ? JSON.parse(text) : null;
			} catch (err) {
				throw new Error(
					DTBK_TABLE_LIST?.i18n?.unexpectedResponse || 'The server returned an unexpected response.'
				);
			}

			if (!json) {
				throw new Error(
					DTBK_TABLE_LIST?.i18n?.unexpectedResponse || 'The server returned an unexpected response.'
				);
			}

			if (!res.ok || !json?.success) {
				throw new Error(json?.data?.message || 'Request failed.');
			}

			return json;
		}

		/**
		 * Provide acceptable file MIME types for file upload based on the selected import format
		 *
		 * @since    1.4.0
		 *
		 * @param {string} format File type for import
		 */
		getImportAccept(format) {
			switch (format) {
				case 'json':
					return '.json,application/json,text/json';
				case 'csv':
					return '.csv,text/csv,text/plain';
				default:
					return '';
			}
		}

		/**
		 * Format file size into human readable text
		 *
		 * @since    1.4.0
		 *
		 * @param {number} bytes Import file size in bytes
		 */
		formatBytes(bytes) {
			if (!bytes) {
				return '0 B';
			}

			const units = ['B', 'KB', 'MB', 'GB'];
			let size = bytes;
			let unitIndex = 0;

			while (size >= 1024 && unitIndex < units.length - 1) {
				size /= 1024;
				unitIndex++;
			}

			return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
		}

		/**
		 * Initiate server side download stream.
		 *
		 * @since    1.1.1
		 *
		 * @param {Object} format Export file format.
		 */
		startDownload(format) {
			try {
				const url = this.buildExportUrl(format);

				// Close picker before navigation
				const $dlg = this.$(`#${this.exportDialogId}`);
				if ($dlg.length) {
					try {
						$dlg.dialog('close');
					} catch (err) {}
				}

				window.location.href = url;
			} catch (err) {
				const message = err?.message || 'Export failed to start.';
				this.openViewDialog(
					`<div class="notice notice-error"><p>${this.escapeHtml(message)}</p></div>`
				);
			}
		}

		/**
		 * Build full export URL for the download stream.
		 *
		 * @since    1.1.1
		 *
		 * @param {Object} format Export file format.
		 * @return {string} Full export URL.
		 */
		buildExportUrl(format) {
			const adminPostUrl = DTBK_TABLE_LIST?.adminPostUrl;
			const action = DTBK_TABLE_LIST?.exportAction;

			if (!adminPostUrl || !action) {
				// Hard fail to avoid silent no-op
				throw new Error('Export download endpoint not configured (adminPostUrl/exportAction).');
			}

			const url = new URL(adminPostUrl, window.location.origin);
			url.searchParams.set('action', action);
			url.searchParams.set('format', format);
			url.searchParams.set('ids', this.exportIds);

			if (this.exportNonce) {
				url.searchParams.set('_wpnonce', this.exportNonce);
			}

			return url.toString();
		}

		/**
		 * Replace symbols with escaped html strings.
		 *
		 * @since    1.1.1
		 *
		 * @param {string} str String to be escaped.
		 * @return {string} Full export URL.
		 */
		escapeHtml(str) {
			return String(str)
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#039;');
		}

		/**
		 * Replace symbols with escaped html attributes.
		 *
		 * @since    1.1.1
		 *
		 * @param {string} str String to be escaped.
		 * @return {string} Full export URL.
		 */
		escapeAttr(str) {
			// Basic attribute-safe escape
			return this.escapeHtml(str).replace(/`/g, '&#096;');
		}
	}

	// DOM ready → bootstrap
	new Admin($);
});
