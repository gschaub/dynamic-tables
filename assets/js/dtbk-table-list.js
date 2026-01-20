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
			this.exportDialogId = 'dtbk-export-dialog';

			// Runtime state for exports
			this.exportIds = '';
			this.exportNonce = '';

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

			// Handle click on row "view" links
			this.$doc.on('click', 'a[data-dtbk-action="view"]', e => this.prepareViewTable(e));
			this.$doc.on('click', 'a[data-dtbk-action="export"]', e => this.prepareExportTable(e));
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
		 * Get table data and build HTML for display.
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
						class: 'button dtbk-export-btn-cancel',
						click: () => $dlg.dialog('close'),
					},
				],
				close: () => {
					$dlg.dialog('destroy');
				},
			});
		}

		/**
		 * Initiate server side download stream.
		 *
		 * @since    1.1.1
		 *
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
