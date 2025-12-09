/* global jQuery, DTBK_TABLE_LIST */

jQuery($ => {
	'use strict';

	class Admin {
		constructor($) {
			// Store the jQuery object for the selected element
			this.$ = $;
			this.$doc = this.$(document);
			this.listRowId = 'data-id';

			this.initEvents();
		}

		/**
		 * Initialize event handlers.
		 *
		 * @since    1.1.0
		 */
		initEvents() {
			// Prepare the dialog container
			this.ensureDialog();

			// Handle click on row "view" links
			this.$doc.on('click', 'a[data-dtbk-action="view"]', e => this.prepareViewTable(e));
		}

		// methods

		/**
		 * Initialize dialog box.
		 *
		 * @since    1.1.0
		 */
		ensureDialog() {
			if (!this.$(`#${this.listRowId}`).length) {
				const title = DTBK_TABLE_LIST?.i18n?.view || 'Table Data';

				this.$('body').append(
					`<div id="${this.listRowId}" title="${this.escapeAttr(title)}" style="display:none"></div>`
				);
			}
		}

		/**
		 * Prepare table for viewing.
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

			this.viewTable(id);
		}

		/**
		 * Get table data and build HTML for display.
		 *
		 * @since    1.1.0
		 *
		 * @param {number} id Table ID.
		 */
		async viewTable(id) {
			// Simple loading state
			this.openDialog('<p>Loading…</p>');

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
				this.openDialog(html);
			} catch (error) {
				const message = DTBK_TABLE_LIST?.i18n?.error || 'Request failed. Please try again.';

				this.openDialog(
					`<div class="notice notice-error"><p>${this.escapeHtml(message)}</p></div>`
				);
			}
		}

		/**
		 * Initialize event handlers.
		 *
		 * @since    1.1.0
		 *
		 * @param {Array}  tableAttributes
		 * @param {string} attributeName
		 * @return {*} Attribute value
		 */

		/**
		 * Fetch the table data.
		 *
		 * @since    1.1.0
		 *
		 * @param {number} id Table ID.
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

		openDialog(contentHtml) {
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

		escapeHtml(str) {
			return String(str)
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#039;');
		}

		escapeAttr(str) {
			// Basic attribute-safe escape
			return this.escapeHtml(str).replace(/`/g, '&#096;');
		}
	}

	// DOM ready → bootstrap
	new Admin($);
});
