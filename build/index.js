/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/components/column-dropdown-menu/index.js"
/*!******************************************************!*\
  !*** ./src/components/column-dropdown-menu/index.js ***!
  \******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ColumnMenu: () => (/* binding */ ColumnMenu)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/cog.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/settings.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/table-column-after.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/table-column-before.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/table-column-delete.mjs");
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./style.scss */ "./src/components/column-dropdown-menu/style.scss");
/* harmony import */ var _editor_scss__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../editor.scss */ "./src/editor.scss");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__);
/* External dependencies */




/* Internal dependencies */



/**
 * React component drop down menu to configure current column properties.
 *
 * @since    1.0.0
 * @since    1.2.0 Refactor component to improve UX and prerformance
 * @since    1.2.2 Added support to move columns and add columns both left and right
 *
 * @param {Object} props
 * @return {Object} Updated column
 */

function ColumnMenuImpl(props = {}) {
  const {
    anchor,
    table,
    columnId,
    columnLabel,
    updatedColumn,
    onRequestClose
  } = props;
  const tableId = table?.table_id;

  // Support disabling row movement that would bring out-of-bounds conditions
  const numTableColumns = table?.columns?.length - 1;
  const lastColumnId = table?.columns[numTableColumns]?.column_id;
  const disableInsertColumnLeft = Number(columnId) === 0 ? true : false;
  const disableMoveColumnLeft = Number(columnId) <= 1 ? true : false;
  const disableMoveColumnRight = Number(lastColumnId) === Number(columnId) ? true : false;

  // Refs for focus management
  const menuRootRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const firstItemRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);

  /**
   * Close the menu based on event actions
   *
   * @since    1.2.0
   */
  const close = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    onRequestClose?.();
  }, [onRequestClose]);

  /**
   * Handle keyboard navigation.
   *
   * Description: Escape closes; Up/Down moves among menu items.
   *
   * @since    1.2.0
   *
   * @param {Object} e Key down event
   *
   */
  const onKeyDown = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
      onRequestClose?.();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const root = menuRootRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll('button,[role="menuitem"]')).filter(el => !el.disabled && el.getAttribute('aria-disabled') !== 'true');
    if (!items.length) return;
    const doc = root.ownerDocument;
    const active = doc?.activeElement;
    const idx = items.indexOf(active);
    const dir = e.key === 'ArrowDown' ? 1 : -1;
    const nextIdx = idx === -1 ? 0 : (idx + dir + items.length) % items.length;
    items[nextIdx]?.focus?.();
  }, [onRequestClose]);

  /**
   * Close the menu when the popover requests to close.
   *
   * @since    1.2.0
   */
  const handlePopoverClose = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    onRequestClose?.();
  }, [onRequestClose]);
  const hasTableId = tableId !== null && tableId !== undefined;
  const hasColumnId = columnId !== null && columnId !== undefined;
  const canRender = !!anchor && typeof updatedColumn === 'function' && hasTableId && hasColumnId;

  // Focus first item on open (next frame so Popover has mounted)
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!canRender) return;
    window.requestAnimationFrame(() => {
      // Prefer explicit first item ref; fallback to first button inside menu
      const el = firstItemRef.current || menuRootRef.current?.querySelector?.('button,[role="menuitem"]');
      el?.focus?.();
    });
  }, [canRender, anchor, columnId]);

  /**
   * Column attributes for inserting new column.
   *
   * @since    1.0.0
   * @since    1.2.0 Refactor to use useCallback for performance purposes
   * @since    1.2.2 Allow column to be inserted either left or right of the current column
   *
   * @param {Object} event     Menu action
   * @param {number} columnId  Column ID for new column
   * @param {string} direction Insert column either left or right
   */
  const onInsertColumn = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((event, targetColumnId, direction) => {
    const updateType = direction === 'left' ? 'insert-left' : 'insert-right';
    updatedColumn(event, updateType, tableId, targetColumnId, '');
    close();
  }, [updatedColumn, tableId, close]);

  /**
   * Column to delete.
   *
   * @since    1.0.0
   * @since    1.2.0 Refactor to use useCallback for performance purposes
   *
   * @param {Object} event    Menu action
   * @param {number} columnId Column ID for column to remove
   */
  const onDeleteColumn = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((event, targetColumnId) => {
    updatedColumn(event, 'delete', tableId, targetColumnId, '');
    close();
  }, [updatedColumn, tableId, close]);

  /**
   * Column attributes for moving a column left or right.
   *
   * @since    1.2.2
   *
   * @param {Object} event    Menu action
   * @param {number} columnId Column ID for new row
   */
  const onMoveColumn = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((event, targetRowId, direction) => {
    const updateType = direction === 'left' ? 'move-left' : 'move-right';
    updatedColumn(event, updateType, tableId, targetRowId, '');
    close();
  }, [updatedColumn, tableId, close]);

  /**
   * Updated column attributes for processing.
   *
   * @since    1.0.0
   * @since    1.2.0 Refactor to move column width handling up to parent component
   *
   * @param {Object} event          Menu action
   * @param {Object} targetColumnId Column ID for update
   */
  const onUpdateColumnWidth = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((event, targetColumnId) => {
    updatedColumn(event, 'attributes', tableId, targetColumnId, '');
    close();
  }, [tableId, close]);

  /**
   * Updated column attributes for processing.
   *
   * @since    1.0.0
   * @since    1.2.0 Refactor to move column width handling up to parent component
   *
   * @param {Object} event          Menu action
   * @param {Object} targetColumnId Column ID for update
   */
  const onUpdateColumnDataType = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((event, targetColumnId) => {
    updatedColumn(event, 'dataType', tableId, targetColumnId, '');
    close();
  }, [tableId, close]);
  if (!canRender) return null;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.Fragment, {
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Popover, {
      anchor: anchor,
      ref: menuRootRef,
      className: "menu-col__main",
      role: "menu",
      "aria-label": `Column ${columnLabel} menu`,
      placement: "bottom",
      focusOnMount: false,
      offset: 8,
      noArrow: false,
      flip: true,
      tabIndex: -1,
      onKeyDown: onKeyDown,
      onClose: handlePopoverClose,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuGroup, {
        className: "components-menu-group",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
          icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__["default"],
          onClick: e => onUpdateColumnDataType(e, columnId),
          ref: firstItemRef,
          children: "Column Content Type..."
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
          icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
          onClick: e => onUpdateColumnWidth(e, columnId),
          children: "Update Column Width..."
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuGroup, {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
          icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_5__["default"],
          disabled: disableInsertColumnLeft,
          onClick: e => onInsertColumn(e, columnId, 'left'),
          children: "Insert Column Left"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
          icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__["default"],
          onClick: e => onInsertColumn(e, columnId, 'right'),
          children: "Insert Column Right"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuGroup, {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
          shortcut: 'Alt + ←',
          disabled: disableMoveColumnLeft,
          onClick: e => onMoveColumn(e, columnId, 'left'),
          children: "Move Column Left"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
          shortcut: 'Alt + →',
          disabled: disableMoveColumnRight,
          onClick: e => onMoveColumn(e, columnId, 'right'),
          children: "Move Column Right"
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuGroup, {
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
          icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_6__["default"],
          onClick: e => onDeleteColumn(e, columnId),
          children: "Delete Column"
        })
      })]
    })
  });
}
const ColumnMenu = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.memo)(ColumnMenuImpl);

/***/ },

/***/ "./src/components/configure-column-data-types/index.js"
/*!*************************************************************!*\
  !*** ./src/components/configure-column-data-types/index.js ***!
  \*************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ColumnDataTypeModal: () => (/* binding */ ColumnDataTypeModal)
/* harmony export */ });
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/compose */ "@wordpress/compose");
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_compose__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var clsx__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! clsx */ "./node_modules/clsx/dist/clsx.mjs");
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./style.scss */ "./src/components/configure-column-data-types/style.scss");
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../style.scss */ "./src/style.scss");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);
/* External dependencies */





/**
 * Internal dependencies
 */





/**
 * React component to configure data types for a column.
 *
 * @since    1.1.2
 *
 * @param {Object} props
 * @return {Object} Updated column properties
 */

function ConfigureColumnDataType(props = {}) {
  const instanceId = (0,_wordpress_compose__WEBPACK_IMPORTED_MODULE_0__.useInstanceId)(ConfigureColumnDataType);
  const previewId = `dtbk-preview-${instanceId}`;
  const {
    tableId,
    columnId,
    columnLabel,
    columnAttributes,
    columnClasses,
    updatedColumn,
    onRequestClose
  } = props;
  const normalizedColumnDataType = (0,_utils__WEBPACK_IMPORTED_MODULE_6__.normalizeColumnDataType)(columnAttributes?.columnDataType);
  const [columnName, setColumnName] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(columnLabel);
  const [dataType, setDataType] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(normalizedColumnDataType);
  const [dataTypeFormat, setDataTypeFormat] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(normalizedColumnDataType?.settings?.format || '');
  // console.log('Column Classes inbound = ', columnClasses);
  const [columnClassNames, setColumnClassNames] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)((0,_utils__WEBPACK_IMPORTED_MODULE_6__.stageClassesForEdit)(columnClasses));
  const columnClassNamesRender = (0,_utils__WEBPACK_IMPORTED_MODULE_6__.prepareClassesForUse)(columnClassNames);

  // Date specific attributes
  const initDefaultToToday = normalizedColumnDataType?.settings?.defaultToToday === true ? true : false;
  const isDateDataType = normalizedColumnDataType?.type === 'date-time' ? true : false;
  const initDatePreviewValue = initDefaultToToday && isDateDataType ? formattedDate(normalizedColumnDataType?.settings?.format) : '';
  const [dateDefaultToToday, setDateDefaultToToday] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(initDefaultToToday);
  const [datePreviewValue, setDatePreviewValue] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(initDatePreviewValue);

  // Number specifica attributes
  const [decimalPlaces, setDecimalPlaces] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(normalizedColumnDataType?.settings?.formatOptions?.decimalPlaces || 0);
  const [thousandSeparator, setThousandSeparator] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(normalizedColumnDataType?.settings?.formatOptions?.thousandSeparator || true);
  const [currency, setCurrency] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(normalizedColumnDataType?.settings?.formatOptions?.showCurrencySymbol || false);
  const [redNegative, setRedNegative] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(normalizedColumnDataType?.settings?.formatOptions?.redNegative || false);
  const [bracketNegative, setBracketNegative] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(normalizedColumnDataType?.settings?.formatOptions?.bracketNegative || false);
  const [updateColumnStyle, setUpdateColumnStyle] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(normalizedColumnDataType?.settings?.formatOptions?.updateColumnStyle || true);
  const numberEntryWrapperRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
  const numberEntryInputRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
  const pendingCaretRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
  const [numberRawValue, setNumberRawValue] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)('');
  const sanitizedPreviewNumber = (0,_utils__WEBPACK_IMPORTED_MODULE_6__.sanitizeNumberInput)(numberRawValue, dataTypeFormat);
  const showNegativeNumberPreview = redNegative && sanitizedPreviewNumber !== '' && sanitizedPreviewNumber !== '-' && Number(sanitizedPreviewNumber) < 0;
  const numberEntryValue = (0,_utils__WEBPACK_IMPORTED_MODULE_6__.formattedNumber)(numberRawValue, dataTypeFormat, thousandSeparator, decimalPlaces, false, false);
  const numberDisplayValue = (0,_utils__WEBPACK_IMPORTED_MODULE_6__.formattedNumber)(numberRawValue, dataTypeFormat, thousandSeparator, decimalPlaces, currency, bracketNegative);

  // Column width attributes
  const [columnWidthType, setColumnWidthType] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(columnAttributes.columnWidthType);
  const [minWidth, setMinWidth] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(columnAttributes.minWidth);
  const [minWidthUnits, setMinWidthUnits] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(columnAttributes.minWidthUnits);
  const [maxWidth, setMaxWidth] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(columnAttributes.maxWidth);
  const [maxWidthUnits, setMaxWidthUnits] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(columnAttributes.maxWidthUnits);
  const [fixedWidth, setFixedWidth] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(columnAttributes.fixedWidth);
  const [fixedWidthUnits, setFixedWidthUnits] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(columnAttributes.fixedWidthUnits);
  const [disableForTablet, setDisableForTablet] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(columnAttributes.disableForTablet);
  const [disableForPhone, setDisableForPhone] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(columnAttributes.disableForPhone);

  /**
   * Stop event processing in favor of custom processing.
   *
   * @since    1.1.2
   *
   * @param {Object} event Mouse down
   */
  function stopProp(event) {
    event.stopPropagation();
  }

  /**
   * Close component modal.
   *
   * @since    1.1.2
   */
  function close() {
    onRequestClose?.();
  }

  /**
   * Close modal on cancel.
   *
   * @since    1.1.2
   *
   * @param {Object} event Cancel
   */
  function handleCancel() {
    onRequestClose?.();
  }

  // Support caret location maintenance
  const CARET_TOKEN_PATTERN = /[\d.-]/;
  function countCaretTokens(value, caretIndex) {
    return (value.slice(0, caretIndex).match(/[\d.-]/g) ?? []).length;
  }
  function getCaretIndexFromTokenCount(value, tokenCount) {
    if (tokenCount <= 0) {
      return 0;
    }
    let seen = 0;
    for (let i = 0; i < value.length; i++) {
      if (CARET_TOKEN_PATTERN.test(value[i])) {
        seen++;
        if (seen >= tokenCount) {
          return i + 1;
        }
      }
    }
    return value.length;
  }
  function getFirstNumericIndex(value) {
    return value.search(/\d/);
  }
  function normalizeCaretForPresentationPrefix(value, caretIndex, caretMeta) {
    if (!caretMeta) {
      return caretIndex;
    }
    const firstNumericIndex = getFirstNumericIndex(value);
    if (firstNumericIndex === -1) {
      return caretIndex;
    }
    if (caretMeta.wasAtStart) {
      return 0;
    }
    if (caretMeta.wasInPrefixZone) {
      return firstNumericIndex;
    }
    return caretIndex;
  }
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useLayoutEffect)(() => {
    const input = numberEntryWrapperRef.current?.querySelector('input') ?? null;
    numberEntryInputRef.current = input;
    if (!input || !pendingCaretRef.current) {
      return;
    }
    if (input !== input.ownerDocument.activeElement) {
      pendingCaretRef.current = null;
      return;
    }
    let nextCaret = getCaretIndexFromTokenCount(input.value, pendingCaretRef.current.tokenCount);
    nextCaret = normalizeCaretForPresentationPrefix(input.value, nextCaret, pendingCaretRef.current);
    input.setSelectionRange(nextCaret, nextCaret);
    pendingCaretRef.current = null;
  }, [numberEntryValue]);

  /**
   * Update date format and set default options
   *
   * @since 1.2.0
   *
   * @param {string} dateFormat
   */
  function formattedDate(dateFormat) {
    const today = new Date();
    if (dateFormat === 'date') {
      return today.toISOString().split('T')[0];
    }
    if (dateFormat === 'time') {
      const hh = String(today.getHours()).padStart(2, '0');
      const mm = String(today.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    if (dateFormat === 'datetime-local') {
      const yyyy = today.getFullYear();
      const mo = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const hh = String(today.getHours()).padStart(2, '0');
      const mm = String(today.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mo}-${dd}T${hh}:${mm}`;
    }
    return '';
  }

  /**
   * Update date format and set default options
   *
   * @since 1.2.0
   *
   * @param {string} dateFormat Date/Time format to set
   */
  function onDateTimeType(dateFormat) {
    setDataTypeFormat(dateFormat);
    if (dateDefaultToToday) setDatePreviewValue(formattedDate(dateFormat));
    const dataTypeSettings = {
      format: dateFormat,
      defaultToToday: dateDefaultToToday
    };
    const updatedDataType = {
      type: 'date-time',
      settings: dataTypeSettings
    };
    setDataType(updatedDataType);
  }

  /**
   * Update number format and set default options
   *
   * @since 1.2.0
   *
   * @param {boolean} isChecked Default today's date
   * @param {string}  type      Date/Time Format
   */
  function onDateDefaultToToday(isChecked, type) {
    if (!isChecked) {
      setDatePreviewValue('');
    } else {
      setDatePreviewValue(formattedDate(type));
    }
    setDateDefaultToToday(isChecked);
    const dataTypeSettings = {
      format: type,
      defaultToToday: isChecked
    };
    const updatedDataType = {
      type: 'date-time',
      settings: dataTypeSettings
    };
    setDataType(updatedDataType);
  }

  /**
   * Update number format and set default options
   *
   * @since 1.2.4
   *
   * @param {*} numberFormat Number format to set
   */
  function onNumberFormat(numberFormat) {
    if (numberFormat === 'percent' && dataTypeFormat !== 'percent') {
      // divide by 100
      const revisedNumberValue = !!numberRawValue ? String(Number(numberRawValue) / 100) : '';
      console.log('Format to percent udpate value = ' + revisedNumberValue);
      setNumberRawValue(revisedNumberValue);
    }
    if (numberFormat !== 'percent' && dataTypeFormat === 'percent') {
      // multiply by 100
      const revisedNumberValue = !!numberRawValue ? String(Number(numberRawValue) * 100) : '';
      console.log('Format from percent udpate value = ' + revisedNumberValue);
      setNumberRawValue(revisedNumberValue);
    }
    setDataTypeFormat(numberFormat);
    let dataTypeSettings = '';
    setUpdateColumnStyle(true);
    switch (numberFormat) {
      case 'number':
        setDecimalPlaces(0);
        setThousandSeparator(true);
        setCurrency(false);
        setRedNegative(false);
        setBracketNegative(false);
        dataTypeSettings = {
          format: numberFormat,
          formatOptions: {
            decimalPlaces: 0,
            thousandSeparator: true,
            showCurrencySymbol: false,
            redNegative: false,
            bracketNegative: false,
            updateColumnStyle: true
          }
        };
        break;
      case 'integer':
        setDecimalPlaces(0);
        setThousandSeparator(true);
        setCurrency(false);
        setRedNegative(false);
        setBracketNegative(false);
        dataTypeSettings = {
          format: numberFormat,
          formatOptions: {
            decimalPlaces: 0,
            thousandSeparator: true,
            showCurrencySymbol: false,
            redNegative: false,
            bracketNegative: false,
            updateColumnStyle: true
          }
        };
        break;
      case 'percent':
        setDecimalPlaces(0);
        setThousandSeparator(true);
        setCurrency(false);
        setRedNegative(false);
        setBracketNegative(false);
        dataTypeSettings = {
          format: numberFormat,
          formatOptions: {
            decimalPlaces: 0,
            thousandSeparator: true,
            showCurrencySymbol: false,
            redNegative: false,
            bracketNegative: false,
            updateColumnStyle: true
          }
        };
        break;
      case 'currency':
        setDecimalPlaces(2);
        setCurrency(true);
        setThousandSeparator(true);
        setRedNegative(false);
        setBracketNegative(false);
        dataTypeSettings = {
          format: numberFormat,
          formatOptions: {
            decimalPlaces: 2,
            thousandSeparator: true,
            showCurrencySymbol: true,
            redNegative: false,
            bracketNegative: false,
            updateColumnStyle: true
          }
        };
    }
    let newColumnClassNames = columnClassNames;
    newColumnClassNames = newColumnClassNames.add('grid-control__body-columns--number-align-right');
    setColumnClassNames(newColumnClassNames);
    const updatedDataType = {
      type: 'number',
      settings: dataTypeSettings
    };

    // console.log('Number Data Type Selection - Updated data type: ', updatedDataType);
    setDataType(updatedDataType);
  }

  /**
   * Update number formatting options based on configuration input
   *
   * @since 1.2.4
   *
   * @param {Object} event  Formatting value to set
   * @param {string} option Formatting option
   */
  function onNumberFormatOption(event, option) {
    // console.log('On Number Format Options - ' + option);
    // console.log(event);

    let newDecimalPlaces = decimalPlaces;
    let newThousandSeparator = thousandSeparator;
    let newCurrency = currency;
    let newRedNegative = redNegative;
    let newBracketNegative = bracketNegative;
    let newUpdateColumnStyle = updateColumnStyle;
    let newColumnClassNames = columnClassNames;
    switch (option) {
      case 'decimal':
        newDecimalPlaces = Math.max(0, event || 0);
        break;
      case 'thousand':
        newThousandSeparator = event;
        break;
      case 'currency':
        newCurrency = event;
        break;
      case 'red-negative':
        newRedNegative = event;
        break;
      case 'bracket-negative':
        newBracketNegative = event;
        break;
      case 'format-column':
        newUpdateColumnStyle = event;
        if (event) {
          newColumnClassNames = newColumnClassNames.add('grid-control__body-columns--number-align-right');
        }
        break;
    }
    setDecimalPlaces(newDecimalPlaces);
    setThousandSeparator(newThousandSeparator);
    setCurrency(newCurrency);
    setRedNegative(newRedNegative);
    setBracketNegative(newBracketNegative);
    setUpdateColumnStyle(newUpdateColumnStyle);
    setColumnClassNames(newColumnClassNames);
    const updatedDataType = {
      ...dataType,
      settings: {
        format: dataType.settings.format,
        formatOptions: {
          decimalPlaces: newDecimalPlaces,
          thousandSeparator: newThousandSeparator,
          showCurrencySymbol: newCurrency,
          redNegative: newRedNegative,
          bracketNegative: newBracketNegative,
          updateColumnStyle: newUpdateColumnStyle
        }
      }
    };
    console.log('Number Format Options - Updated data type: ', updatedDataType);
    setDataType(updatedDataType);
  }

  /**
   * Change number string from entry
   *
   * @since 1.2.4
   *
   * @param {Object} event New number string
   */
  function onNumberPreviewChange(event) {
    console.log('number change event = ' + event);
    const input = numberEntryInputRef.current;
    const selectionStart = input?.selectionStart ?? event.length;
    const firstNumericIndex = getFirstNumericIndex(event);
    pendingCaretRef.current = {
      tokenCount: countCaretTokens(event, selectionStart),
      wasAtStart: selectionStart === 0,
      wasInPrefixZone: firstNumericIndex !== -1 && selectionStart > 0 && selectionStart <= firstNumericIndex
    };
    let nextRawValue = (0,_utils__WEBPACK_IMPORTED_MODULE_6__.sanitizeNumberInput)(event, dataTypeFormat);
    let revisedDecimalPlaces = decimalPlaces;
    if (dataTypeFormat === 'percent') {
      console.log('...Percentage division = ' + Number(nextRawValue) + ', ' + Number(nextRawValue) / 100);
      revisedDecimalPlaces = decimalPlaces + 2;
      nextRawValue = String(Number(nextRawValue) / 100);
    }
    if (dataTypeFormat !== 'integer') {
      const [integerPart, fractionPart = ''] = nextRawValue.split('.');
      const fractionalExcessLength = fractionPart.length - revisedDecimalPlaces;
      if (fractionalExcessLength > 0) {
        nextRawValue = `${integerPart}.${fractionPart.slice(0, revisedDecimalPlaces)}`;
      }
      if (fractionalExcessLength < 0) {
        const paddedSpaces = fractionalExcessLength * -1;
        nextRawValue = `${integerPart}.${fractionPart.padEnd(paddedSpaces, '0')}`;
      }
    }
    console.log('...Updated Raw number = ' + nextRawValue);
    setNumberRawValue(nextRawValue);
  }
  function onNumberPreviewKeyDown(event) {
    if (event.key === '.' && (dataTypeFormat === 'integer' || numberRawValue.includes('.'))) {
      event.preventDefault();
    }
  }

  /**
   * Change column data types and set formatting defaults
   *
   * @since    1.2.0
   * @since    1.2.4  Add number format
   *
   * @param {Object} event Event object to change data type
   * @return {void}
   */
  function onUpdateDataType(event) {
    // console.log(event);
    let updatedDataType = {};
    let newColumnClassNames = columnClassNames;
    switch (event) {
      case 'date-time':
        setDataTypeFormat('date');
        updatedDataType = {
          type: 'date-time',
          settings: {
            format: 'date',
            defaultToToday: false
          }
        };
        newColumnClassNames = newColumnClassNames.delete('grid-control__body-columns--number-align-right');
        break;
      case 'number':
        setDataTypeFormat('number');
        onNumberFormat('number');
        return;
      default:
        updatedDataType = {
          type: event
        };
        newColumnClassNames = newColumnClassNames.delete('grid-control__body-columns--number-align-right');
        break;
    }
    // console.log('updating data tppe');
    setColumnClassNames(newColumnClassNames);
    setDataType(updatedDataType);
  }

  /**
   * Return new column data type settings.
   *
   * @since    1.2.0
   *
   * @param {Object} event Form submit
   */
  function onUpdate(event) {
    const updatedColumnAttributes = {
      columnWidthType: columnWidthType,
      minWidth: minWidth,
      minWidthUnits: minWidthUnits,
      maxWidth: Number(maxWidth),
      maxWidthUnits: maxWidthUnits,
      fixedWidth: fixedWidth,
      fixedWidthUnits: fixedWidthUnits,
      disableForTablet: disableForTablet,
      disableForPhone: disableForPhone,
      isFixedLeftColumnGroup: false,
      horizontalAlignment: 'none',
      columnDataType: dataType
    };

    /**
     * Ensure column classes are updated if additional classes were added to the
     * block subsequent to the prior column configuration
     */
    let newColumnClassNames = columnClassNames;
    console.log('data type = ' + dataType.type);
    switch (dataType.type) {
      case 'general':
        break;
      case 'date-time':
        break;
      case 'number':
        newColumnClassNames = newColumnClassNames.add('grid-control__body-columns--number-align-right');
        break;
    }
    setColumnClassNames(newColumnClassNames);
    const updatedColumnClasses = (0,_utils__WEBPACK_IMPORTED_MODULE_6__.prepareClassesForUse)(newColumnClassNames);
    console.log('Classes to set: ' + updatedColumnClasses);
    updatedColumn(event, 'dataType', tableId, columnId, columnName, updatedColumnAttributes, updatedColumnClasses);
    close();
  }
  const renderColumnClasses = (0,clsx__WEBPACK_IMPORTED_MODULE_3__["default"])(columnClassNamesRender, {
    'grid-control__body-columns--number-red': showNegativeNumberPreview
  });

  // console.log('resolve');
  // console.log('format = ' + dataTypeFormat);
  // console.log(dataType);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Modal, {
    title: "Configure Column Content Type",
    overlayClassName: "configure-column-modal",
    onRequestClose: handleCancel,
    focusOnMount: "firstContentElement",
    isDismissible: "false",
    shouldCloseOnClickOutside: "false",
    size: "large",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("form", {
      className: "configure-data-type--form configure-column-modal__form",
      onSubmit: onUpdate,
      onMouseDown: stopProp,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("div", {
        className: "configure-column-modal__body",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("div", {
          className: "configure-column-modal__body-inner",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.__experimentalVStack, {
            spacing: 4,
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("p", {
              className: "column-label",
              children: ["For column ", columnName]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Card, {
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CardHeader, {
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("strong", {
                  children: "Basics"
                })
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CardBody, {
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.__experimentalVStack, {
                  spacing: 3,
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.__experimentalInputControl, {
                    label: "Column Name",
                    value: columnName,
                    onChange: value => setColumnName(value)
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.SelectControl, {
                    label: "Content Type",
                    value: dataType.type,
                    onChange: onUpdateDataType,
                    options: [{
                      value: 'general',
                      label: 'General'
                    }, {
                      value: 'date-time',
                      label: 'Date/Time'
                    }, {
                      value: 'number',
                      label: 'Number'
                    }
                    // { value: 'image', label: 'Image' },
                    // { value: 'link', label: 'Link' },
                    // { value: 'checkbox', label: 'Check Box' },
                    // { value: 'rating', label: 'Rating' },
                    ],
                    __nextHasNoMarginBottom: true
                  })]
                })
              })]
            }), dataType.type === 'date-time' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Card, {
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CardHeader, {
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("strong", {
                  children: "Content settings"
                })
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CardBody, {
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.__experimentalVStack, {
                  spacing: 3,
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("div", {
                    children: "Select the specific date/time appearance."
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Flex, {
                    gap: 24,
                    align: "stretch",
                    className: "configure-column-modal__split",
                    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.FlexItem, {
                      className: "configure-column-modal__left",
                      isBlock: true,
                      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.__experimentalVStack, {
                        spacing: 3,
                        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.RadioControl, {
                          label: "Format",
                          selected: dataTypeFormat,
                          options: [{
                            label: 'Date only',
                            value: 'date'
                          }, {
                            label: 'Time only',
                            value: 'time'
                          }, {
                            label: 'Date & time',
                            value: 'datetime-local'
                          }],
                          onChange: value => onDateTimeType(value)
                        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
                          className: "configure-column-modal__options",
                          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("strong", {
                            children: "Options"
                          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CheckboxControl, {
                            className: "configure-column-modal__checkbox",
                            label: "Default to today's date",
                            checked: dateDefaultToToday,
                            onChange: e => onDateDefaultToToday(e, dataTypeFormat)
                          })]
                        })]
                      })
                    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.FlexItem, {
                      className: "configure-column-modal__right",
                      isBlock: true,
                      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("div", {
                        className: "configure-column-modal__preview",
                        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.BaseControl, {
                          id: previewId,
                          label: "Preview",
                          help: "This is only a preview; it won\u2019t change saved values.",
                          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.TextControl, {
                            type: dataTypeFormat,
                            label: '',
                            id: previewId,
                            step: 60,
                            __next40pxDefaultSize: true,
                            value: datePreviewValue,
                            onChange: setDatePreviewValue
                          })
                        })
                      })
                    })]
                  })]
                })
              })]
            }), dataType.type === 'number' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Card, {
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CardHeader, {
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("strong", {
                  children: "Content settings"
                })
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CardBody, {
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.__experimentalVStack, {
                  spacing: 3,
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("div", {
                    children: "Select the specific number type."
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Flex, {
                    gap: 24,
                    align: "stretch",
                    className: "configure-column-modal__split",
                    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.FlexItem, {
                      className: "configure-column-modal__left",
                      isBlock: true,
                      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.__experimentalVStack, {
                        spacing: 3,
                        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.RadioControl, {
                          label: "Number Type",
                          selected: dataTypeFormat,
                          options: [{
                            label: 'General',
                            value: 'number'
                          }, {
                            label: 'Integer',
                            value: 'integer'
                          }, {
                            label: 'Percent',
                            value: 'percent'
                          }, {
                            label: 'Currency',
                            value: 'currency'
                          }],
                          onChange: value => onNumberFormat(value)
                        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
                          className: "configure-column-modal__options",
                          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("strong", {
                            children: "Formatting Options"
                          }), (dataTypeFormat === 'number' || dataTypeFormat === 'percent' || dataTypeFormat === 'currency') && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.TextControl, {
                            className: "configure-column-modal__input",
                            type: 'number',
                            label: 'Decimal Places',
                            __next40pxDefaultSize: true,
                            value: decimalPlaces,
                            onChange: e => onNumberFormatOption(e, 'decimal')
                          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CheckboxControl, {
                            className: "configure-column-modal__checkbox",
                            label: 'Thousand Separator',
                            checked: thousandSeparator,
                            onChange: e => onNumberFormatOption(e, 'thousand')
                          }), dataTypeFormat === 'currency' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CheckboxControl, {
                            className: "configure-column-modal__checkbox",
                            label: 'Currency',
                            checked: currency,
                            onChange: e => onNumberFormatOption(e, 'currency')
                          }), (dataTypeFormat === 'number' || dataTypeFormat === 'integer' || dataTypeFormat === 'currency') && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CheckboxControl, {
                            className: "configure-column-modal__checkbox",
                            label: 'Bracket negative numbers?',
                            checked: bracketNegative,
                            onChange: e => onNumberFormatOption(e, 'bracket-negative')
                          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CheckboxControl, {
                            className: "configure-column-modal__checkbox",
                            label: 'Display negative numbers in red?',
                            checked: redNegative,
                            onChange: e => onNumberFormatOption(e, 'red-negative')
                          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CheckboxControl, {
                            className: "configure-column-modal__checkbox",
                            label: 'Auto format column?',
                            checked: updateColumnStyle,
                            onChange: e => onNumberFormatOption(e, 'format-column')
                          })]
                        })]
                      })
                    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.FlexItem, {
                      className: "configure-column-modal__right",
                      isBlock: true,
                      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("div", {
                        className: "configure-column-modal__preview",
                        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.BaseControl, {
                          id: previewId,
                          label: "Preview",
                          help: "This is only a preview; it won\u2019t change saved values.",
                          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("div", {
                            ref: numberEntryWrapperRef,
                            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.TextControl, {
                              className: `configure-column-modal__input-preview ${renderColumnClasses}`,
                              type: 'text',
                              inputMode: dataTypeFormat === 'integer' ? 'numeric' : 'decimal',
                              label: 'Entry'
                              // id={previewId}
                              ,
                              id: `${previewId}-entry`,
                              __next40pxDefaultSize: true,
                              value: numberEntryValue,
                              onChange: e => onNumberPreviewChange(e),
                              onBlur: () => {
                                pendingCaretRef.current = null;
                              }
                            })
                          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.TextControl, {
                            className: `configure-column-modal__display-preview ${renderColumnClasses}`,
                            type: 'text',
                            inputMode: dataTypeFormat === 'integer' ? 'numeric' : 'decimal',
                            label: 'Display',
                            disabled: true
                            // id={previewId}
                            ,
                            id: `${previewId}-display`,
                            __next40pxDefaultSize: true,
                            value: numberDisplayValue
                            // value={numberPreviewValue}numberDisplayValue
                          })]
                        })
                      })
                    })]
                  })]
                })
              })]
            })]
          })
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("div", {
        className: "configure-column-modal__footer",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
          className: "configure-column-modal__button-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
            variant: "secondary",
            onClick: handleCancel,
            children: "Cancel"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
            variant: "primary",
            type: "submit",
            children: "Update"
          })]
        })
      })]
    })
  });
}
const ColumnDataTypeModal = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.memo)(ConfigureColumnDataType);

/***/ },

/***/ "./src/components/configure-column-width/index.js"
/*!********************************************************!*\
  !*** ./src/components/configure-column-width/index.js ***!
  \********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ColumnWidthModal: () => (/* binding */ ColumnWidthModal)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./style.scss */ "./src/components/configure-column-width/style.scss");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils */ "./src/utils.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);
/* External dependencies */



/**
 * Internal dependencies
 */



/**
 * React component to support updates for the current column width.
 *
 * @since    1.0.0
 *
 * @param {Object} props
 * @return {Object} Updated column properties
 */

function ConfigureColumnWidth(props = {}) {
  const {
    tableId,
    columnId,
    columnLabel,
    columnAttributes,
    enableProFeatures,
    updatedColumn,
    onRequestClose
  } = props;
  const normalizedColumnDataType = (0,_utils__WEBPACK_IMPORTED_MODULE_3__.normalizeColumnDataType)(columnAttributes?.columnDataType);
  const [dataType] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(normalizedColumnDataType);
  const [columnWidthType, setColumnWidthType] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)();
  const [hideProportional, setHideProportional] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(true);
  const [hideCustom, setHideCustom] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(true);
  const [hideFixed, setHideFixed] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(true);
  const [minWidth, setMinWidth] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
  const [minWidthUnits, setMinWidthUnits] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)();
  const [maxWidth, setMaxWidth] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(1);
  const [maxWidthUnits, setMaxWidthUnits] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)();
  const [fixedWidth, setFixedWidth] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
  const [fixedWidthUnits, setFixedWidthUnits] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)();
  const [disableForTablet, setDisableForTablet] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [disableForPhone, setDisableForPhone] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    switch (columnAttributes.columnWidthType) {
      case 'Proportional':
        {
          setHideProportional(false);
          setHideCustom(true);
          setHideFixed(true);
          break;
        }
      case 'Auto':
        {
          setHideProportional(true);
          setHideCustom(true);
          setHideFixed(true);
          break;
        }
      case 'Fixed':
        {
          setHideProportional(true);
          setHideCustom(true);
          setHideFixed(false);
          break;
        }
      case 'Custom':
        {
          setHideProportional(true);
          setHideCustom(false);
          setHideFixed(true);
          break;
        }
    }
    setColumnWidthType(columnAttributes.columnWidthType);
    setMinWidth(columnAttributes.minWidth);
    setMinWidthUnits(columnAttributes.minWidthUnits);
    setMaxWidth(columnAttributes.maxWidth);
    setMaxWidthUnits(columnAttributes.maxWidthUnits);
    setFixedWidth(columnAttributes.fixedWidth);
    setFixedWidthUnits(columnAttributes.fixedWidth);
    setDisableForPhone(columnAttributes.disableForPhone);
    setDisableForTablet(columnAttributes.disableForTablet);
  }, [columnAttributes]);

  /**
   * Stop event processing in favor of custom processing.
   *
   * @since    1.0.0
   *
   * @param {Object} event Mouse down
   */
  function stopProp(event) {
    event.stopPropagation();
  }

  /**
   * Close component modal.
   *
   * @since    1.1.2
   */
  function close() {
    onRequestClose?.();
  }

  /**
   * Close modal on cancel.
   *
   * @since    1.0.0
   */
  function handleCancel() {
    onRequestClose?.();
  }

  /**
   * Process change in width type and set detault props for the type.
   *
   * @since    1.0.0
   *
   * @param {string} event New column width type
   */
  function onWidthType(event) {
    switch (event) {
      case 'Proportional':
        {
          setMaxWidth(1);
          setMaxWidthUnits('fr');
          setMinWidth(20);
          setMinWidthUnits('ch');
          setFixedWidth(0);
          setFixedWidthUnits('px');
          setHideProportional(false);
          setHideCustom(true);
          setHideFixed(true);
          break;
        }
      case 'Auto':
        {
          setMaxWidth(0);
          setMaxWidthUnits('fr');
          setMinWidth(0);
          setMinWidthUnits('ch');
          setFixedWidth(0);
          setFixedWidthUnits('px');
          setHideProportional(true);
          setHideCustom(true);
          setHideFixed(true);
          break;
        }
      case 'Fixed':
        {
          setMaxWidth(0);
          setMaxWidthUnits('fr');
          setMinWidth(0);
          setMinWidthUnits('ch');
          setFixedWidth(40);
          setFixedWidthUnits('px');
          setHideProportional(true);
          setHideCustom(true);
          setHideFixed(false);
          break;
        }
      case 'Custom':
        {
          setMaxWidth(40);
          setMaxWidthUnits('ch');
          setMinWidth(20);
          setMinWidthUnits('ch');
          setFixedWidth(0);
          setFixedWidthUnits('px');
          setHideProportional(true);
          setHideCustom(false);
          setHideFixed(true);
          break;
        }
    }
    setColumnWidthType(event);
  }

  /**
   * Process change to the minimum width unit type.
   *
   * @since    1.0.0
   *
   * @param {string} event Minimum width unit type
   */
  function onMinimumWidthUnits(event) {
    setMinWidthUnits(event);
  }

  /**
   * Process change to the maximum width unit type
   *
   * @since    1.0.0
   *
   * @param {string} event Maximum width unit type
   */
  function onMaximumWidthUnits(event) {
    setMaxWidthUnits(event);
  }

  /**
   * Process change to the fixed width unit type
   *
   * @since    1.0.0
   *
   * @param {string} event Fixed width unit type
   */
  function onFixedWidthUnits(event) {
    setFixedWidthUnits(event);
  }

  /**
   * Process change to hide column for tablet form factor.
   *
   * @since    1.0.0
   *
   * @param {boolean} checked Hide for tablets
   */
  function onTablet(checked) {
    setDisableForTablet(checked);
  }

  /**
   * Process change to hide column for phone form factor.
   *
   * @since    1.0.0
   *
   * @param {*} checked Hide for phones
   */
  function onPhone(checked) {
    setDisableForPhone(checked);
  }

  /**
   * Process form submit.
   *
   * @since    1.0.0
   *
   * @param {Object} event Form submit
   */
  function onUpdate(event) {
    const updatedColumnAttributes = {
      columnWidthType: columnWidthType,
      minWidth: minWidth,
      minWidthUnits: minWidthUnits,
      maxWidth: Number(maxWidth),
      maxWidthUnits: maxWidthUnits,
      fixedWidth: fixedWidth,
      fixedWidthUnits: fixedWidthUnits,
      disableForTablet: disableForTablet,
      disableForPhone: disableForPhone,
      isFixedLeftColumnGroup: false,
      horizontalAlignment: 'none',
      columnDataType: dataType
    };
    updatedColumn(event, 'attributes', tableId, columnId, updatedColumnAttributes);
    close();
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Modal, {
      title: "Configure Column Width",
      onRequestClose: handleCancel,
      focusOnMount: "firstContentElement",
      isDismissible: "false",
      shouldCloseOnClickOutside: "false",
      size: "large",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("p", {
        className: "column-label",
        children: ["For column ", columnLabel]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("form", {
        onSubmit: onUpdate,
        onMouseDown: stopProp,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
          label: "Width Type",
          value: columnWidthType,
          onChange: e => onWidthType(e),
          options: [{
            value: 'Proportional',
            label: 'Proportional'
          }, {
            value: 'Auto',
            label: 'Automatic'
          }, {
            value: 'Fixed',
            label: 'Fixed width'
          }, {
            value: 'Custom',
            label: 'Custom'
          }],
          __nextHasNoMarginBottom: true
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("fieldset", {
          className: hideProportional === true ? ' column-width--not-visible' : '',
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("legend", {
            children: "Set Proportional Width"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalNumberControl, {
            className: "column-width-value-input",
            label: "Number of portions",
            labelPosition: "side",
            value: maxWidth,
            onChange: value => setMaxWidth(Number(value))
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("span", {
            className: "column-width-span-input",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalNumberControl, {
              className: "column-width-value-input",
              label: "Minimum width",
              labelPosition: "left",
              value: minWidth,
              onChange: value => setMinWidth(Number(value))
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
              className: "column-width-unit-input",
              labelPosition: "left",
              label: "Units",
              value: minWidthUnits,
              onChange: e => onMinimumWidthUnits(e),
              options: [{
                value: 'px',
                label: 'pixels'
              }, {
                value: 'ch',
                label: 'characters'
              }, {
                value: 'pt',
                label: 'points'
              }, {
                value: 'in',
                label: 'inches'
              }, {
                value: 'fr',
                label: 'proportional'
              }],
              __nextHasNoMarginBottom: true
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("fieldset", {
          className: hideFixed === true ? 'column-width--not-visible' : '',
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("legend", {
            children: "Set Fixed Width"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("span", {
            className: "column-width-span-input",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalNumberControl, {
              className: "column-width-input",
              label: "Fixed width",
              labelPosition: "left",
              value: fixedWidth,
              onChange: value => setFixedWidth(Number(value))
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
              className: "column-width-unit-input",
              label: "Units",
              labelPosition: "left",
              value: fixedWidthUnits,
              onChange: e => onFixedWidthUnits(e),
              options: [{
                value: 'px',
                label: 'pixels'
              }, {
                value: 'ch',
                label: 'font'
              }, {
                value: 'pt',
                label: 'points'
              }, {
                value: 'in',
                label: 'inches'
              }, {
                value: 'fr',
                label: 'proportional'
              }],
              __nextHasNoMarginBottom: true
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("fieldset", {
          className: hideCustom === true ? 'column-width--not-visible' : '',
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("legend", {
            children: "Set Custom Width"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("span", {
            className: "column-width-span-input",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalNumberControl, {
              className: "column-width-input",
              label: "Minimum width",
              labelPosition: "left",
              value: minWidth,
              onChange: value => setMinWidth(Number(value))
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
              className: "column-width-unit-input",
              labelPosition: "left",
              label: "Units",
              value: minWidthUnits,
              onChange: e => onMinimumWidthUnits(e),
              options: [{
                value: 'px',
                label: 'pixels'
              }, {
                value: 'ch',
                label: 'characters'
              }, {
                value: 'pt',
                label: 'points'
              }, {
                value: 'in',
                label: 'inches'
              }, {
                value: 'fr',
                label: 'proportional'
              }],
              __nextHasNoMarginBottom: true
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("span", {
            className: "column-width-span-input",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalNumberControl, {
              className: "column-width-input",
              label: "Maximum width",
              labelPosition: "left",
              value: maxWidth,
              onChange: value => setMaxWidth(Number(value))
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
              className: "column-width-unit-input",
              labelPosition: "left",
              label: "Units",
              value: maxWidthUnits,
              onChange: e => onMaximumWidthUnits(e),
              options: [{
                value: 'px',
                label: 'pixels'
              }, {
                value: 'ch',
                label: 'characters'
              }, {
                value: 'pt',
                label: 'points'
              }, {
                value: 'in',
                label: 'inches'
              }, {
                value: 'fr',
                label: 'proportional'
              }],
              __nextHasNoMarginBottom: true
            })]
          })]
        }), enableProFeatures && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.CheckboxControl, {
            label: "Hide for tablet",
            checked: disableForTablet,
            onChange: onTablet
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.CheckboxControl, {
            label: "Hide for phone",
            checked: disableForPhone,
            onChange: onPhone
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("span", {
          className: "configure-column-modal__button-group",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
            variant: "secondary",
            onClick: handleCancel,
            children: "Cancel"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
            variant: "primary",
            type: "submit",
            children: "Update"
          })]
        })]
      })]
    })
  });
}
const ColumnWidthModal = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.memo)(ConfigureColumnWidth);

/***/ },

/***/ "./src/components/configure-row-height/index.js"
/*!******************************************************!*\
  !*** ./src/components/configure-row-height/index.js ***!
  \******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RowHeightModal: () => (/* binding */ RowHeightModal)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./style.scss */ "./src/components/configure-row-height/style.scss");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__);
/* External dependencies */



/**
 * Internal dependencies
 */


/**
 * React component to support updates for the current row height.
 *
 * @since    1.0.0
 * @since    1.2.0 REfactored to support updates to the RowMenu component.
 *
 * @param {Object} props
 * @return {Object} Updated column properties
 */

function ConfigureRowHeight(props = {}) {
  const {
    tableId,
    rowId,
    rowLabel,
    rowAttributes,
    updatedRow,
    onRequestClose
  } = props;
  const [rowHeightType, setRowHeightType] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)();
  const [hideCustom, setHideCustom] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(true);
  const [hideFixed, setHideFixed] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(true);
  const [minHeight, setMinHeight] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
  const [minHeightUnits, setMinHeightUnits] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)();
  const [maxHeight, setMaxHeight] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(1);
  const [maxHeightUnits, setMaxHeightUnits] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)();
  const [fixedHeight, setFixedHeight] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
  const [fixedHeightUnits, setFixedHeightUnits] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)();
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    switch (rowAttributes.rowHeightType) {
      case 'Auto':
        {
          setHideCustom(true);
          setHideFixed(true);
          break;
        }
      case 'Fixed':
        {
          setHideCustom(true);
          setHideFixed(false);
          break;
        }
      case 'Custom':
        {
          setHideCustom(false);
          setHideFixed(true);
          break;
        }
    }
    setRowHeightType(rowAttributes.rowHeightType);
    setMinHeight(rowAttributes.minHeight);
    setMinHeightUnits(rowAttributes.minHeightUnits);
    setMaxHeight(rowAttributes.maxHeight);
    setMaxHeightUnits(rowAttributes.maxHeightUnits);
    setFixedHeight(rowAttributes.fixedHeight);
    setFixedHeightUnits(rowAttributes.fixedHeightUnits);
  }, [rowAttributes]);

  /**
   * Close component modal.
   *
   * @since    1.2.0
   */
  function close() {
    onRequestClose?.();
  }

  /**
   * Stop event processing in favor of custom processing.
   *
   * @since    1.0.0
   *
   * @param {Object} event Mouse down
   */
  function stopProp(event) {
    event.stopPropagation();
  }

  /**
   * Close modal on cancel.
   *
   * @since    1.0.0
   *
   * @param {Object} event Cancel
   */
  function handleCancel() {
    onRequestClose?.();
  }

  /**
   * Process change in height type and set detault props for the type.
   *
   * @since    1.0.0
   *
   * @param {string} event New row height type
   */
  function onHeightType(event) {
    switch (event) {
      case 'Auto':
        {
          setMaxHeight(0);
          setMaxHeightUnits('fr');
          setMinHeight(0);
          setMinHeightUnits('ch');
          setFixedHeight(0);
          setFixedHeightUnits('px');
          setHideCustom(true);
          setHideFixed(true);
          break;
        }
      case 'Fixed':
        {
          setMaxHeight(0);
          setMaxHeightUnits('fr');
          setMinHeight(0);
          setMinHeightUnits('ch');
          setFixedHeight(40);
          setFixedHeightUnits('px');
          setHideCustom(true);
          setHideFixed(false);
          break;
        }
      case 'Custom':
        {
          setMaxHeight(40);
          setMaxHeightUnits('ch');
          setMinHeight(20);
          setMinHeightUnits('ch');
          setFixedHeight(0);
          setFixedHeightUnits('px');
          setHideCustom(false);
          setHideFixed(true);
          break;
        }
    }
    setRowHeightType(event);
  }

  /**
   * Process change to the minimum height unit type.
   *
   * @since    1.0.0
   *
   * @param {string} event Minimum height unit type
   */
  function onMinimumHeightUnits(event) {
    setMinHeightUnits(event);
  }

  /**
   * Process change to the maximum height unit type
   *
   * @since    1.0.0
   *
   * @param {string} event Maximum height unit type
   */
  function onMaximumHeightUnits(event) {
    setMaxHeightUnits(event);
  }

  /**
   * Process change to the fixed height unit type
   *
   * @since    1.0.0
   *
   * @param {string} event Fixed height unit type
   */
  function onFixedHeightUnits(event) {
    setFixedHeightUnits(event);
  }

  /**
   * Process form submit.
   *
   * @since    1.0.0
   *
   * @param {Object} event Form submit
   */
  function onUpdate(event) {
    const updatedRowAttributes = {
      rowHeightType: rowHeightType,
      minHeight: minHeight,
      minHeightUnits: minHeightUnits,
      maxHeight: Number(maxHeight),
      maxHeightUnits: maxHeightUnits,
      fixedHeight: fixedHeight,
      fixedHeightUnits: fixedHeightUnits,
      isFixedLeftRowGroup: false,
      horizontalAlignment: 'none'
    };
    updatedRow(event, 'attributes', tableId, rowId, updatedRowAttributes);
    close();
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Modal, {
    title: "Configure Row Height",
    onRequestClose: handleCancel,
    focusOnMount: "firstContentElement",
    isDismissible: false,
    shouldCloseOnClickOutside: false,
    size: "large",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("p", {
      className: "row-label",
      children: ["For row ", rowLabel]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("form", {
      onSubmit: onUpdate,
      onMouseDown: stopProp,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
        label: "Height Type",
        value: rowHeightType,
        onChange: e => onHeightType(e),
        options: [{
          value: 'Auto',
          label: 'Automatic'
        }, {
          value: 'Fixed',
          label: 'Fixed height'
        }, {
          value: 'Custom',
          label: 'Custom'
        }],
        __nextHasNoMarginBottom: true
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("fieldset", {
        className: hideFixed === true ? 'row-height--not-visible' : '',
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("legend", {
          children: "Set Fixed Height"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("span", {
          className: "row-height-span-input",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalNumberControl, {
            className: "row-height-input",
            label: "Fixed height",
            labelPosition: "left",
            value: fixedHeight,
            onChange: value => setFixedHeight(Number(value))
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
            className: "row-height-unit-input",
            label: "Units",
            labelPosition: "left",
            value: fixedHeightUnits,
            onChange: e => onFixedHeightUnits(e),
            options: [{
              value: 'px',
              label: 'pixels'
            }, {
              value: 'ch',
              label: 'font'
            }, {
              value: 'pt',
              label: 'points'
            }, {
              value: 'in',
              label: 'inches'
            }, {
              value: 'fr',
              label: 'proportional'
            }],
            __nextHasNoMarginBottom: true
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("fieldset", {
        className: hideCustom === true ? 'row-height--not-visible' : '',
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("legend", {
          children: "Set Custom Height"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("span", {
          className: "row-height-span-input",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalNumberControl, {
            className: "row-height-input",
            label: "Minimum height",
            labelPosition: "left",
            value: minHeight,
            onChange: value => setMinHeight(Number(value))
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
            className: "row-height-unit-input",
            labelPosition: "left",
            label: "Units",
            value: minHeightUnits,
            onChange: e => onMinimumHeightUnits(e),
            options: [{
              value: 'px',
              label: 'pixels'
            }, {
              value: 'ch',
              label: 'characters'
            }, {
              value: 'pt',
              label: 'points'
            }, {
              value: 'in',
              label: 'inches'
            }, {
              value: 'fr',
              label: 'proportional'
            }],
            __nextHasNoMarginBottom: true
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("span", {
          className: "row-height-span-input",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalNumberControl, {
            className: "row-height-input",
            label: "Maximum height",
            labelPosition: "left",
            value: maxHeight,
            onChange: value => setMaxHeight(Number(value))
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.SelectControl, {
            className: "row-height-unit-input",
            labelPosition: "left",
            label: "Units",
            value: maxHeightUnits,
            onChange: e => onMaximumHeightUnits(e),
            options: [{
              value: 'px',
              label: 'pixels'
            }, {
              value: 'ch',
              label: 'characters'
            }, {
              value: 'pt',
              label: 'points'
            }, {
              value: 'in',
              label: 'inches'
            }, {
              value: 'fr',
              label: 'proportional'
            }],
            __nextHasNoMarginBottom: true
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("span", {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          variant: "secondary",
          onClick: handleCancel,
          children: "Cancel"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          variant: "primary",
          type: "submit",
          children: "Update"
        })]
      })]
    })]
  });
}
const RowHeightModal = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.memo)(ConfigureRowHeight);

/***/ },

/***/ "./src/components/index.js"
/*!*********************************!*\
  !*** ./src/components/index.js ***!
  \*********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ColumnDataTypeModal: () => (/* reexport safe */ _configure_column_data_types__WEBPACK_IMPORTED_MODULE_2__.ColumnDataTypeModal),
/* harmony export */   ColumnMenu: () => (/* reexport safe */ _column_dropdown_menu__WEBPACK_IMPORTED_MODULE_0__.ColumnMenu),
/* harmony export */   ColumnWidthModal: () => (/* reexport safe */ _configure_column_width__WEBPACK_IMPORTED_MODULE_1__.ColumnWidthModal),
/* harmony export */   RowHeightModal: () => (/* reexport safe */ _configure_row_height__WEBPACK_IMPORTED_MODULE_4__.RowHeightModal),
/* harmony export */   RowMenu: () => (/* reexport safe */ _row_dropdown_menu__WEBPACK_IMPORTED_MODULE_3__.RowMenu)
/* harmony export */ });
/* harmony import */ var _column_dropdown_menu__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./column-dropdown-menu */ "./src/components/column-dropdown-menu/index.js");
/* harmony import */ var _configure_column_width__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./configure-column-width */ "./src/components/configure-column-width/index.js");
/* harmony import */ var _configure_column_data_types__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./configure-column-data-types */ "./src/components/configure-column-data-types/index.js");
/* harmony import */ var _row_dropdown_menu__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./row-dropdown-menu */ "./src/components/row-dropdown-menu/index.js");
/* harmony import */ var _configure_row_height__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./configure-row-height */ "./src/components/configure-row-height/index.js");
/* Export table column react components */




/* Export table row react components */



/***/ },

/***/ "./src/components/row-dropdown-menu/index.js"
/*!***************************************************!*\
  !*** ./src/components/row-dropdown-menu/index.js ***!
  \***************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RowMenu: () => (/* binding */ RowMenu)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/settings.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/table-row-after.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/table-row-before.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/table-row-delete.mjs");
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./style.scss */ "./src/components/row-dropdown-menu/style.scss");
/* harmony import */ var _editor_scss__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../editor.scss */ "./src/editor.scss");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__);
/* External dependencies */




/* Internal dependencies */



/**
 * React component drop down menu to configure current row properties.
 *
 * @since    1.0.0
 * @since    1.1.2 Refactor component to improve UX and prerformance
 * @since    1.2.2 Added support to move rows and add rows both up and down
 * @param {Object} props
 * @return {Object} Updated row
 */

function RowMenuImpl(props = {}) {
  const {
    anchor,
    table,
    rowId,
    rowLabel,
    rowAttributes,
    updatedRow,
    onRequestClose
  } = props;
  const tableId = table?.table_id;

  // Support disabling row movement that would bring out-of-bounds conditions
  const numTableRows = table?.rows?.length - 1;
  const lastRowId = table?.rows[numTableRows]?.row_id;
  const headerRowId = table?.rows?.find(r => r.attributes.isHeader === true)?.row_id;
  const firstBodyRowId = headerRowId ? Number(headerRowId) + 1 : 1;
  const disableInsertRowUp = Number(rowId) === 0 ? true : false;
  const disableMoveRowUp = Number(rowId) <= Number(firstBodyRowId) ? true : false;
  const disableMoveRowDown = Number(lastRowId) === Number(rowId) ? true : false;

  // Refs for focus management
  const menuRootRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const firstItemRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);

  /**
   * Close the menu based on event actions
   *
   * @since    1.1.2
   */
  const close = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    onRequestClose?.();
  }, [onRequestClose]);

  /**
   * Handle keyboard navigation.
   *
   * Description: Escape closes; Up/Down moves among menu items.
   *
   * @since    1.1.2
   *
   * @param {Object} e Key down event
   *
   */
  const onKeyDown = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
      onRequestClose?.();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const root = menuRootRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll('button,[role="menuitem"]')).filter(el => !el.disabled && el.getAttribute('aria-disabled') !== 'true');
    if (!items.length) return;
    const doc = root.ownerDocument;
    const active = doc?.activeElement;
    const idx = items.indexOf(active);
    const dir = e.key === 'ArrowDown' ? 1 : -1;
    const nextIdx = idx === -1 ? 0 : (idx + dir + items.length) % items.length;
    items[nextIdx]?.focus?.();
  }, [onRequestClose]);

  /**
   * Close the menu when the popover requests to close.
   *
   * @since    1.1.2
   */
  const handlePopoverClose = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    onRequestClose?.();
  }, [onRequestClose]);
  const hasTableId = tableId !== null && tableId !== undefined;
  const hasRowId = rowId !== null && rowId !== undefined;
  const canRender = !!anchor && typeof updatedRow === 'function' && hasTableId && hasRowId;

  // Focus first item on open (next frame so Popover has mounted)
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    // Only do focus work when we’re actually rendering the menu
    if (!canRender) return;
    window.requestAnimationFrame(() => {
      // Prefer explicit first item ref; fallback to first button inside menu
      const el = firstItemRef.current || menuRootRef.current?.querySelector?.('button,[role="menuitem"]');
      el?.focus?.();
    });
  }, [canRender, anchor, rowId]);

  /**
   * Row attributes for inserting new row.
   *
   * @since    1.0.0
   * @since    1.1.2 Refactor to use useCallback for performance purposes
   * @since    1.2.2 Allow row to be inserted either above or below the current row
   *
   * @param {Object} event     Menu action
   * @param {number} rowId     Row ID for new row
   * @param {string} direction Insert Row either above or below
   */
  const onInsertRow = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((event, targetRowId, direction) => {
    const updateType = direction === 'above' ? 'insert-above' : 'insert-below';
    updatedRow(event, updateType, tableId, targetRowId, '');
    close();
  }, [updatedRow, tableId, close]);

  /**
   * Row to delete.
   *
   * @since    1.0.0
   * @since    1.1.2 Refactor to use useCallback for performance purposes
   *
   * @param {Object} event Menu action
   * @param {number} rowId Row ID for row to remove
   */
  const onDeleteRow = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((event, targetRowId) => {
    updatedRow(event, 'delete', tableId, targetRowId, '');
    close();
  }, [updatedRow, tableId, close]);

  /**
   * Row attributes for moving a row up or down.
   *
   * @since    1.2.2
   *
   * @param {Object} event Menu action
   * @param {number} rowId Row ID for new row
   */
  const onMoveRow = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((event, targetRowId, direction) => {
    const updateType = direction === 'up' ? 'move-up' : 'move-down';
    updatedRow(event, updateType, tableId, targetRowId, '');
    close();
  }, [updatedRow, tableId, close]);

  /**
   * Updated row attributes for processing.
   *
   * @since    1.0.0
   * @since    1.1.2 Refactor to move row height handling up to parent component
   *
   * @param {Object} event       Menu action
   * @param {number} targetRowId Row ID for update
   */
  const onUpdateRowHeight = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((event, targetRowId) => {
    updatedRow(event, 'attributes', tableId, targetRowId, '');
    close();
  }, [tableId, close]);
  if (!canRender) return null;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.Fragment, {
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Popover, {
      anchor: anchor,
      ref: menuRootRef,
      className: "menu-row__main",
      role: "menu",
      "aria-label": `Row ${rowLabel} menu`,
      placement: "right-start",
      focusOnMount: false,
      offset: 8,
      noArrow: false,
      flip: true,
      tabIndex: -1,
      onKeyDown: onKeyDown,
      onClose: handlePopoverClose,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuGroup, {
        className: "components-menu-group",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
          icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
          onClick: e => onUpdateRowHeight(e, rowId),
          ref: firstItemRef,
          children: "Update Row Height..."
        })
      }), !rowAttributes.isHeader && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.Fragment, {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuGroup, {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
            icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__["default"],
            disabled: disableInsertRowUp,
            onClick: e => onInsertRow(e, rowId, 'above'),
            children: "Insert Row Above"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
            icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__["default"],
            onClick: e => onInsertRow(e, rowId, 'below'),
            children: "Insert Row Below"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuGroup, {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
            shortcut: 'Alt + ↑',
            disabled: disableMoveRowUp,
            onClick: e => onMoveRow(e, rowId, 'up'),
            children: "Move Row Up"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
            shortcut: 'Alt + ↓',
            disabled: disableMoveRowDown,
            onClick: e => onMoveRow(e, rowId, 'down'),
            children: "Move Row Down"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuGroup, {
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
            icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_5__["default"],
            onClick: e => onDeleteRow(e, rowId),
            children: "Delete Row"
          })
        })]
      })]
    })
  });
}
const RowMenu = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.memo)(RowMenuImpl);

/***/ },

/***/ "./src/data/action-types.js"
/*!**********************************!*\
  !*** ./src/data/action-types.js ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Valid reducer action types.
 *
 * @since    x.x.x
 *
 * @type     {Object} Constants to support Reducer
 */
const TYPES = {
  CREATE_TABLE: 'CREATE_TABLE',
  INSERT_COLUMN: 'INSERT_COLUMN',
  INSERT_ROW: 'INSERT_ROW',
  DELETE_TABLE: 'DELETE_TABLE',
  DELETE_COLUMN: 'DELETE_COLUMN',
  DELETE_ROW: 'DELETE_ROW',
  MOVE_COLUMN: 'MOVE_COLUMN',
  MOVE_ROW: 'MOVE_ROW',
  CHANGE_TABLE_ID: 'CHANGE_TABLE_ID',
  UPDATE_TABLE_PROP: 'UPDATE_TABLE_PROP',
  REMOVE_TABLE_PROP: 'REMOVE_TABLE_PROP',
  UPDATE_ROW: 'UPDATE_ROW',
  UPDATE_COLUMN: 'UPDATE_COLUMN',
  UPDATE_CELL: 'UPDATE_CELL',
  RECEIVE_HYDRATE: 'RECEIVE_HYDRATE',
  RECEIVE_HYDRATE_TEST: 'RECEIVE_HYDRATE_TEST',
  PROCESS_BORDERS: 'PROCESS_BORDERS'
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (TYPES);

/***/ },

/***/ "./src/data/actions.js"
/*!*****************************!*\
  !*** ./src/data/actions.js ***!
  \*****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   addColumn: () => (/* binding */ addColumn),
/* harmony export */   addRow: () => (/* binding */ addRow),
/* harmony export */   assignTableId: () => (/* binding */ assignTableId),
/* harmony export */   cloneTable: () => (/* binding */ cloneTable),
/* harmony export */   createTableEntity: () => (/* binding */ createTableEntity),
/* harmony export */   deleteTableEntity: () => (/* binding */ deleteTableEntity),
/* harmony export */   moveColumn: () => (/* binding */ moveColumn),
/* harmony export */   moveRow: () => (/* binding */ moveRow),
/* harmony export */   processDeletedTables: () => (/* binding */ processDeletedTables),
/* harmony export */   processUnmountedTables: () => (/* binding */ processUnmountedTables),
/* harmony export */   receiveNewTable: () => (/* binding */ receiveNewTable),
/* harmony export */   receiveTable: () => (/* binding */ receiveTable),
/* harmony export */   removeColumn: () => (/* binding */ removeColumn),
/* harmony export */   removeRow: () => (/* binding */ removeRow),
/* harmony export */   removeTableBlock: () => (/* binding */ removeTableBlock),
/* harmony export */   removeTableProp: () => (/* binding */ removeTableProp),
/* harmony export */   saveTableEntity: () => (/* binding */ saveTableEntity),
/* harmony export */   updateCell: () => (/* binding */ updateCell),
/* harmony export */   updateColumn: () => (/* binding */ updateColumn),
/* harmony export */   updateRow: () => (/* binding */ updateRow),
/* harmony export */   updateTableBorder: () => (/* binding */ updateTableBorder),
/* harmony export */   updateTableEntity: () => (/* binding */ updateTableEntity),
/* harmony export */   updateTableProp: () => (/* binding */ updateTableProp)
/* harmony export */ });
/* harmony import */ var _wordpress_core_data__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/core-data */ "@wordpress/core-data");
/* harmony import */ var _wordpress_core_data__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_core_data__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _action_types_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./action-types.js */ "./src/data/action-types.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils */ "./src/utils.js");
/* External dependencies */



/* Internal dependencies */



/* Load constants */
const {
  CREATE_TABLE,
  INSERT_COLUMN,
  INSERT_ROW,
  DELETE_TABLE,
  DELETE_COLUMN,
  DELETE_ROW,
  MOVE_COLUMN,
  MOVE_ROW,
  CHANGE_TABLE_ID,
  UPDATE_TABLE_PROP,
  REMOVE_TABLE_PROP,
  UPDATE_ROW,
  UPDATE_COLUMN,
  UPDATE_CELL,
  RECEIVE_HYDRATE,
  PROCESS_BORDERS
} = _action_types_js__WEBPACK_IMPORTED_MODULE_2__["default"];

/**
 * Returns action object used in signalling a new table has been received
 * from UI.
 *
 * @since    1.0.0
 *
 * @param {Object} table Dynamic Table
 * @return  {Object} Action object
 */
function receiveNewTable(table) {
  return {
    type: CREATE_TABLE,
    tableId: table.table.table_id,
    ...table
  };
}

/**
 * Returns action object used in signalling a new table has been received
 * from REST service.
 *
 * @since    1.0.0
 *
 * @param {number}       table_id        Identifier key for the table
 * @param {string}       block_table_ref Cross reference identified linking table to block within post
 * @param {string}       table_status    Status of retrieved table
 * @param {number}       post_id         Identifier key for the post in which the table appears
 * @param {string}       table_name      Descriptive name of table
 * @param {Array}        attributes      Table header level attributes
 * @param {string}       classes         Table header level classes
 * @param {Array|Object} rows            Array of table row objects
 * @param {Array|Object} columns         Array of table column objects
 * @param {Array|Object} cells           Array of table cell objects
 * @return {Object} Action object
 */
function receiveTable(table_id, block_table_ref, table_status, post_id, table_name, attributes, classes, rows, columns, cells) {
  return {
    type: RECEIVE_HYDRATE,
    tableId: table_id,
    table: {
      table_id,
      block_table_ref,
      table_status,
      post_id,
      table_name,
      attributes,
      classes,
      rows,
      columns,
      cells
    }
  };
}

/**
 * Signals that table needs to be cloned, setting the table_id to zero and providng
 * a new table postId and blockTableRef.
 *
 * @since    1.1.0
 *
 * @param {*} tableId
 * @param {*} postId
 * @param {*} blockTableRef
 * @return {Object} Action object
 */
const cloneTable = (tableId, postId, blockTableRef) => async ({
  select,
  dispatch,
  registry
}) => {
  const {
    table_name,
    attributes,
    classes,
    rows,
    columns,
    cells
  } = select.getTable(tableId, true);
  const rowsWithResetId = [];
  const columnsWithResetId = [];
  const cellsWithResetId = [];
  rows.forEach(row => {
    const cloneRow = {
      ...row,
      table_id: '0'
    };
    rowsWithResetId.push(cloneRow);
  });
  columns.forEach(column => {
    const cloneColumn = {
      ...column,
      table_id: '0'
    };
    columnsWithResetId.push(cloneColumn);
  });
  cells.forEach(cell => {
    const cloneCell = {
      ...cell,
      table_id: '0'
    };
    cellsWithResetId.push(cloneCell);
  });
  const newTable = {
    title: table_name,
    header: {
      id: '0',
      block_table_ref: blockTableRef,
      status: 'new',
      post_id: postId,
      table_name: table_name,
      attributes: attributes,
      classes: classes
    },
    rows: [...rowsWithResetId],
    columns: [...columnsWithResetId],
    cells: [...cellsWithResetId]
  };
  try {
    const tableEntity = await registry.dispatch(_wordpress_core_data__WEBPACK_IMPORTED_MODULE_0__.store).saveEntityRecord('dynamic-table-blocks', 'table', newTable);
    const table = tableEntity;
    const table_id = table.id;
    const block_table_ref = table.header.block_table_ref;
    const table_status = table.header.status;
    const post_id = table.header.post_id;
    const table_name = table.header.table_name;
    const attributes = table.header.attributes;
    const classes = table.header.classes;
    const rows = table.rows;
    const columns = table.columns;
    (0,_utils__WEBPACK_IMPORTED_MODULE_3__.computeCellIds)(table.cells);
    const cells = table.cells;
    dispatch.receiveTable(table_id, block_table_ref, table_status, post_id, table_name, attributes, classes, rows, columns, cells);
    return tableEntity.id;
  } catch (error) {
    console.log('Error details: ' + error);
    console.log(newTable);
    console.log('Error in createTableEntity -  Block table ref = ' + newTable.header.block_table_ref + ', Post Id = ' + newTable.header.post_id);
  }
};

/**
 * Action to create WordPress Core-Data dynamic table entity based on local table.
 * persists the data as soon as the table is created, before post is saved/published.
 *
 * @since    1.0.0
 *
 * @return  {Object} Action object
 */
const createTableEntity = () => async ({
  select,
  dispatch,
  registry
}) => {
  const {
    table_id,
    block_table_ref,
    post_id,
    table_name,
    attributes,
    classes,
    rows,
    columns,
    cells
  } = select.getTable('0', true);
  const newTable = {
    title: table_name,
    header: {
      id: table_id,
      block_table_ref: block_table_ref,
      status: 'new',
      post_id: post_id,
      table_name: table_name,
      attributes: attributes,
      classes: classes
    },
    rows: [...rows],
    columns: [...columns],
    cells: [...cells]
  };
  try {
    const tableEntity = await registry.dispatch(_wordpress_core_data__WEBPACK_IMPORTED_MODULE_0__.store).saveEntityRecord('dynamic-table-blocks', 'table', newTable);
    dispatch.assignTableId(tableEntity.id);
    return tableEntity.id;
  } catch (error) {
    console.log('Error details: ' + error);
    console.log(newTable);
    console.log('Error in createTableEntity -  Table ID - ' + table_id + ', block table ref = ' + block_table_ref + ', Post Id = ' + post_id);
  }
};

/**
 * Action to save table entity changes that are required for processing
 * at time other than when the post is saved/published.
 *
 * @since    1.0.0
 *
 * @param {number} tableId Identifier key for the table
 * @return {Object} Action Object
 */
const saveTableEntity = tableId => ({
  registry
}) => {
  try {
    registry.dispatch(_wordpress_core_data__WEBPACK_IMPORTED_MODULE_0__.store).saveEditedEntityRecord('dynamic-table-blocks', 'table', tableId);
  } catch (error) {
    console.log('Error in saveTableEntity - Table ID - ' + tableId);
    alert('            ...Save Table Entity - async error - ' + error);
  }
};

/**
 * Update table entity based on changes made to local table updates.  This does
 * not persist changes, only queues them for when the post is saved/published.
 *
 * @since    1.0.0
 *
 * @param {*}      tableId                  Identifier key for the table
 * @param {string} [overrideTableStatus=''] Updates the table's status if populated
 * @return  {Object} Action Object
 */
const updateTableEntity = (tableId, overrideTableStatus = '') => ({
  select,
  registry
}) => {
  const {
    table_id,
    block_table_ref,
    table_status,
    post_id,
    table_name,
    attributes,
    classes,
    rows,
    columns,
    cells
  } = select.getTable(tableId, false);

  // Remove border row if it exists
  const filteredRows = rows.filter(row => row.row_id !== '0');

  // Remove border column if it exists
  const filteredColumns = columns.filter(column => column.column_id !== '0');

  // Remove border cells if they exists
  const filteredCells = cells.filter(cell => cell.row_id !== '0' && cell.column_id !== '0');

  // Remove cell_id from cells.  They don't go back to the webservice
  const transformedCells = filteredCells.map(({
    table_id,
    column_id,
    row_id,
    attributes,
    classes,
    content
  }) => ({
    table_id,
    column_id,
    row_id,
    attributes,
    classes,
    content
  }));
  const tableStatus = (overrideTableStatus, table_status) => {
    if (overrideTableStatus) {
      return overrideTableStatus;
    }
    return table_status;
  };
  const updatedTable = {
    id: tableId,
    title: table_name,
    header: {
      id: table_id,
      block_table_ref: block_table_ref,
      status: tableStatus(overrideTableStatus, table_status),
      post_id: post_id,
      table_name: table_name,
      attributes: attributes,
      classes: classes
    },
    rows: [...filteredRows],
    columns: [...filteredColumns],
    cells: [...transformedCells]
  };

  /**
   * Options: isCached: Bool
   *          undoIgnore: Bool
   */
  try {
    registry.dispatch(_wordpress_core_data__WEBPACK_IMPORTED_MODULE_0__.store).editEntityRecord('dynamic-table-blocks', 'table', table_id, updatedTable);
  } catch (error) {
    console.log('Error in updateTableEntity - Table ID - ' + tableId);
    alert('            ...Update Table Entity - async error - ' + error);
  }
};

/**
 * Remove table entity.  The delete is persisted.
 *
 * @since    1.0.0
 *
 * @see      processDeletedTables
 *
 * @param {number} tableId Identifier key for the table
 * @return {Object} Action Object
 */
const deleteTableEntity = tableId => async ({
  select,
  dispatch,
  registry
}) => {
  try {
    const deletedTableEntity = await registry.dispatch(_wordpress_core_data__WEBPACK_IMPORTED_MODULE_0__.store).deleteEntityRecord('dynamic-table-blocks', 'table', tableId);
    dispatch({
      type: DELETE_TABLE,
      tableId
    });
  } catch (error) {
    console.log('Error in deleteTableEntity - Table ID - ' + tableId);
    alert('            ...Resolver - async error - ' + error);
  }
};

/**
 * Signals a delete of table entities for all local tables with a status of 'deleted'.
 *
 * @since    1.0.0
 *
 * @param {Object} deletedTables Object of deleted tables
 * @return  {Object} Action object
 */
const processDeletedTables = deletedTables => ({
  dispatch
}) => {
  Object.keys(deletedTables).forEach(key => {
    dispatch.deleteTableEntity(deletedTables[key].table_id);
  });
};

/**
 * Searches for previously unmounted tables block in post.  If found, remove block id
 * attribute. Otherwise, mark table with a deleted.
 *
 * @since    1.0.0
 * @since    1.1.0  Refactored to use table_id and block_table_ref for matching
 *
 * @param {Object} unmountedTables Object of currently unmounted tables
 * @return  {Object} Action object
 */
const processUnmountedTables = unmountedTables => ({
  dispatch,
  registry
}) => {
  Object.keys(unmountedTables).forEach(key => {
    const priorStatus = unmountedTables[key].prior_status;
    const isBlockPattern = unmountedTables[key].isPattern ? true : false;

    // Search all blocks to find a match for this unmounted table block.
    const tableBlock = hasDynamicTableBlock(registry, unmountedTables[key]);
    if (tableBlock) {
      dispatch.updateTableProp(unmountedTables[key].table_id, 'table_status', priorStatus);
      dispatch.removeTableProp(unmountedTables[key].table_id, 'prior_status');
      dispatch.removeTableProp(unmountedTables[key].table_id, 'unmounted_block');
      dispatch.updateTableEntity(unmountedTables[key].table_id);
    } else if (isBlockPattern) {
      dispatch.removeTableProp(unmountedTables[key].table_id, 'isPattern');
    } else {
      dispatch.updateTableProp(unmountedTables[key].table_id, 'table_status', 'deleted');
      dispatch.removeTableProp(unmountedTables[key].table_id, 'unmounted_block');
    }
  });
};

/**
 * Find your Dynamic Tables block by a stable key (block_table_ref) or fallback (table_id).
 *
 * @since    1.0.0
 *
 * @param {Object} registry      - Redux registry
 * @param {Object} tableStateRow - Unmounted table
 * @return {Object|null} block
 */
const hasDynamicTableBlock = (registry, tableStateRow) => {
  const tableId = tableStateRow.table_id;
  const blockTableRef = tableStateRow.block_table_ref;
  if (!blockTableRef || tableId === undefined || tableId === null) {
    return false;
  }
  const allBlocks = registry.select(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_1__.store).getBlocks();
  return blockTreeHasMatch(allBlocks, b => b?.name === 'dynamic-table-blocks/dynamic-table-blocks' && b?.attributes?.block_table_ref === blockTableRef && Number(b?.attributes?.table_id) === Number(tableId));
};
const blockTreeHasMatch = (blocks, predicate) => {
  for (const block of blocks) {
    if (predicate(block)) {
      return true;
    }
    if (block.innerBlocks?.length) {
      if (blockTreeHasMatch(block.innerBlocks, predicate)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Signals the removal of a table from the state tree only. The underlying table
 * remains persisted in the database.
 *
 * @since    1.0.0
 *
 * @param {number} tableId
 * @return {Object} Action object
 */
const removeTableBlock = tableId => {
  return {
    type: DELETE_TABLE,
    tableId
  };
};

/**
 * Signals the addition of a new table column.
 *
 * @since    1.0.0
 * @since    1.2.2  Added support to insert column either left or right of the current column
 *
 * @param {number}       tableId     Identifier key for the table
 * @param {number}       columnId    Identifier for a table column
 * @param {string}       direction   Add row above or below current row
 * @param {Object}       newColumn   Column definition
 * @param {Array|Object} columnCells Cell definitions associated with the column
 * @return  {Object} Action object
 */
const addColumn = (tableId, columnId, direction, newColumn, columnCells) => {
  return {
    type: INSERT_COLUMN,
    tableId,
    columnId,
    direction,
    newColumn,
    columnCells
  };
};

/**
 * Signals the addition of a new table row.
 *
 * @since    1.0.0
 * @since    1.2.2  Added support to insert row either above or below the current row
 *
 * @param {number}       tableId   Identifier key for the table
 * @param {number}       rowId     Identifier for a table row
 * @param {string}       direction Add row above or below current row
 * @param {Object}       newRow    Row definition
 * @param {Array|Object} rowCells  Cell definitions associated with the row
 * @return  {Object} Action object
 */
const addRow = (tableId, rowId, direction, newRow, rowCells) => {
  return {
    type: INSERT_ROW,
    tableId,
    rowId,
    direction,
    newRow,
    rowCells
  };
};

/**
 * Signals the removal of a table column.
 *
 * @since    1.0.0
 *
 * @param {number} tableId  Identifier key for the table
 * @param {number} columnId Identifier for a table column
 * @return  {Object} Action object
 */
const removeColumn = (tableId, columnId) => {
  return {
    type: DELETE_COLUMN,
    tableId,
    columnId
  };
};

/**
 * Signals the removal of a table row.
 *
 * @since    1.0.0
 *
 * @param {number} tableId Identifier key for the table
 * @param {number} rowId   Identifier for a table row
 * @return {Object} Action object
 */
const removeRow = (tableId, rowId) => {
  return {
    type: DELETE_ROW,
    tableId,
    rowId
  };
};

/**
 * Signals the move of a new table row (up or down).
 *
 * @since    1.2.2
 *
 * @param {number} tableId   Identifier key for the table
 * @param {number} columnId  Identifier for a table row
 * @param {string} direction Move row up or down
 * @return  {Object} Action object
 */
const moveColumn = (tableId, columnId, direction) => {
  return {
    type: MOVE_COLUMN,
    tableId,
    columnId,
    direction
  };
};

/**
 * Signals the move of a new table row (up or down).
 *
 * @since    1.2.2
 *
 * @param {number} tableId   Identifier key for the table
 * @param {number} rowId     Identifier for a table row
 * @param {string} direction Move row up or down
 * @return  {Object} Action object
 */
const moveRow = (tableId, rowId, direction) => {
  return {
    type: MOVE_ROW,
    tableId,
    rowId,
    direction
  };
};

/**
 * Signals the assignment of a table id following the creation of a new table.
 *
 * @since    1.0.0
 *
 * @param {number} tableId Identifier key for the table
 * @return  {Object} Action object
 */
const assignTableId = tableId => {
  return {
    type: CHANGE_TABLE_ID,
    tableId: '0',
    newTableId: String(tableId)
  };
};

/**
 * Signal an update to a header level table attribute.
 *
 * @since    1.0.0
 *
 * @param {number}              tableId   Identifier key for the table
 * @param {string}              attribute attribute name
 * @param {string|number|Array} value     New value for the attribute
 * @return  {Object} Action object
 */
const updateTableProp = (tableId, attribute, value) => {
  return {
    type: UPDATE_TABLE_PROP,
    tableId: tableId,
    attribute,
    value
  };
};

/**
 * Signal the removal of a header level table attribute.
 *
 * @since    1.0.0
 *
 * @param {number} tableId   Identifier key for the table
 * @param {string} attribute attribute name
 * @return  {Object} Action object
 */
const removeTableProp = (tableId, attribute) => {
  return {
    type: REMOVE_TABLE_PROP,
    tableId: tableId,
    attribute
  };
};

/**
 * Signal an update to a row attribute/prop.
 *
 * @since    1.0.0
 *
 * @param {number}        tableId   Identifier key for the table
 * @param {number}        rowId     Identifier for a table row
 * @param {string}        attribute Type of prop (attributes, classes)
 * @param {Object|string} value     New value for the prop
 * @return  {Object} Action object
 */
const updateRow = (tableId, rowId, attribute, value) => {
  return {
    type: UPDATE_ROW,
    tableId,
    rowId,
    attribute,
    value
  };
};

/**
 * Signal an update to a column attributes.
 *
 * @since    1.1.2
 *
 * @param {number}        tableId   Identifier key for the table
 * @param {number}        columnId  Identifier for a table column
 * @param {string}        prop      Type of property
 * @param {Object|string} value     New value for the prop
 * @return  {Object} Action object
 */
// export const updateColumnProps = (tableId, columnId, prop, value) => {
// 	return {
// 		type: UPDATE_COLUMN_PROPS,
// 		tableId,
// 		columnId,
// 		prop,
// 		value,
// 	};
// };

/**
 * Signal an update to a column attributes.
 *
 * @since    1.0.0
 *
 * @param {number}        tableId   Identifier key for the table
 * @param {number}        columnId  Identifier for a table column
 * @param {string}        attribute Type of prop (attributes, classes)
 * @param {Object|string} value     New value for the prop
 * @return  {Object} Action object
 */
const updateColumn = (tableId, columnId, attribute, value) => {
  return {
    type: UPDATE_COLUMN,
    tableId,
    columnId,
    attribute,
    value
  };
};

/**
 * Signal an update to a cell attribute/prop.
 *
 * @since    1.0.0
 *
 * @param {number}        tableId   Identifier key for the table
 * @param {string}        cellId    Identifier for a table cell
 * @param {string}        attribute Type of prop (content, attributes, classes)
 * @param {Object|string} value     New value for the prop
 * @return {Object} Action object
 */
const updateCell = (tableId, cellId, attribute, value) => {
  return {
    type: UPDATE_CELL,
    tableId,
    cellId,
    attribute,
    value
  };
};

/**
 * Signal the addition or removal of table borders.
 *
 * @since    1.0.0
 *
 * @param {Array|Object} tableId
 * @param {Array|Object} tableRows    Array of table row objects
 * @param {Array|Object} tableColumns Array of table column objects
 * @param {Array|Object} tableCells   Array of table cell objects
 * @return  {Object} Action object
 */
const updateTableBorder = (tableId, tableRows, tableColumns, tableCells) => async ({
  dispatch
}) => {
  await dispatch({
    type: PROCESS_BORDERS,
    tableId: tableId,
    rows: tableRows,
    columns: tableColumns,
    cells: tableCells
  });
};

/***/ },

/***/ "./src/data/constants.js"
/*!*******************************!*\
  !*** ./src/data/constants.js ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * The reducer key used by core data in store registration.
 * This is defined in a separate file to avoid cycle-dependency
 *
 * @since    1.0.0
 *
 * @type     {string}
 */
const STORE_NAME = 'dynamic-table-blocks/table';
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (STORE_NAME);

/***/ },

/***/ "./src/data/index.js"
/*!***************************!*\
  !*** ./src/data/index.js ***!
  \***************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   store: () => (/* binding */ store)
/* harmony export */ });
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _reducer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./reducer */ "./src/data/reducer.js");
/* harmony import */ var _selectors__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./selectors */ "./src/data/selectors.js");
/* harmony import */ var _actions__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./actions */ "./src/data/actions.js");
/* harmony import */ var _resolvers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./resolvers */ "./src/data/resolvers.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./constants */ "./src/data/constants.js");
/* External dependencies */


/* Internal dependencies */






/**
 * Create Dynamic Tables store.
 *
 * @since    1.0.0
 *
 * @type     {Object} Wordpress block store
 */
const store = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.createReduxStore)(_constants__WEBPACK_IMPORTED_MODULE_5__["default"], {
  reducer: _reducer__WEBPACK_IMPORTED_MODULE_1__["default"],
  selectors: _selectors__WEBPACK_IMPORTED_MODULE_2__,
  actions: _actions__WEBPACK_IMPORTED_MODULE_3__,
  resolvers: _resolvers__WEBPACK_IMPORTED_MODULE_4__
});
(0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.register)(store);

/***/ },

/***/ "./src/data/reducer.js"
/*!*****************************!*\
  !*** ./src/data/reducer.js ***!
  \*****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _action_types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./action-types */ "./src/data/action-types.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./src/utils.js");
/* Internal dependencies */


const {
  CREATE_TABLE,
  INSERT_COLUMN,
  INSERT_ROW,
  DELETE_TABLE,
  DELETE_COLUMN,
  DELETE_ROW,
  MOVE_COLUMN,
  MOVE_ROW,
  CHANGE_TABLE_ID,
  UPDATE_TABLE_PROP,
  REMOVE_TABLE_PROP,
  UPDATE_ROW,
  UPDATE_COLUMN,
  UPDATE_CELL,
  RECEIVE_HYDRATE,
  PROCESS_BORDERS
} = _action_types__WEBPACK_IMPORTED_MODULE_0__["default"];

/**
 * Dynamic Table reducer helper for a single table.
 *
 * @since    1.0.0
 *
 * @param {Object} state  Current table
 * @param {Object} action Action activity to be performed
 * @return {Object} Updated table
 */
const table = (state = {
  table: {}
}, action) => {
  switch (action.type) {
    case CREATE_TABLE:
      return {
        table: {
          ...action.table
        }
      };
    case CHANGE_TABLE_ID:
      const newTableIdState = {
        ...state
      };
      const rowsWithNewId_ChangeId = [];
      const columnsWithNewId_ChangeId = [];
      const cellsWithNewId_ChangeId = [];
      newTableIdState.rows.forEach(row => {
        const newRow_ChangeId = {
          ...row,
          table_id: action.newTableId
        };
        rowsWithNewId_ChangeId.push(newRow_ChangeId);
      });
      newTableIdState.columns.forEach(column => {
        const newColumn_ChangeId = {
          ...column,
          table_id: action.newTableId
        };
        columnsWithNewId_ChangeId.push(newColumn_ChangeId);
      });
      newTableIdState.cells.forEach(cell => {
        const newCell_ChangeId = {
          ...cell,
          table_id: action.newTableId
        };
        cellsWithNewId_ChangeId.push(newCell_ChangeId);
      });
      const updatedTableId = {
        ...state,
        table_id: action.newTableId,
        rows: [...rowsWithNewId_ChangeId],
        columns: [...columnsWithNewId_ChangeId],
        cells: [...cellsWithNewId_ChangeId]
      };
      return {
        table: updatedTableId
      };
    case UPDATE_TABLE_PROP:
      const updatedTable = {
        ...state,
        [action.attribute]: action.value
      };
      return {
        table: updatedTable
      };
    case REMOVE_TABLE_PROP:
      const tablePropRemoved = {
        ...state
      };
      delete tablePropRemoved[action.attribute];
      return {
        table: tablePropRemoved
      };
    case INSERT_COLUMN:
      const insertColumnState = {
        ...state
      };
      const targetInsertColumnNewId = action.direction === 'left' ? Number(action.columnId) : Number(action.columnId) + 1;

      /**
       * Insert new column and update existing column_id's
       */
      const columnsWithNewId_InsertColumn = [];
      insertColumnState.columns.forEach(column => {
        if (Number(column.column_id) < Number(targetInsertColumnNewId)) {
          columnsWithNewId_InsertColumn.push(column);
        } else {
          const newColumn_InsertColumn = {
            table_id: column.table_id,
            column_id: String(Number(column.column_id) + 1),
            column_name: column.column_name,
            attributes: column.attributes,
            classes: column.classes
          };
          columnsWithNewId_InsertColumn.push(newColumn_InsertColumn);
        }
      });
      columnsWithNewId_InsertColumn.push(action.newColumn);
      const sortedColumns_InsertColumn = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.tableSort)('columns', columnsWithNewId_InsertColumn);

      /**
       * Insert new cells and update existing column_id's
       */
      const cellsWithNewId_InsertColumn = [];
      insertColumnState.cells.forEach(cell => {
        if (Number(cell.column_id) < Number(targetInsertColumnNewId)) {
          cellsWithNewId_InsertColumn.push(cell);
        } else {
          const newColumnId_InsertColumn = String(Number(cell.column_id) + 1);
          const columnLetter_InsertColumn = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.numberToLetter)(newColumnId_InsertColumn);
          const cellContent_InsertColumn = Number(cell.row_id) == 0 ? columnLetter_InsertColumn : cell.content;
          const newCell_InsertColumn = {
            table_id: cell.table_id,
            column_id: newColumnId_InsertColumn,
            row_id: cell.row_id,
            cell_id: columnLetter_InsertColumn + cell.row_id,
            attributes: cell.attributes,
            classes: cell.classes,
            content: cellContent_InsertColumn
          };
          cellsWithNewId_InsertColumn.push(newCell_InsertColumn);
        }
      });
      const allNewColumnCells_InsertColumn = [...cellsWithNewId_InsertColumn, ...action.columnCells];
      const sortedCells_InsertColumn = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.tableSort)('cells', allNewColumnCells_InsertColumn);
      const returnedTableNewColumn_InsertColumn = {
        ...insertColumnState,
        rows: [...insertColumnState.rows],
        columns: [...sortedColumns_InsertColumn],
        cells: [...sortedCells_InsertColumn]
      };
      return {
        table: returnedTableNewColumn_InsertColumn
      };
    case INSERT_ROW:
      const insertRowState = {
        ...state
      };
      const targetInsertRowNewId = action.direction === 'above' ? Number(action.rowId) : Number(action.rowId) + 1;

      /**
       * Insert new row and update existing row_id's
       */
      const rowsWithNewId_InsertRow = [];
      insertRowState.rows.forEach(row => {
        if (Number(row.row_id) < Number(targetInsertRowNewId)) {
          rowsWithNewId_InsertRow.push(row);
        } else {
          const newRow_InsertRow = {
            table_id: row.table_id,
            row_id: String(Number(row.row_id) + 1),
            attributes: row.attributes,
            classes: row.classes
          };
          rowsWithNewId_InsertRow.push(newRow_InsertRow);
        }
      });
      rowsWithNewId_InsertRow.push(action.newRow);
      const sortedRows = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.tableSort)('rows', rowsWithNewId_InsertRow);

      /**
       * Insert new cells and update existing column_id's
       */
      const cellsWithNewId_InsertRow = [];
      insertRowState.cells.forEach(cell => {
        if (Number(cell.row_id) < Number(targetInsertRowNewId)) {
          cellsWithNewId_InsertRow.push(cell);
        } else {
          const newRowId_InsertRow = String(Number(cell.row_id) + 1);
          const columnLetter_InsertRow = cell.column_id == '0' ? '0' : (0,_utils__WEBPACK_IMPORTED_MODULE_1__.numberToLetter)(cell.column_id);
          const cellContent_InsertRow = Number(cell.column_id) == 0 ? newRowId_InsertRow : cell.content;
          const newCell_InsertRow = {
            table_id: cell.table_id,
            column_id: cell.column_id,
            row_id: newRowId_InsertRow,
            cell_id: columnLetter_InsertRow + newRowId_InsertRow,
            attributes: cell.attributes,
            classes: cell.classes,
            content: cellContent_InsertRow
          };
          cellsWithNewId_InsertRow.push(newCell_InsertRow);
        }
      });
      const allNewRowCells = [...cellsWithNewId_InsertRow, ...action.rowCells];
      const sortedCells_InsertRow = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.tableSort)('cells', allNewRowCells);
      const returnedTableNewRow_InsertRow = {
        ...insertRowState,
        rows: [...sortedRows],
        columns: [...insertRowState.columns],
        cells: [...sortedCells_InsertRow]
      };
      return {
        table: returnedTableNewRow_InsertRow
      };
    case DELETE_COLUMN:
      const deleteColumnState = {
        ...state
      };

      /**
       * Delete new column and update existing column_id's
       */
      const columnsWithNewId_DeleteColumn = [];
      deleteColumnState.columns.forEach(column => {
        if (Number(column.column_id) < Number(action.columnId)) {
          columnsWithNewId_DeleteColumn.push(column);
        } else if (Number(column.column_id) > Number(action.columnId)) {
          const newColumn_DeleteColumn = {
            table_id: column.table_id,
            column_id: String(Number(column.column_id) - 1),
            column_name: column.column_name,
            attributes: column.attributes,
            classes: column.classes
          };
          columnsWithNewId_DeleteColumn.push(newColumn_DeleteColumn);
        }
      });

      /**
       * Delete new cells and update existing column_id's
       */
      const cellsWithNewId_DeleteColumn = [];
      deleteColumnState.cells.forEach(cell => {
        if (Number(cell.column_id) < Number(action.columnId)) {
          cellsWithNewId_DeleteColumn.push(cell);
        } else if (Number(cell.column_id) > Number(action.columnId)) {
          const newColumnId_DeleteColumn = String(Number(cell.column_id) - 1);
          const columnLetter_DeleteColumn = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.numberToLetter)(newColumnId_DeleteColumn);
          const cellContent_DeleteColumn = Number(cell.row_id) == 0 ? columnLetter_DeleteColumn : cell.content;
          const newCell_DeleteColumn = {
            table_id: cell.table_id,
            column_id: newColumnId_DeleteColumn,
            row_id: cell.row_id,
            cell_id: columnLetter_DeleteColumn + cell.row_id,
            attributes: cell.attributes,
            classes: cell.classes,
            content: cellContent_DeleteColumn
          };
          cellsWithNewId_DeleteColumn.push(newCell_DeleteColumn);
        }
      });
      const returnedTableNewColumn_DeleteColumn = {
        ...deleteColumnState,
        rows: [...deleteColumnState.rows],
        columns: [...columnsWithNewId_DeleteColumn],
        cells: [...cellsWithNewId_DeleteColumn]
      };
      return {
        table: returnedTableNewColumn_DeleteColumn
      };
    case DELETE_ROW:
      const deleteRowState = {
        ...state
      };

      /**
       * Delete new column and update existing column_id's
       */
      const rowsWithNewId_DeleteRow = [];
      deleteRowState.rows.forEach(row => {
        if (Number(row.row_id) < Number(action.rowId)) {
          rowsWithNewId_DeleteRow.push(row);
        } else if (Number(row.row_id) > Number(action.rowId)) {
          const newRow_DeleteRow = {
            table_id: row.table_id,
            row_id: String(Number(row.row_id) - 1),
            attributes: row.attributes,
            classes: row.classes
          };
          rowsWithNewId_DeleteRow.push(newRow_DeleteRow);
        }
      });

      /**
       * Delete new cells and update existing row_id's
       */
      const cellsWithNewId_DeleteRow = [];
      deleteRowState.cells.forEach(cell => {
        if (Number(cell.row_id) < Number(action.rowId)) {
          cellsWithNewId_DeleteRow.push(cell);
        } else if (Number(cell.row_id) > Number(action.rowId)) {
          const newRowId_DeleteRow = String(Number(cell.row_id) - 1);
          const columnLetter_DeleteRow = cell.column_id == '0' ? '0' : (0,_utils__WEBPACK_IMPORTED_MODULE_1__.numberToLetter)(cell.column_id);
          const cellContent_DeleteRow = Number(cell.column_id) == 0 ? newRowId_DeleteRow : cell.content;
          const newCell_DeleteRow = {
            table_id: cell.table_id,
            column_id: cell.column_id,
            row_id: newRowId_DeleteRow,
            cell_id: columnLetter_DeleteRow + cell.row_id,
            attributes: cell.attributes,
            classes: cell.classes,
            content: cellContent_DeleteRow
          };
          cellsWithNewId_DeleteRow.push(newCell_DeleteRow);
        }
      });
      const returnedTableNewRow_DeleteRow = {
        ...deleteRowState,
        rows: [...rowsWithNewId_DeleteRow],
        columns: [...deleteRowState.columns],
        cells: [...cellsWithNewId_DeleteRow]
      };
      return {
        table: returnedTableNewRow_DeleteRow
      };

    /**
     * @since 1.2.2
     */
    case MOVE_COLUMN:
      const moveColumnState = {
        ...state
      };
      const targetMoveColumnNewId = action.direction === 'left' ? Number(action.columnId) - 1 : Number(action.columnId) + 1;

      // Move columns
      const movedColumns = [];
      moveColumnState.columns.map(({
        table_id,
        column_id,
        column_name,
        attributes,
        classes
      }) => {
        let newColumnId = column_id;
        if (Number(column_id) === Number(action.columnId)) newColumnId = String(targetMoveColumnNewId);
        if (Number(column_id) === targetMoveColumnNewId) newColumnId = String(action.columnId);
        return movedColumns.push({
          table_id: table_id,
          column_id: newColumnId,
          column_name: column_name,
          attributes: attributes,
          classes: classes
        });
      });
      const sortedMovedColumns = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.tableSort)('columns', movedColumns);

      // Move related column cells
      const movedColumnCells = [];
      moveColumnState.cells.map(({
        table_id,
        column_id,
        row_id,
        attributes,
        classes,
        content
      }) => {
        let newColumnId = column_id;
        let borderContent = content;
        if (Number(column_id) === Number(action.columnId)) newColumnId = String(targetMoveColumnNewId);
        if (Number(column_id) === targetMoveColumnNewId) newColumnId = String(action.columnId);
        if (row_id === '0') borderContent = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.numberToLetter)(newColumnId);
        const columnLetter = newColumnId == '0' ? '0' : (0,_utils__WEBPACK_IMPORTED_MODULE_1__.numberToLetter)(newColumnId);
        return movedColumnCells.push({
          table_id: table_id,
          row_id: row_id,
          cell_id: columnLetter + String(row_id),
          column_id: newColumnId,
          attributes: attributes,
          classes: classes,
          content: borderContent
        });
      });
      const sortedMovedColumnCells = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.tableSort)('cells', movedColumnCells);
      const returnedTableMovedColumns = {
        ...moveColumnState,
        rows: [...moveColumnState.rows],
        columns: [...sortedMovedColumns],
        cells: [...sortedMovedColumnCells]
      };
      return {
        table: returnedTableMovedColumns
      };

    /**
     * @since 1.2.2
     */
    case MOVE_ROW:
      const moveRowState = {
        ...state
      };
      const targetMoveRowNewId = action.direction === 'up' ? Number(action.rowId) - 1 : Number(action.rowId) + 1;

      // Move rows
      const movedRows = [];
      moveRowState.rows.map(({
        table_id,
        row_id,
        attributes,
        classes
      }) => {
        let newRowId = row_id;
        if (Number(row_id) === Number(action.rowId)) newRowId = String(targetMoveRowNewId);
        if (Number(row_id) === targetMoveRowNewId) newRowId = String(action.rowId);
        return movedRows.push({
          table_id: table_id,
          row_id: newRowId,
          attributes: attributes,
          classes: classes
        });
      });
      const sortedMovedRows = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.tableSort)('rows', movedRows);

      // Move related row cells
      const movedRowCells = [];
      moveRowState.cells.map(({
        table_id,
        column_id,
        row_id,
        attributes,
        classes,
        content
      }) => {
        let newRowId = row_id;
        let borderContent = content;
        if (Number(row_id) === Number(action.rowId)) newRowId = String(targetMoveRowNewId);
        if (Number(row_id) === targetMoveRowNewId) newRowId = String(action.rowId);
        if (column_id === '0') borderContent = String(newRowId);
        const columnLetter = column_id == '0' ? '0' : (0,_utils__WEBPACK_IMPORTED_MODULE_1__.numberToLetter)(column_id);
        return movedRowCells.push({
          table_id: table_id,
          row_id: newRowId,
          cell_id: columnLetter + String(newRowId),
          column_id: column_id,
          attributes: attributes,
          classes: classes,
          content: borderContent
        });
      });
      const sortedMovedRowCells = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.tableSort)('cells', movedRowCells);
      const returnedTableMovedRows = {
        ...moveRowState,
        rows: [...sortedMovedRows],
        columns: [...moveRowState.columns],
        cells: [...sortedMovedRowCells]
      };
      return {
        table: returnedTableMovedRows
      };
    case UPDATE_ROW:
      let transformedValue_UpdateRow = ' "' + action.value + '"';
      if (action.attribute === 'attributes') {
        transformedValue_UpdateRow = JSON.stringify(action.value);
      }
      const newRowsState = {
        ...state
      };
      const updatedRowData = JSON.parse('{ "' + action.attribute + '" :' + transformedValue_UpdateRow + '}');
      const updatedRows = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.updateArray)(newRowsState.rows, 'row_id', action.rowId, updatedRowData);
      const returnedUpdatedTableRow = {
        ...newRowsState,
        rows: [...updatedRows],
        columns: [...newRowsState.columns],
        cells: [...newRowsState.cells]
      };
      return {
        table: returnedUpdatedTableRow
      };
    case UPDATE_COLUMN:
      let transformedValue_UpdateColumn = ' "' + action.value + '"';
      if (action.attribute === 'attributes') {
        transformedValue_UpdateColumn = JSON.stringify(action.value);
      }
      const newColumnsState = {
        ...state
      };
      const updatedColumnData = JSON.parse('{ "' + action.attribute + '" :' + transformedValue_UpdateColumn + '}');
      const updatedColumns = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.updateArray)(newColumnsState.columns, 'column_id', action.columnId, updatedColumnData);
      const returnedUpdatedTableColumn = {
        ...newColumnsState,
        rows: [...newColumnsState.rows],
        columns: [...updatedColumns],
        cells: [...newColumnsState.cells]
      };
      return {
        table: returnedUpdatedTableColumn
      };
    case UPDATE_CELL:
      let transformedValue_UpdateCell = ' "' + action.value + '"';
      if (action.attribute === 'attributes') {
        transformedValue_UpdateCell = JSON.stringify(action.value);
      }
      const newCellsState = {
        ...state
      };
      const updatedCellData = JSON.parse('{ "' + action.attribute + '" :' + transformedValue_UpdateCell + '}');
      const updatedCells = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.updateArray)(newCellsState.cells, 'cell_id', action.cellId, updatedCellData);
      const returnedCellState = {
        ...state,
        rows: [...newCellsState.rows],
        columns: [...newCellsState.columns],
        cells: [...updatedCells]
      };
      return {
        table: returnedCellState
      };
    case PROCESS_BORDERS:
      const newBaseTableState = {
        ...state
      };
      const returnedBorderState = {
        ...newBaseTableState,
        rows: (0,_utils__WEBPACK_IMPORTED_MODULE_1__.tableSort)('rows', [...action.rows]),
        columns: (0,_utils__WEBPACK_IMPORTED_MODULE_1__.tableSort)('columns', [...action.columns]),
        cells: (0,_utils__WEBPACK_IMPORTED_MODULE_1__.tableSort)('cells', [...action.cells])
      };
      return {
        table: returnedBorderState
      };
    case RECEIVE_HYDRATE:
      return {
        table: {
          ...state.table,
          ...action.table
        }
      };
    default:
      return state;
  }
};

/**
 * Main Dynamic Tables reducer for all tables in block.
 *
 * @since    1.0.0
 *
 * @param {Object} state  Current table state
 * @param {Object} action Dispatched option
 * @return  {Object} Updated state
 */
const reducer = (state = {
  tables: {}
}, action) => {
  const tableKey = action.tableId;
  const newTableState = table(state.tables[tableKey], action);
  if (JSON.stringify(newTableState.table) === '{}') {
    return state;
  }
  const newTablesState = {
    ...state.tables
  };
  switch (action.type) {
    case CHANGE_TABLE_ID:
      const returnedTableNewId = {
        [action.newTableId]: newTableState.table
      };
      const filteredTablesState = Object.keys(state.tables).reduce((acc, key) => {
        if (state.tables[key].table_id !== action.tableId) {
          acc[key] = {
            ...state.tables[key]
          };
        }
        return acc;
      }, {});
      return {
        tables: {
          ...filteredTablesState,
          ...returnedTableNewId
        }
      };
    case DELETE_TABLE:
      const deleteTablesState = Object.keys(state.tables).reduce((acc, key) => {
        if (key !== String(action.tableId)) {
          acc[key] = {
            ...state.tables[key],
            rows: [...state.tables[key].rows],
            columns: [...state.tables[key].columns],
            cells: [...state.tables[key].cells]
          };
        }
        return acc;
      }, {});
      return {
        tables: {
          ...deleteTablesState
        }
      };
    default:
      const returnedTableDefault = {
        [action.tableId]: newTableState.table
      };
      return {
        tables: {
          ...newTablesState,
          ...returnedTableDefault
        }
      };
  }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (reducer);

/***/ },

/***/ "./src/data/resolvers.js"
/*!*******************************!*\
  !*** ./src/data/resolvers.js ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getTable: () => (/* binding */ getTable)
/* harmony export */ });
/* harmony import */ var _wordpress_core_data__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/core-data */ "@wordpress/core-data");
/* harmony import */ var _wordpress_core_data__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_core_data__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./src/utils.js");
/* External dependencies */



/**
 * Requests a table's record from the REST API.
 *
 * @since    1.0.0
 *
 * @param {number}  tableId      Identifier key for the table
 * @param {boolean} isTableStale Whether the current state is stale
 */
const getTable = (tableId, isTableStale) => async ({
  dispatch,
  registry
}) => {
  if (!isTableStale || tableId == '0') {
    return;
  }
  try {
    const tableEntity = await registry.resolveSelect(_wordpress_core_data__WEBPACK_IMPORTED_MODULE_0__.store).getEntityRecord('dynamic-table-blocks', 'table', tableId);
    const table = tableEntity;
    const table_id = table.id;
    const block_table_ref = table.header.block_table_ref;
    const table_status = table.header.status;
    const post_id = table.header.post_id;
    const table_name = table.header.table_name;
    const attributes = table.header.attributes;
    const classes = table.header.classes;
    const rows = table.rows;
    const columns = table.columns;
    (0,_utils__WEBPACK_IMPORTED_MODULE_1__.computeCellIds)(table.cells);
    const cells = table.cells;
    dispatch.receiveTable(table_id, block_table_ref, table_status, post_id, table_name, attributes, classes, rows, columns, cells);
  } catch (error) {
    console.log('Error in getTable - Table ID = ' + tableId);
    alert('            ...Resolver - async error - ' + JSON.stringify(error, null, 4));
  }
};

/***/ },

/***/ "./src/data/selectors.js"
/*!*******************************!*\
  !*** ./src/data/selectors.js ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDeletedTables: () => (/* binding */ getDeletedTables),
/* harmony export */   getTable: () => (/* binding */ getTable),
/* harmony export */   getTableIdByBlock: () => (/* binding */ getTableIdByBlock),
/* harmony export */   getTables: () => (/* binding */ getTables),
/* harmony export */   getUnmountedTables: () => (/* binding */ getUnmountedTables),
/* harmony export */   getUnsavedTables: () => (/* binding */ getUnsavedTables)
/* harmony export */ });
/**
 * Retrieve the current state of a single table by table id.  If stale, refresh
 * the table from the REST api.
 *
 * @since    1.0.0
 *
 * @param {Object}  state        Current state of tables
 * @param {number}  tableId      Identifier key for the table
 * @param {boolean} isTableStale Should fresh data be fetch from API?
 * @return {Object} Requested Table
 */
function getTable(state, tableId, isTableStale) {
  if (!state.tables.hasOwnProperty(tableId)) {
    return {
      table_id: tableId,
      block_table_ref: '',
      post_id: '',
      table_status: '',
      table_name: '',
      attributes: [],
      classes: '',
      rows: [],
      columns: [],
      cells: []
    };
  }
  return state.tables[tableId];
}

/**
 * Retrieve the current state of a all tables (table blocks) in the post.
 *
 * @since    1.0.0
 *
 * @param {Object} state Current state of tables
 * @return {Object} All tables
 */
function getTables(state) {
  return state.tables;
}

/**
 * Retrieve the current state of a single table by the block's cross reference key.
 *
 * @since    1.0.0
 *
 * @param {Object} state           Current state of tables
 * @param {string} block_table_ref Cross refernece from block to identify table
 * @return {number} Table id of requested table
 */
function getTableIdByBlock(state, block_table_ref) {
  const newTable = Object.keys(state.tables).reduce((acc, key) => {
    if (state.tables[key]?.block_table_ref === block_table_ref && state.tables[key].table_status !== 'pending-entity') {
      acc[key] = {
        ...state.tables[key]
      };
    }
    return acc;
  }, {});
  if (newTable.length === 0) {
    return false;
  }
  return Object.keys(newTable);
}

/**
 * Return all tables that are associated with unmounted blocks
 *
 * @param {Object} state Current state of tables
 * @return {Object} unmountedTables
 */
/**
 * Get all tables associated with unmounted blocks.
 *
 * @since    1.0.0
 *
 * @param {Object} state Current state of tables
 * @return {Object} Unmounted tables
 */
function getUnmountedTables(state) {
  const unmountedTables = Object.keys(state.tables).reduce((acc, key) => {
    if (state.tables[key].unmounted_block) {
      acc[key] = {
        ...state.tables[key]
      };
    }
    return acc;
  }, {});
  return unmountedTables;
}

/**
 * Get all tables with a status of 'deleted'.
 *
 * @since    1.0.0
 *
 * @param {Object} state Current state of tables
 * @return {Object} Deleted tables
 */
function getDeletedTables(state) {
  const deletedTables = Object.keys(state.tables).reduce((acc, key) => {
    if (state.tables[key].table_status === 'deleted') {
      acc[key] = {
        ...state.tables[key]
      };
    }
    return acc;
  }, {});
  return deletedTables;
}

/**
 * Get all tables with a status of 'new'.  There should theoretically only be one
 * at any time.
 *
 * @since    1.0.0
 *
 * @param {Object} state Current state of tables
 * @return {Object} New tables
 */
function getUnsavedTables(state) {
  const newTables = Object.keys(state.tables).reduce((acc, key) => {
    if (state.tables[key].table_status === 'new') {
      acc[key] = {
        ...state.tables[key]
      };
    }
    return acc;
  }, {});
  return newTables;
}

/***/ },

/***/ "./src/edit.js"
/*!*********************!*\
  !*** ./src/edit.js ***!
  \*********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Edit)
/* harmony export */ });
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_editor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/editor */ "@wordpress/editor");
/* harmony import */ var _wordpress_editor__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_editor__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_notices__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/notices */ "@wordpress/notices");
/* harmony import */ var _wordpress_notices__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_notices__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _wordpress_rich_text__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @wordpress/rich-text */ "@wordpress/rich-text");
/* harmony import */ var _wordpress_rich_text__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_wordpress_rich_text__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/block-table.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/search.mjs");
/* harmony import */ var clsx__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! clsx */ "./node_modules/clsx/dist/clsx.mjs");
/* harmony import */ var _data__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./data */ "./src/data/index.js");
/* harmony import */ var _hooks__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./hooks */ "./src/hooks.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./utils */ "./src/utils.js");
/* harmony import */ var _table_defaults__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./table-defaults */ "./src/table-defaults.js");
/* harmony import */ var _style__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./style */ "./src/style.js");
/* harmony import */ var _components__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./components */ "./src/components/index.js");
/* harmony import */ var _editor_scss__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./editor.scss */ "./src/editor.scss");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__);
/* External dependencies */











/* Internal dependencies */








/* Create Dynamic Tables entity in WordPress core-data */

(0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.dispatch)('core').addEntities([{
  name: 'table',
  kind: 'dynamic-table-blocks',
  baseURL: '/dynamic-table-blocks/v1/tables',
  baseURLParams: {
    context: 'edit'
  },
  plural: 'tables',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Table'),
  getTitle: record => record?.title || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Unnamed Table')
}]);

/**
 * Exports main logic for Dynamic Tables block.
 *
 * @since    1.0.0
 *
 * @param {Object} props
 */
function Edit(props) {
  const blockProps = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_6__.useBlockProps)({
    className: 'dynamic-table-edit-block'
  });
  /* Esternal Store Action useDispatch declarations */
  const {
    lockPostSaving,
    unlockPostSaving,
    lockPostAutosaving,
    unlockPostAutosaving
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_wordpress_editor__WEBPACK_IMPORTED_MODULE_2__.store);
  const SAVE_LOCK_KEY = 'dtbk-save-lock';

  /* Table Store Action useDispatch declarations */
  const {
    receiveNewTable
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    cloneTable
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    createTableEntity
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    saveTableEntity
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    addColumn
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    addRow
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    removeColumn
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    removeRow
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    moveColumn
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    moveRow
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    updateTableProp
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    updateRow
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    updateColumn
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    updateCell
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    updateTableEntity
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    updateTableBorder
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    processUnmountedTables
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    processDeletedTables
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_data__WEBPACK_IMPORTED_MODULE_11__.store);
  const {
    createNotice,
    removeNotice
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_wordpress_notices__WEBPACK_IMPORTED_MODULE_3__.store);

  /* Local State declarations */
  const [isTableStale, setTableStale] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(true);
  const [showBorders, setShowBorders] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
  const [tableName, setTableName] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)('');
  const [numColumns, setNumColumns] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(1);
  const [numRows, setNumRows] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(1);
  const [awaitingTableEntityCreation, setAwaitingTableEntityCreation] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
  const [editingCellId, setEditingCellId] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(null);

  // ToDo: Move to Utils
  const htmlToText = (html = '') => (0,_wordpress_rich_text__WEBPACK_IMPORTED_MODULE_7__.getTextContent)((0,_wordpress_rich_text__WEBPACK_IMPORTED_MODULE_7__.create)({
    html
  })).replace(/\s+/g, ' ').trim();

  // Location of border cell last clicked
  const lastInvokerElRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);

  /**
   * Support column border drop down menu and settings
   * dialog boxes
   */
  const [rowMenu, setRowMenu] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)({
    isOpen: false,
    anchorEl: null,
    rowId: null,
    rowLabel: '',
    rowAttributes: null
  });
  const openRowMenu = (e, rowId, rowLabel, rowAttributes) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    // Capture a real element, not the synthetic event
    const el = e?.currentTarget || null;
    lastInvokerElRef.current = el;
    setRowMenu({
      isOpen: true,
      anchorEl: el,
      rowId,
      rowLabel,
      rowAttributes
    });
  };
  const closeRowMenu = () => {
    setRowMenu(prev => ({
      ...prev,
      isOpen: false,
      anchorEl: null
    }));

    // restore focus to the invoker (menu trigger)
    window.requestAnimationFrame(() => lastInvokerElRef.current?.focus?.());
  };
  const [rowHeightModal, setRowHeightModal] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)({
    isOpen: false,
    rowId: null,
    rowLabel: '',
    rowAttributes: null
  });

  /**
   * Open row height configuration dialog page.
   *
   * Description: Responds to clicked row menu item to update the row height configuration.
   *
   * @since    1.2.0
   *
   * @param {Object} e             row menu click event
   * @param {number} rowId         Row number to update
   * @param {string} rowLabel      Display label at top of dialog
   * @param {Object} rowAttributes Row attributes that control row height, among other things
   */
  const openRowHeightModal = (e, rowId, rowLabel, rowAttributes) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    // Capture a real element, not the synthetic event
    const el = e?.currentTarget || null;
    lastInvokerElRef.current = el;
    setRowHeightModal({
      isOpen: true,
      // anchorEl: el,
      rowId,
      rowLabel,
      rowAttributes
    });
  };

  /**
   * Close row height configuration dialog page.
   *
   * @since    1.2.0
   */
  const closeRowHeightModal = () => {
    setRowHeightModal(prev => ({
      ...prev,
      isOpen: false
    }));

    // restore focus to the invoker (menu trigger)
    window.requestAnimationFrame(() => lastInvokerElRef.current?.focus?.());
  };

  /**
   * Support column border drop down menu and settings
   * dialog boxes
   */
  const [columnMenu, setColumnMenu] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)({
    isOpen: false,
    anchorEl: null,
    columnId: null,
    columnLabel: '',
    columnAttributes: null
  });
  const openColumnMenu = (e, columnId, columnLabel, columnAttributes) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    // Capture a real element, not the synthetic event
    const el = e?.currentTarget || null;
    lastInvokerElRef.current = el;
    setColumnMenu({
      isOpen: true,
      anchorEl: el,
      columnId,
      columnLabel,
      columnAttributes
    });
  };
  const closeColumnMenu = () => {
    setColumnMenu(prev => ({
      ...prev,
      isOpen: false,
      anchorEl: null
    }));

    // restore focus to the invoker (menu trigger)
    window.requestAnimationFrame(() => lastInvokerElRef.current?.focus?.());
  };
  const [columnWidthModal, setColumnWidthModal] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)({
    isOpen: false,
    columnId: null,
    columnLabel: '',
    columnAttributes: null
  });
  const [columnDataTypeModal, setColumnDataTypeModal] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)({
    isOpen: false,
    columnId: null,
    columnLabel: '',
    columnAttributes: null,
    columnClasses: ''
  });

  /**
   * Open column data type configuration dialog page.
   *
   * Description: Responds to clicked column menu item to update the column height configuration.
   *
   * @since    1.2.0
   *
   * @param {Object} e                Column menu click event
   * @param {number} columnId         Column number to update
   * @param {string} columnLabel      Display label at top of dialog
   * @param {Object} columnAttributes Column attributes that control column height, among other things
   * @param {Object} columnClasses    Column classes to apply column specific styling
   */
  const openColumnDataTypeModal = (e, columnId, columnLabel, columnAttributes, columnClasses) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    // Capture a real element, not the synthetic event
    const el = e?.currentTarget || null;
    lastInvokerElRef.current = el;
    setColumnDataTypeModal({
      isOpen: true,
      columnId,
      columnLabel: columnLabel,
      columnAttributes,
      columnClasses
    });
  };

  /**
   * Close column data type configuration dialog page.
   *
   * @since    1.2.0
   */
  const closeColumnDataTypeModal = () => {
    setColumnDataTypeModal(prev => ({
      ...prev,
      isOpen: false
    }));

    // restore focus to the invoker (menu trigger)
    window.requestAnimationFrame(() => lastInvokerElRef.current?.focus?.());
  };

  /**
   * Open column width configuration dialog page.
   *
   * Description: Responds to clicked column menu item to update the column height configuration.
   *
   * @since    1.2.0
   *
   * @param {Object} e                Column menu click event
   * @param {number} columnId         Column number to update
   * @param {string} columnLabel      Display label at top of dialog
   * @param {Object} columnAttributes Column attributes that control column height, among other things
   */
  const openColumnWidthModal = (e, columnId, columnLabel, columnAttributes) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    // Capture a real element, not the synthetic event
    const el = e?.currentTarget || null;
    lastInvokerElRef.current = el;
    setColumnWidthModal({
      isOpen: true,
      columnId,
      columnLabel: columnLabel,
      columnAttributes
    });
  };

  /**
   * Close column width configuration dialog page.
   *
   * @since    1.2.0
   */
  const closeColumnWidthModal = () => {
    setColumnWidthModal(prev => ({
      ...prev,
      isOpen: false
    }));

    // restore focus to the invoker (menu trigger)
    window.requestAnimationFrame(() => lastInvokerElRef.current?.focus?.());
  };

  // Support table creation and cloning
  const cloneLatchRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useRef)(new Set());

  // Support keyboard navigation in table
  const [focusedCell, setFocusedCell] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)({
    col: 0,
    row: 0
  });
  const gridRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);

  /* Current future features: Zoom to details */
  const enableFutureFeatures = false;
  const enableProFeatures = false;
  const {
    table_id,
    block_table_ref,
    original_post_type,
    original_post_id,
    block_alignment
  } = props.attributes;
  const themeColors = (0,_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_6__.useSettings)('color.palette');
  const borderBoxColors = themeColors[0].map(({
    color,
    name
  }) => {
    return {
      color,
      name
    };
  });

  /**
   * Get Current Table Id.
   *
   * @type     {*}
   * @since    1.0.0
   *
   * @return Table Id
   */

  /**
   * Identify current table id by its block table reference
   *
   * @since 1.1.0
   *
   * @type  {number} Object of all table id's that are currently unmounted
   */
  const {
    currentTableId
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useSelect)(select => {
    const {
      getTableIdByBlock
    } = select(_data__WEBPACK_IMPORTED_MODULE_11__.store);
    const currentTableId = getTableIdByBlock(block_table_ref);
    return {
      currentTableId: currentTableId
    };
  });

  /**
   * Set Table ID for newly created tables
   *
   * @since    1.0.0
   *
   * @return {boolean} Was Table Changed?
   */
  const setTableIdChanged = () => {
    if (awaitingTableEntityCreation && Number(currentTableId) !== Number(table_id)) {
      return true;
    }
    return false;
  };
  const isTableIdChanged = setTableIdChanged();

  /**
   * Lookup table attribute value.
   *
   * @since    1.0.0
   *
   * @param {Array}  tableAttributes
   * @param {string} attributeName
   * @return {*} Attribute value
   */
  function getTablePropAttribute(tableAttributes, attributeName) {
    const attributeValue = tableAttributes?.[attributeName];
    return attributeValue;
  }

  /**
   * Identify unmounted tables
   *
   * Table blocks are unmounted when entering the code editor AND when deleted.  However,
   * we don't know whether the table was deleted when an unmount is detected.  Therefore,
   * we mark them as unmounted at that time, and can identify whether the block was
   * truly deleted on the subsequent render.
   *
   * We mark tables as deleted if they do not identify that the block has been remounted
   *
   * @since 1.0.0
   *
   * @type  {Object} Object of all table id's that are currently unmounted
   */
  const {
    unmountedTables
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useSelect)(select => {
    const {
      getUnmountedTables
    } = select(_data__WEBPACK_IMPORTED_MODULE_11__.store);
    return {
      unmountedTables: getUnmountedTables()
    };
  });
  if (Object.keys(unmountedTables).length > 0) {
    processUnmountedTables(unmountedTables);
  }

  /**
   * Retrive table id's of all tables in a status of deleted.
   *
   * @since  1.0.0
   *
   * @type   {Object} Object of all table id's for tables with a 'deleted' status
   */
  const {
    deletedTables
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useSelect)(select => {
    const {
      getDeletedTables
    } = select(_data__WEBPACK_IMPORTED_MODULE_11__.store);
    return {
      deletedTables: getDeletedTables()
    };
  });

  /**
   * Identifies when the post which was being saved has completed the
   * save.
   *
   * @since    1.0.0
   *
   * @type     {boolean} Post changes have been saved
   */
  const postChangesAreSaved = (0,_hooks__WEBPACK_IMPORTED_MODULE_12__.usePostChangesSaved)();

  /**
   * Fires when posts have just finished saving and when a change is detected in
   * unmounted tables.
   */
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
    if (postChangesAreSaved) {
      /**
       * Remove deleted tables from persisted store
       */
      if (Object.keys(deletedTables).length > 0) {
        processDeletedTables(deletedTables);
      }

      /**
       * Tables are persisted when they are created, but should only remain
       * if the underlying post is saved.  Here we update the status of new
       * tables from "new" to "saved" once the post is saved.
       */
      if (table.table_status == 'new') {
        setTableAttributes(table.table_id, 'table_status', '', 'PROP', 'saved');
        saveTableEntity(table.table_id);
      }
    }
  }, [postChangesAreSaved, unmountedTables]);

  /**
   * Set Block Table Status
   *
   * @since    1.0.0
   *
   * @return  {("None" | "New" | "Stale" | "Saved")}  Table Status
   */
  const setBlockTableStatus = () => {
    if (block_table_ref === '') {
      return 'None';
    }
    if (table_id === '0') {
      return 'New';
    }
    if (isTableStale) {
      return 'Stale';
    }
    return 'Saved';
  };

  /**
   * Summary. (use period). <break> Description. (use period).
   *
   * @since    1.0.0
   *
   * @return  {boolean} Is this a new dybamic table block?
   */
  const setNewBlock = () => {
    if (block_table_ref === '') {
      return true;
    }
    return false;
  };

  /**
   * Set lock for saving.
   *
   * @since    1.0.0
   */
  const setSaveLock = () => {
    lockPostSaving(SAVE_LOCK_KEY);
    lockPostAutosaving(SAVE_LOCK_KEY);
  };

  /**
   * Remove lock for saving.
   *
   * @since    1.0.0
   */
  const setClearSaveLock = () => {
    unlockPostSaving(SAVE_LOCK_KEY);
    unlockPostAutosaving(SAVE_LOCK_KEY);
  };
  const isNewBlock = setNewBlock();
  const blockTableStatus = setBlockTableStatus();
  const {
    postId,
    postType
  } = (0,_hooks__WEBPACK_IMPORTED_MODULE_12__.useEditorIdentity)(props);
  const inInserterBlock = !(0,_hooks__WEBPACK_IMPORTED_MODULE_12__.useNotInInserterPreview)();

  /**
   * Prepare for New Block
   */
  if (isNewBlock) {
    setSaveLock();
  }

  /**
   * Retrieve table entity from table webservice and load table store.
   *
   * @since    1.0.0
   */
  const {
    table,
    tableStatus,
    tableHasStartedResolving,
    tableHasFinishedResolving,
    tableIsResolving
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useSelect)(select => {
    const {
      getTable,
      getTableIdByBlock,
      hasStartedResolution,
      hasFinishedResolution,
      isResolving
    } = select(_data__WEBPACK_IMPORTED_MODULE_11__.store);
    const selectorArgs = [table_id, isTableStale];
    if (block_table_ref === '') {
      return {
        table: {},
        tableStatus: '',
        tableHasStartedResolving: false,
        tableHasFinishedResolving: false,
        tableIsResolving: false
      };
    }
    const getBlockTable = (table_id, isTableStale, block_table_ref) => {
      let selectedTable = getTable(table_id, isTableStale);
      if ((selectedTable.block_table_ref === '' || selectedTable.block_table_ref !== block_table_ref && Number(getTableIdByBlock(block_table_ref)) > 0) && awaitingTableEntityCreation) {
        const newTableId = getTableIdByBlock(block_table_ref);
        selectedTable = getTable(newTableId, isTableStale);

        // Must sync post_id here for new table because "resolving" attributes are not available
        if (String(postId) !== selectedTable.post_id && String(postId) !== '0') {
          setTableAttributes(selectedTable.table_id, 'post_id', '', 'PROP', String(postId));
        }
        setAwaitingTableEntityCreation(false);
        setClearSaveLock();
        props.setAttributes({
          original_post_type: postType
        });
        props.setAttributes({
          original_post_id: Number(postId)
        });
        props.setAttributes({
          table_id: Number(selectedTable.table_id)
        });
      }
      return selectedTable;
    };
    const blockTable = getBlockTable(table_id, isTableStale, block_table_ref);
    const tableHasStartedResolving = hasStartedResolution('getTable', selectorArgs);
    const tableHasFinishedResolving = hasFinishedResolution('getTable', selectorArgs);
    const tableIsResolving = isResolving('getTable', selectorArgs);
    if (tableHasFinishedResolving) {
      setTableStale(() => false);
    }
    return {
      table: blockTable,
      tableStatus: blockTable.table_status,
      tableHasStartedResolving: tableHasStartedResolving,
      tableHasFinishedResolving: tableHasFinishedResolving,
      tableIsResolving: tableIsResolving
    };
  }, [table_id, isTableIdChanged, isTableStale, block_table_ref, awaitingTableEntityCreation]);

  /**
   * Determine if table has been loaded.
   *
   * @since    1.1.0
   *
   * @return {boolean}  Table loaded?
   */
  const setTableLoaded = () => {
    if (!!table.block_table_ref && blockTableStatus !== 'None') return true;
    return false;
  };
  const tableLoaded = setTableLoaded();

  /**
   * Create a latch key before clone to identify the specific block being cloned. The block
   * will not be cloned if it is currently locked for cloning.
   *
   * @since    1.1.0
   *
   * @param {string} clientId - Current Block Identifier to be cloned
   * @param {string} postId   - Current post id of post in which the block appears
   * @param {string} tableId  - Current table id of table in block
   * @return {boolean} lock - Is the table currently being cloned
   */
  function acquireCloneLatch({
    clientId,
    postId,
    tableId
  }) {
    const key = [clientId || 'no-client', postId || 0, tableId || 0].join(':');

    // If we already cloned for this key, deny.
    if (cloneLatchRef.current.has(key)) {
      return {
        locked: true
      };
    }

    // Otherwise lock it now.
    cloneLatchRef.current.add(key);
    return {
      locked: false
    };
  }

  /**
   * Determine Dynamic Tables block originated from a non-sync pattern, and if so,
   * clone the block and its related table
   *
   * @since    1.1.0
   *
   * @param {boolean} tableLoaded
   * @param {Object}  table
   * @param {string}  postId
   * @param {boolean} inInserterBlock
   */
  function checkDuplicateTable(tableLoaded, table, postId, inInserterBlock) {
    const patternName = props.attributes?.metadata?.patternName;
    const isBlockFromPattern = !!patternName;

    // Exit if table is not loaded
    if (!tableLoaded) {
      return false;
    }

    // Exit if table is being created manually
    if (isNewBlock) {
      return false;
    }

    // Inserted post type is not a pattern
    if (original_post_type !== 'wp_block') {
      return false;
    }

    // Inserted Patterns have meta and pattern meta does not load in preview inserter
    if (!isBlockFromPattern) {
      return false;
    }
    if (Number(original_post_id) === Number(postId) && Number(table.post_id) > 0) {
      return false;
    }
    if (inInserterBlock) {
      return false;
    }
    if (Number(table.post_id) === Number(postId)) {
      return false;
    }
    const {
      locked
    } = acquireCloneLatch({
      clientId: props.clientId,
      postId,
      tableId: table.table_id
    });
    if (locked) {
      return false;
    }

    // Verified that this is a clone operation.  Proceed with clone.
    setSaveLock();
    setTableStale(false);
    const cloneBlockTableRef = (0,_utils__WEBPACK_IMPORTED_MODULE_13__.generateBlockTableRef)();
    props.setAttributes({
      block_table_ref: cloneBlockTableRef
    });
    cloneTable(table.table_id, postId, cloneBlockTableRef);
    setAwaitingTableEntityCreation(true);
    return true;
  }

  // Set block original post type if not populated
  if (original_post_type === '') {
    props.setAttributes({
      original_post_type: postType
    });
  }

  // Set block original post id if not populated
  if (Number(original_post_id) === 0) {
    props.setAttributes({
      original_post_id: postId
    });
  }
  const newClonedTableId = checkDuplicateTable(tableLoaded, table, postId, inInserterBlock);

  /**
   * Synchronize PostId
   *
   * Post ID is assigned a value of '0' upon table creation and can change over the life of a post.
   * props.context is authoritative for Post ID so we ensure the table is sync'd to that.
   *
   * @since    1.0.0
   */
  if (tableHasStartedResolving && tableHasFinishedResolving && !awaitingTableEntityCreation && Number(props.context.postId) !== 0 && Number(table.post_id) === 0) {
    setTableAttributes(table.table_id, 'post_id', '', 'PROP', String(props.context.postId));
    saveTableEntity(table.table_id);
  }

  /**
   * Perform clean-up when the block unmounts so that we can reattach it based on the block's
   * client ID.  We can also determine if the block was deleted if the client no longer exists
   * when the block is re-mounted.
   *
   * This all occurs immediately prior to unmounting the block.
   */
  const currentStatus = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useRef)(tableStatus);
  currentStatus.current = tableStatus;
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
    return () => {
      // Process table clean-up only if table was loaded
      if (tableLoaded && !isNewBlock && Number(table.table_id) > 0) {
        if (inInserterBlock || original_post_type === 'wp_block') {
          // Set table's prior status to the current status before unmounting
          setTableAttributes(table.table_id, 'isPattern', '', 'PROP', true);
        } else {
          // Set table's prior status to the current status before unmounting
          setTableAttributes(table.table_id, 'prior_status', '', 'PROP', currentStatus.current);

          // Set the table's block identifier so that we can reattach it on remount and update
          // its status to unknown to signify that we won't know what is happening during the
          // time the block is unmounted
          setTableAttributes(table.table_id, 'unmounted_block', '', 'PROP', true);

          // Persist the table with its "unknown" status
          saveTableEntity(table.table_id);
        }
      }
    };
  }, [tableLoaded, inInserterBlock, isNewBlock, original_post_type]);
  const tableColumnLength = JSON.stringify(table.table) === '{}' || blockTableStatus == 'None' ? 0 : table.columns.length;
  const tableRowLength = JSON.stringify(table.table) === '{}' || blockTableStatus == 'None' ? 0 : table.rows.length;

  /**
   * Set the initial focus cell when the dynamic table receives focus
   *
   * @since    1.1.1
   */
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
    // Only initial focus when table is loaded and nothing focused yet
    if (!gridRef.current) return;

    // If editor already focused something inside, don't steal focus
    if (gridRef.current.contains(document.activeElement)) return;
    focusCell(1, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableLoaded]);

  /**
   * Set state for number of columns and rows when the number of table rows has changes
   *
   * TODO: Verify this is still needed following update to table store to track all tables in editor
   */
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
    if (!isNewBlock) {
      if (tableColumnLength != numColumns) {
        setNumColumns(tableColumnLength);
      }
      if (tableRowLength != numRows) {
        setNumRows(tableRowLength);
      }
    }
  }, [tableColumnLength, tableRowLength]);

  /**
   * Extract and unpack table attributes
   */
  const showGridLines = getTablePropAttribute(table.attributes, 'showGridLines');
  const allowHorizontalScroll = getTablePropAttribute(table.attributes, 'allowHorizontalScroll');
  const enableHeaderRow = getTablePropAttribute(table.attributes, 'enableHeaderRow');
  const headerAlignment = getTablePropAttribute(table.attributes, 'headerAlignment');
  const gridHeaderBackgroundColor = getTablePropAttribute(table.attributes, 'tableHeaderBackgroundColor');
  const headerRowSticky = getTablePropAttribute(table.attributes, 'headerRowSticky');
  const headerBorder = getTablePropAttribute(table.attributes, 'headerBorder');
  const bodyAlignment = getTablePropAttribute(table.attributes, 'bodyAlignment');
  const bodyBorder = getTablePropAttribute(table.attributes, 'bodyBorder');
  const bandedRows = getTablePropAttribute(table.attributes, 'bandedRows');
  const bandedTextColor = getTablePropAttribute(table.attributes, 'bandedTextColor');
  const bandedRowBackgroundColor = getTablePropAttribute(table.attributes, 'bandedRowBackgroundColor');
  const gridLineWidth = getTablePropAttribute(table.attributes, 'gridLineWidth');
  const gridAlignment = block_alignment;
  const horizontalAlignment = getTablePropAttribute(table.attributes, 'horizontalAlignment');
  const verticalAlignment = getTablePropAttribute(table.attributes, 'verticalAlignment');
  const hideTitle = getTablePropAttribute(table.attributes, 'hideTitle');

  /**
   * Identify column data types for each column
   *
   * @since 1.2.0
   *
   * @return {Object} column data type
   */
  const columnDataTypes = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => {
    const map = {};
    if (!isNewBlock) {
      table.columns.forEach(({
        column_id,
        attributes
      }) => {
        map[column_id] = (0,_utils__WEBPACK_IMPORTED_MODULE_13__.normalizeColumnDataType)(attributes?.columnDataType);
      });
    }
    return map;
  }, [table.columns]);

  /**
   * Identify column css classes for each column
   *
   * @since 1.2.0
   *
   * @return {Object} column data type
   */
  const columnClasses = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => {
    const map = {};
    if (!isNewBlock) {
      table.columns.forEach(({
        column_id,
        classes
      }) => {
        map[column_id] = classes;
      });
    }
    return map;
  }, [table.columns]);

  /**
   * Insert a new column in the table.
   *
   * @since    1.0.0
   * @since    1.2.2  Allow column to be added either left or right the current column
   *
   * @param {number} tableId   Identifier key for the table
   * @param {number} columnId  Identifier for the table column
   * @param {string} direction Insert row above or below current row
   * @return {Object} Dynamic Table
   */
  function insertColumn(tableId, columnId, direction) {
    const newColumnId = direction === 'right' ? Number(columnId) + 1 : Number(columnId);
    const newColumn = (0,_table_defaults__WEBPACK_IMPORTED_MODULE_14__.getDefaultColumn)(tableId, newColumnId);
    const tableCells = [];
    for (let i = 0; i < numRows; i++) {
      if (i === 0) {
        const cell = (0,_table_defaults__WEBPACK_IMPORTED_MODULE_14__.getDefaultCell)(tableId, newColumnId, i, 'Border');
        tableCells.push(cell);
      } else {
        const cell = (0,_table_defaults__WEBPACK_IMPORTED_MODULE_14__.getDefaultCell)(tableId, newColumnId, i);
        tableCells.push(cell);
      }
    }
    addColumn(tableId, columnId, direction, newColumn, tableCells);
    setTableStale(false);
    return updateTableEntity(tableId);
  }

  /**
   * Insert a new row in the table.
   *
   * @since    1.0.0
   * @since    1.2.2  Allow row to be added either above or below the current row
   *
   * @param {number} tableId   Identifier key for the table
   * @param {number} rowId     Identifier for the table row
   * @param {string} direction Insert row above or below current row
   * @return {Object} Dynamic Table
   */
  function insertRow(tableId, rowId, direction) {
    const newRowId = direction === 'below' ? Number(rowId) + 1 : Number(rowId);
    const newRow = (0,_table_defaults__WEBPACK_IMPORTED_MODULE_14__.getDefaultRow)(tableId, newRowId);
    const tableCells = [];
    for (let i = 0; i < numColumns; i++) {
      if (i === 0) {
        const cell = (0,_table_defaults__WEBPACK_IMPORTED_MODULE_14__.getDefaultCell)(tableId, i, newRowId, 'Border');
        tableCells.push(cell);
      } else {
        const cell = (0,_table_defaults__WEBPACK_IMPORTED_MODULE_14__.getDefaultCell)(tableId, i, newRowId);
        tableCells.push(cell);
      }
    }
    addRow(tableId, rowId, direction, newRow, tableCells);
    setTableStale(false);
    return updateTableEntity(tableId);
  }

  /**
   * Delete a column from the table
   *
   * @param {number} tableId  Identifier key for the table
   * @param {number} columnId Identifier for the table column
   * @return {Object} Dynamic Table
   */
  function deleteColumn(tableId, columnId) {
    removeColumn(tableId, columnId);
    setTableStale(false);
    return updateTableEntity(tableId);
  }

  /**
   * Delete a column from the table
   *
   * @since    1.0.0
   *
   * @param {*} tableId
   * @param {*} rowId
   * @return {Object} Dynamic Table
   */
  function deleteRow(tableId, rowId) {
    removeRow(tableId, rowId);
    setTableStale(false);
    return updateTableEntity(tableId);
  }

  /**
   * Move a column left or right
   *
   * @since    1.2.2
   *
   * @param {number} tableId
   * @param {number} columnId
   * @param {string} direction Move row left or right
   * @return {Object} Dynamic Table
   */
  function reorderColumns(tableId, columnId, direction) {
    moveColumn(tableId, columnId, direction);
    setTableStale(false);
    return updateTableEntity(tableId);
  }

  /**
   * Move a row up or down
   *
   * @since    1.2.2
   *
   * @param {number} tableId
   * @param {number} rowId
   * @param {string} direction Move row up or down
   * @return {Object} Dynamic Table
   */
  function reorderRows(tableId, rowId, direction) {
    moveRow(tableId, rowId, direction);
    setTableStale(false);
    return updateTableEntity(tableId);
  }

  /**
   * Update table store to reflect changes made to EXISTING table attributes.
   *
   * @since    1.0.0
   *
   * @param {number}                  tableId        Identifier key for the table
   * @param {string}                  attribute      (table, column, row, cell)
   * @param {number | null}           id             Column and/or row id
   * @param {string}                  type           (CONTENT, ATTRIBUTES, CLASSES, PROP)
   * @param {string | number | Array} value          New value that will replace existing config
   * @param {boolean}                 [persist=true] Update table entity (not just the table store)
   */
  function setTableAttributes(tableId, attribute, id, type, value, persist = true) {
    switch (type) {
      case 'CONTENT':
        {
          if (attribute === 'cell') {
            updateCell(tableId, id, 'content', value);
          }
          break;
        }
      case 'ATTRIBUTES':
        {
          if (attribute === 'cell') {
            updateCell(tableId, id, 'attributes', value);
          } else if (attribute === 'row') {
            updateRow(tableId, id, 'attributes', value);
          } else if (attribute === 'column') {
            // setColumnAttributes(value);
            updateColumn(tableId, id, 'attributes', value);
          } else if (attribute === 'table') {
            updateTableProp(tableId, 'attributes', value);
          }
          break;
        }
      case 'CLASSES':
        {
          if (attribute === 'cell') {
            updateCell(tableId, id, 'classes', value);
          } else if (attribute === 'column') {
            updateColumn(tableId, id, 'classes', value);
          }
          break;
        }
      case 'PROP':
        {
          if (attribute === 'column_name') {
            updateColumn(tableId, id, attribute, value);
          } else {
            updateTableProp(tableId, attribute, value);
            if (attribute === 'prior_status') {
              updateTableEntity(tableId, 'unknown');
            }
          }
          break;
        }
      default:
        console.log('Unrecognized Attibute Type');
    }
    setTableStale(false);

    /**
     * Update Table Status only. Table change is for status and the
     * call must bypass the regular persist (persist === false)
     */
    if (persist) {
      return updateTableEntity(tableId);
    }
  }

  /**
   * Show or hide column and row borders to support updates to them.
   *
   * @since    1.0.0
   *
   * @param {Object}  table     Dynamic Table
   * @param {boolean} isChecked Are borders being toggled on?
   */
  function onToggleBorders(table, isChecked) {
    let updatedRows;
    let updatedColumns;
    let updatedCells;

    /**
     * Remove borders if unchecked
     */
    if (isChecked === false) {
      setNumColumns(prev => prev - 1);
      setNumRows(prev => prev - 1);
      updatedRows = table.rows.filter(row => row.row_id !== '0');
      updatedColumns = table.columns.filter(column => column.column_id !== '0');
      updatedCells = table.cells.filter(cell => cell.row_id !== '0' && cell.column_id !== '0');
      updateTableBorder(table.table_id, updatedRows, updatedColumns, updatedCells);
    } else {
      /**
       * Create borders if checked
       */
      setNumColumns(prev => prev + 1);
      setNumRows(prev => prev + 1);

      /**  Create header row border at top of table */
      const rowBorder = [];
      rowBorder.push((0,_table_defaults__WEBPACK_IMPORTED_MODULE_14__.getDefaultRow)(table_id, 0, 'Border'));
      const rowCells = [];
      for (let i = 0; i <= numColumns; i++) {
        const cell = (0,_table_defaults__WEBPACK_IMPORTED_MODULE_14__.getDefaultCell)(table_id, i, 0, 'Border');
        rowCells.push(cell);
      }

      /** Create column border down left side of table */
      const columnBorder = [];
      columnBorder.push((0,_table_defaults__WEBPACK_IMPORTED_MODULE_14__.getDefaultColumn)(table_id, 0, 'Border'));
      const columnCells = [];
      for (let i = 1; i <= numRows; i++) {
        const cell = (0,_table_defaults__WEBPACK_IMPORTED_MODULE_14__.getDefaultCell)(table_id, 0, i, 'Border');
        columnCells.push(cell);
      }

      /** Sort table parts */
      updatedRows = (0,_utils__WEBPACK_IMPORTED_MODULE_13__.tableSort)('rows', [...table.rows, ...rowBorder]);
      updatedColumns = (0,_utils__WEBPACK_IMPORTED_MODULE_13__.tableSort)('columns', [...table.columns, ...columnBorder]);
      updatedCells = (0,_utils__WEBPACK_IMPORTED_MODULE_13__.tableSort)('cells', [...table.cells, ...rowCells, ...columnCells]);
      updateTableBorder(table.table_id, updatedRows, updatedColumns, updatedCells);
    }
    setShowBorders(isChecked);
    setTableStale(false);
  }

  /**
   * Create new table and related table entity.
   *
   * @since    1.0.0
   *
   * @param {number} columnCount Number of columns in table
   * @param {number} rowCount    Number of rows in table
   * @param {string} tableName   Name of new table
   */
  function createTable(columnCount, rowCount, tableName) {
    setTableStale(false);
    const newBlockTableRef = (0,_utils__WEBPACK_IMPORTED_MODULE_13__.generateBlockTableRef)();
    const newTable = (0,_table_defaults__WEBPACK_IMPORTED_MODULE_14__.initTable)(newBlockTableRef, columnCount, rowCount, tableName);
    props.setAttributes({
      block_table_ref: newBlockTableRef
    });
    receiveNewTable(newTable);
    setAwaitingTableEntityCreation(true);
    createTableEntity();
  }

  /**
   * Process event to create new table.
   *
   * @since    1.0.0
   *
   * @param {Object} event Table Creation Event
   */
  function onCreateTable(event) {
    event.preventDefault();
    createTable(numColumns, numRows, tableName);
  }

  /**
   * Process changes for the column count when defining a new table creation.
   *
   * @since    1.0.0
   *
   * @param {number} num_columns Number of columns entered in form
   */
  function onChangeInitialColumnCount(num_columns) {
    let newNumColumns = num_columns;
    if (num_columns < 1 || num_columns > 50) {
      const errorText = 'Cannot have ' + num_columns + ' columns.  You must have at least 1 and no more than 50 columns.';
      createNotice('error', errorText, {
        id: 'invalidNumColumns',
        isDismissible: true,
        politeness: 'assertive'
      });
      newNumColumns = Number(numColumns);
    } else {
      removeNotice('invalidNumColumns');
    }
    setNumColumns(newNumColumns);
  }

  /**
   * Process changes for the row count when defining a new table creation.
   *
   * @since    1.0.0
   *
   * @param {number} num_rows Number of rows entered in form
   */
  function onChangeInitialRowCount(num_rows) {
    let newNumRows = num_rows;
    if (num_rows < 1 || num_rows > 1000) {
      const errorText = 'Cannot have ' + num_rows + ' rows.  You must have at least 1 and no more than 1,000 rows.';
      createNotice('error', errorText, {
        id: 'invalidNumRows',
        isDismissible: true,
        politeness: 'assertive'
      });
      newNumRows = Number(numRows);
    } else {
      removeNotice('invalidNumRows');
    }
    setNumRows(newNumRows);
  }

  /**
   * Update cell data when changed.
   *
   * @since 1.2.0
   *
   * @param {number} table_id Current table id
   * @param {number} cell_id  Updated cell id
   * @param {Object} patch    Update payload to store
   */
  function onChangeCellData(table_id, cell_id, patch) {
    setTableAttributes(table_id, 'cell', cell_id, 'CONTENT', patch.content);
    setTableAttributes(table_id, 'cell', cell_id, 'ATTRIBUTES', patch.attributes);
  }

  /**
   * Sets the focused cell state when a cell in the dynamic table receives focus.
   *
   * @since    1.1.1
   *
   * @param {Object} event onFocusCapture event
   * @return {void}
   */
  function onGridFocusCapture(event) {
    const el = event.target.closest?.('[data-cell-id]');
    if (!el) return;
    const col = Number(el.dataset.col);
    const row = Number(el.dataset.row);
    if (!Number.isFinite(col) || !Number.isFinite(row)) return;

    // Only sync highlight; do not move focus, do not gate with pending flags
    setFocusedCell(prev => prev.col === col && prev.row === row ? prev : {
      col,
      row
    });

    // If focus moved to another cell wrapper, stop editing.
    const nextCellId = el.getAttribute('data-cell-id');
    if (editingCellId && String(editingCellId) !== String(nextCellId)) {
      setEditingCellId(null);
    }
  }

  /**
   * Set focus to specified cell coordinates in the dynamic table.
   *
   * @since    1.1.1
   *
   * @param {number} col Column number of the cell in which the focus action occured
   * @param {number} row Row number of the cell in which the focus action occured
   * @return {boolean} Was focus successful?
   */
  function focusCell(col, row) {
    const root = gridRef.current;
    if (!root) return false;
    const el = root.querySelector(`[data-cell-id][data-col="${col}"][data-row="${row}"]`);
    if (!el) return false;

    // roving tabindex
    root.querySelectorAll('[data-cell-id][tabindex="0"]').forEach(node => {
      if (node !== el) node.tabIndex = -1;
    });
    el.tabIndex = 0;

    // keep highlight in sync with intended focus target
    setFocusedCell(prev => prev.col === col && prev.row === row ? prev : {
      col,
      row
    });

    // Focusing on next frame helps if DOM is mid-rerender
    window.requestAnimationFrame(() => {
      el.focus();
    });
    return true;
  }
  const navMaxCol = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => {
    // exclude border column 0
    if (isNewBlock) return;
    return Math.max(1, ...table.columns.map(c => Number(c.column_id)).filter(n => Number.isFinite(n) && n > 0));
  }, [table.columns]);
  const navMaxRow = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => {
    // exclude border row 0
    if (isNewBlock) return;
    return Math.max(1, ...table.rows.map(r => Number(r.row_id)).filter(n => Number.isFinite(n) && n > 0));
  }, [table.rows]);
  const navHeaderRow = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => {
    // get header row if header exists
    if (isNewBlock) return;
    return table?.rows?.find(r => r.attributes.isHeader === true)?.row_id;
  }, [table.rows]);

  /**
   * Handle keyboard navigation within the active dynamic table block and updates focus appropriately
   *
   * @since    1.1.1
   *
   * @param {Object} event onKeyDown event
   * @return {void}
   */
  function onCellKeyDown(event) {
    // While editing, allow Tab/arrow keys to exit edit mode and continue with grid navigation.
    if (editingCellId) {
      const editExitNavKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);
      const editTarget = gridRef.current?.ownerDocument?.activeElement;
      const editTargetInputType = editTarget?.tagName === 'INPUT' ? String(editTarget.type || '').toLowerCase() : '';
      const isDateTimeEditor = ['date', 'time', 'datetime-local'].includes(editTargetInputType);
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setEditingCellId(null);
        window.requestAnimationFrame(() => {
          const wrapper = gridRef.current?.querySelector(`[data-cell-id][tabindex="0"]`);
          wrapper?.focus?.();
        });
        return;
      }

      // For native date/time editors, Enter should commit via blur and exit edit mode.
      if (event.key === 'Enter' && isDateTimeEditor) {
        event.preventDefault();
        event.stopPropagation();
        editTarget?.blur?.();
        return;
      }

      // Let Tab/arrow keys fall through to navigation.
      // Do not clear editing state yet; date/time inputs persist on blur.
      if (!editExitNavKeys.has(event.key)) {
        return;
      }
    }
    const root = gridRef.current;
    if (!root) return;
    const doc = root.ownerDocument || document;
    const active = doc.activeElement;
    const activeCellEl = active?.closest?.('[data-cell-id]');
    if (!activeCellEl || !root.contains(activeCellEl)) return;
    let col = Number(activeCellEl.dataset.col);
    let row = Number(activeCellEl.dataset.row);
    if (!Number.isFinite(col) || !Number.isFinite(row)) return;
    const navKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'F2', 'Escape', 'Delete', 'Backspace']);
    const columnDataType = columnDataTypes[col]?.type || 'general';
    const activeRow = table.rows.find(r => Number(r.row_id) === row);
    const isHeaderRow = activeRow?.attributes?.isHeader === true;
    const editDataType = isHeaderRow ? 'general' : columnDataType;
    const canTypeToEdit = isHeaderRow || editDataType === 'general' || editDataType === 'date-time';

    // Allow direct edit for printable keys
    if (!navKeys.has(event.key) && isPrintableKey(event) && canTypeToEdit) {
      // Enter edit mode
      onCellKeyDownEditing(event, activeCellEl, event.key, editDataType);
      return;
    }

    // Enter edit mode
    if (event.key === 'Enter' || event.key === 'F2') {
      event.preventDefault();
      event.stopPropagation();
      const id = activeCellEl.getAttribute('data-cell-id');
      setEditingCellId(id);
      window.requestAnimationFrame(() => {
        activeCellEl?.querySelector?.('[contenteditable="true"], input, textarea')?.focus?.();
      });
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      // no-op when not editing
      return;
    }

    // Delete/backspace clears cell
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      event.stopPropagation();
      const cellData = table.cells.find(c => Number(c.column_id) === col && Number(c.row_id) === row);
      if (cellData) {
        const attrs = {
          ...(cellData.attributes || {}),
          value: {
            ...(cellData.attributes && cellData.attributes.value || {})
          }
        };
        setTableAttributes(table_id, 'cell', cellData.cell_id, 'CONTENT', '');
        setTableAttributes(table_id, 'cell', cellData.cell_id, 'ATTRIBUTES', attrs);
      }
      return;
    }

    // Intercept navigation
    event.preventDefault();
    event.stopPropagation();
    switch (event.key) {
      case 'ArrowUp':
        if (event.altKey) {
          const firstBodyRowId = navHeaderRow ? Number(navHeaderRow) + 1 : 1;
          if (row <= firstBodyRowId) break;
          reorderRows(table_id, row, 'up');
        }
        row = Math.max(1, row - 1);
        break;
      case 'ArrowDown':
        if (event.altKey) {
          if (isHeaderRow || row === navMaxRow) break;
          reorderRows(table_id, row, 'down');
        }
        row = Math.min(navMaxRow, row + 1);
        break;
      case 'ArrowLeft':
        if (event.altKey) {
          if (col === 1) break;
          reorderColumns(table_id, col, 'left');
        }
        col = Math.max(1, col - 1);
        break;
      case 'ArrowRight':
        if (event.altKey) {
          if (col === navMaxCol) break;
          reorderColumns(table_id, col, 'right');
        }
        col = Math.min(navMaxCol, col + 1);
        break;
      case 'Tab':
        if (event.shiftKey) {
          if (col > 1) col -= 1;else if (row > 1) {
            row -= 1;
            col = navMaxCol;
          }
        } else {
          // eslint-disable-next-line no-lonely-if
          if (col < navMaxCol) {
            col = Math.min(navMaxCol, col + 1);
          } else if (col === navMaxCol && row < navMaxRow) {
            row += 1;
            col = 1;
          }
        }
        break;
      default:
        console.log('Key Code = ' + event.key);
        return;
    }
    focusCell(col, row);
  }

  /**
   * Identify if key press was a printable character
   *
   * @since    1.2.0
   *
   * @param {Object} event onKeyDown event
   * @return {boolean}     Is Key Press a printable character?
   */
  function isPrintableKey(event) {
    // Ignore modifier combos and IME composition
    if (event.ctrlKey || event.metaKey || event.altKey) return false;
    if (event.isComposing || event.key === 'Process') return false;

    // Printable characters are usually length 1 (includes space)
    return typeof event.key === 'string' && event.key.length === 1;
  }

  /**
   * Handle transition from navigation to editing on grid cell
   *
   * @since    1.2.0
   *
   * @param {Object} event          onKeyDown event
   * @param {Object} activeCellEl   Current cell element
   * @param {string} char           Key pressed
   * @param {string} columnDataType Data Type for Column
   */
  function onCellKeyDownEditing(event, activeCellEl, char, columnDataType = 'general') {
    const id = activeCellEl.getAttribute('data-cell-id');

    // For native date/time controls, mount the editor synchronously so the
    // initiating printable key can be handled by the input.
    if (columnDataType === 'date-time') {
      (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.flushSync)(() => {
        setEditingCellId(id);
      });
      const focusDateTimeEditor = () => {
        const mountedCellEl = gridRef.current?.querySelector(`[data-cell-id="${CSS.escape(id)}"]`);
        const input = mountedCellEl?.querySelector?.('input, textarea');
        input?.focus?.();
        return !!input;
      };

      // Try immediately (same key event), then fallback next frame.
      if (!focusDateTimeEditor()) {
        window.requestAnimationFrame(() => {
          focusDateTimeEditor();
        });
      }
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setEditingCellId(id);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const doc = activeCellEl.ownerDocument;
        const editable = activeCellEl.querySelector('[contenteditable="true"]');
        const input = activeCellEl.querySelector('input, textarea');
        if (editable) {
          editable.focus();

          // Move caret to END of contenteditable
          const sel = doc.getSelection();
          const range = doc.createRange();
          range.selectNodeContents(editable);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);

          // Insert text at caret
          // execCommand is deprecated but still the most compatible for contenteditable insertion
          if (doc.queryCommandSupported?.('insertText')) {
            doc.execCommand('insertText', false, char);
          } else {
            range.insertNode(doc.createTextNode(char));
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
          return;
        }
        if (input) {
          input.focus();
          const nativeDateTimeInput = columnDataType === 'date-time' || ['date', 'time', 'datetime-local'].includes(input.type);

          // For native date/time controls, typing should enter edit mode and focus input.
          // Do not append raw characters (often invalid for these input types).
          if (nativeDateTimeInput) return;
          const v = input.value ?? '';
          input.value = v + char;

          // Make React/Gutenberg notice the change
          input.dispatchEvent(new Event('input', {
            bubbles: true
          }));

          // Caret to end
          if (['text', 'search', 'tel', 'url', 'password'].includes(input.type)) {
            const end = input.value.length;
            input.setSelectionRange?.(end, end);
          }
        }
      });
    });
  }

  /**
   * Process updates (insert, update, delete) to a table column.
   *
   * @since    1.0.0
   * @since    1.1.1  Updated to support column menu refactor.
   * @since    1.2.2  Added actions to move a column up or down and insert to the right
   *
   * @param {Object} e                       Table Creation Event
   * @param {string} updateType              attribute (Update), insert, delete
   * @param {number} tableId                 Identifier key for the table
   * @param {number} columnId                Identifier for the table column
   * @param {string} columnName              Column name
   * @param {Array}  updatedColumnAttributes New column attribute values
   * @param {string} updatedColumnClasses    New column class values
   */
  function onUpdateColumn(e, updateType, tableId, columnId, columnName = '', updatedColumnAttributes, updatedColumnClasses) {
    switch (updateType) {
      case 'attributes':
        {
          if (!updatedColumnAttributes) {
            const clickedColumn = table.columns.find(c => c.column_id === columnId);
            const attrs = clickedColumn?.attributes || {};
            const columnLabel = clickedColumn?.column_name || String(columnId);
            openColumnWidthModal(e, columnId, columnLabel, attrs);
          } else {
            setTableAttributes(tableId, 'column', columnId, 'ATTRIBUTES', updatedColumnAttributes);
          }
          break;
        }
      case 'dataType':
        {
          if (!updatedColumnAttributes) {
            const clickedColumn = table.columns.find(c => c.column_id === columnId);
            const columnLabel = clickedColumn?.column_name || String(columnId);
            const attrs = clickedColumn?.attributes || {};
            const classes = clickedColumn?.classes || '';
            openColumnDataTypeModal(e, columnId, columnLabel, attrs, classes);
          } else {
            setTableAttributes(tableId, 'column_name', columnId, 'PROP', columnName);
            setTableAttributes(tableId, 'column', columnId, 'ATTRIBUTES', updatedColumnAttributes);
            setTableAttributes(tableId, 'column', columnId, 'CLASSES', updatedColumnClasses);
          }
          break;
        }
      case 'insert-left':
        {
          insertColumn(tableId, columnId, 'left');
          break;
        }
      case 'insert-right':
        {
          insertColumn(tableId, columnId, 'right');
          break;
        }
      case 'delete':
        {
          deleteColumn(tableId, columnId);
          break;
        }
      case 'move-left':
        {
          reorderColumns(tableId, columnId, 'left');
          break;
        }
      case 'move-right':
        {
          reorderColumns(tableId, columnId, 'right');
          break;
        }
      default:
        console.log('Unrecognized Column Update Type');
    }
  }

  /**
   * Update table row based on row menu actions.
   *
   * Descrption: Current actions include row insert, delete, update height.
   *
   * @since    1.0.0
   * @since    1.1.1  Updated to support row menu refactor.
   * @since    1.2.2  Added actions to move a row up or down and insert below
   *
   * @param {Object} e                    Table Creation Event
   * @param {string} updateType           attribute (Update), insert, delete
   * @param {number} tableId              Identifier key for the table
   * @param {number} rowId                Identifier for the table row
   * @param {Array}  updatedRowAttributes New row attribute values
   */
  function onUpdateRow(e, updateType, tableId, rowId, updatedRowAttributes) {
    switch (updateType) {
      case 'attributes':
        {
          if (!updatedRowAttributes) {
            const clickedRow = table.rows.find(r => r.row_id === rowId);
            const attrs = clickedRow?.attributes || {};
            openRowHeightModal(e, rowId, String(rowId), attrs);
          } else {
            setTableAttributes(tableId, 'row', rowId, 'ATTRIBUTES', updatedRowAttributes);
          }
          break;
        }
      case 'insert-above':
        {
          insertRow(tableId, rowId, 'above');
          break;
        }
      case 'insert-below':
        {
          insertRow(tableId, rowId, 'below');
          break;
        }
      case 'delete':
        {
          deleteRow(tableId, rowId);
          break;
        }
      case 'move-up':
        {
          reorderRows(tableId, rowId, 'up');
          break;
        }
      case 'move-down':
        {
          reorderRows(tableId, rowId, 'down');
          break;
        }
      default:
        console.log('Unrecognized Row Update Type');
    }
  }

  /**
   * Process mouse clicks on the table borders.
   *
   * @since    1.0.0
   *
   * @param {number} column_id Identifier for the table column
   * @param {number} row_id    Identifier for the table row
   * @param {Object} table     Dynamic Table
   * @param {Object} e         Mouse Click Event
   */
  function onMouseBorderClick(column_id, row_id, table, e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (row_id === '0' && column_id !== '0') {
      const clickedColumn = table.columns.find(c => c.column_id === column_id);
      const attrs = clickedColumn?.attributes || {};
      openColumnMenu(e, column_id, String(column_id), attrs);
    }
    if (row_id !== '0' && column_id === '0') {
      const clickedRow = table.rows.find(r => r.row_id === row_id);
      const attrs = clickedRow?.attributes || {};
      openRowMenu(e, row_id, String(row_id), attrs);
    }
    setTableStale(false);
  }

  /**
   * Process request to prevent the table title from displaying
   *
   * @since    1.0.0
   *
   * @param {Object}  table     Dynamic Table
   * @param {boolean} isChecked Is the table title being hidden?
   */
  function onHideTitle(table, isChecked) {
    const updatedTableAttributes = {
      ...table.attributes,
      hideTitle: isChecked
    };
    setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
  }

  /**
   * Process request to allow the table to scroll horizontally
   *
   * @since    1.0.0
   *
   * @param {Object}  table     Dynamic Table
   * @param {boolean} isChecked Show horizontal scroll bar if appropriate?
   */
  function onAllowHorizontalScroll(table, isChecked) {
    const updatedTableAttributes = {
      ...table.attributes,
      allowHorizontalScroll: isChecked
    };
    setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
  }

  /**
   * Process request to show banded even numbered table rows
   *
   * @since    1.0.0
   *
   * @param {Object}  table     Dynamic Table
   * @param {boolean} isChecked Show banded table rows?
   */
  function onShowBandedRows(table, isChecked) {
    const updatedTableAttributes = {
      ...table.attributes,
      bandedRows: isChecked
    };
    setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
  }

  /**
   * Process requests for specific background and text colors on banded table rows
   *
   * @param {Object} table Dynamic Table
   * @param {string} type  Attribute to be colored (background, text)
   * @param {string} color New color code (hex)
   */
  function onBandedRowColor(table, type, color) {
    let updatedTableAttributes = '';
    if (type == 'background') {
      updatedTableAttributes = {
        ...table.attributes,
        bandedRowBackgroundColor: color
      };
      setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
    }
    if (type == 'text') {
      updatedTableAttributes = {
        ...table.attributes,
        bandedTextColor: color
      };
      setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
    }
  }

  /**
   * Process request create a header row from the first table row.
   *
   * @since    1.0.0
   *
   * @param {Object}  table     Dynamic Table
   * @param {boolean} isChecked Create a header row
   */
  function onEnableHeaderRow(table, isChecked) {
    const updatedTableAttributes = {
      ...table.attributes,
      enableHeaderRow: isChecked,
      headerRowSticky: false
    };
    setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
    const updatedRowAttributes = {
      ...table.rows.find(x => x.row_id === '1').attributes,
      isHeader: isChecked ? true : false
    };
    setTableAttributes(table.table_id, 'row', '1', 'ATTRIBUTES', updatedRowAttributes);
  }

  /**
   * Process request to align header column content horizontally.
   *
   * @since    1.0.0
   *
   * @param {Object} table     Dynamic Table
   * @param {string} alignment The alignment position (left, center, right)
   */
  function onAlignHeader(table, alignment) {
    const updatedTableAttributes = {
      ...table.attributes,
      headerAlignment: alignment
    };
    setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
  }

  /**
   * Process request to syle header row borders.
   *
   * @since    1.0.0
   *
   * @param {Object} table  Dynamic Table
   * @param {Array}  border Outside header border color, width, style
   */
  function onHeaderBorder(table, border) {
    const updatedTableAttributes = {
      ...table.attributes,
      headerBorder: border
    };
    setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
  }

  /**
   * Process request to make the header row sticky with vertical scroll.
   *
   * @since    1.0.0
   *
   * @param {Object}  table     Dynamic Table
   * @param {boolean} isChecked Make header row sticky
   */
  function onHeaderRowSticky(table, isChecked) {
    const updatedTableAttributes = {
      ...table.attributes,
      headerRowSticky: isChecked
    };
    setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
  }

  /**
   * Process request to align body column content horizontally.
   *
   * @since    1.0.0
   *
   * @param {Object} table     Dynamic Table
   * @param {string} alignment The alignment position (left, center, right)
   */
  function onAlignBody(table, alignment) {
    const updatedTableAttributes = {
      ...table.attributes,
      bodyAlignment: alignment
    };
    setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
  }

  /**
   * Process request to syle body row borders.
   *
   * @since    1.0.0
   *
   * @param {Object} table  Dynamic Table
   * @param {Array}  border Outside body border color, width, style
   */
  function onBodyBorder(table, border) {
    const updatedTableAttributes = {
      ...table.attributes,
      bodyBorder: border
    };
    setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
  }

  /**
   * Process request to show inner body row grid lines.
   *
   * @since    1.0.0
   *
   * @param {Object}  table     Dynamic Table
   * @param {boolean} isChecked Show inner body row grid lines
   */
  function onShowGridLines(table, isChecked) {
    const updatedTableAttributes = {
      ...table.attributes,
      showGridLines: isChecked
    };
    setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
  }

  /**
   * Process request to set grid line width
   *
   * @since    1.0.0
   *
   * @param {Object} table         Dynamic Table
   * @param {string} gridLineWidth Width of grid lines in pixels
   */
  function onGridLineWidth(table, gridLineWidth) {
    const updatedTableAttributes = {
      ...table.attributes,
      gridLineWidth: Number(gridLineWidth)
    };
    setTableAttributes(table.table_id, 'table', '', 'ATTRIBUTES', updatedTableAttributes);
  }

  /**
   * Set variables used to render the dynamic table
   */
  const gridColumnStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.processColumns)(isNewBlock, tableIsResolving, enableFutureFeatures, table.columns);
  const gridHeaderRowStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.processHeaderRow)(isNewBlock, tableIsResolving, table.rows);
  const gridBodyRowStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.processBodyRows)(isNewBlock, tableIsResolving, table.rows);
  const startGridHeaderRowNbrStyle = showBorders ? 2 : 1;
  const endGridHeaderRowNbrStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.endGridRowNbr)(1, 'Header', numRows, enableHeaderRow, showBorders, false);
  const startGridBodyRowNbrStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.startGridRowNbr)(enableHeaderRow, showBorders);
  const endGridBodyRowNbrStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.endGridRowNbr)(startGridBodyRowNbrStyle, 'Body', numRows, enableHeaderRow, showBorders, false);
  const horizontalScrollStyle = allowHorizontalScroll ? 'auto' : 'hidden';
  const gridBandedRowTextColor = (0,_style__WEBPACK_IMPORTED_MODULE_15__.gridBandedRowTextColorStyle)(isNewBlock, tableIsResolving, bandedTextColor);
  const gridBandedRowBackgroundColor = (0,_style__WEBPACK_IMPORTED_MODULE_15__.gridBandedRowBackgroundColorStyle)(isNewBlock, tableIsResolving, bandedRowBackgroundColor);
  const gridShowInnerLines = (0,_style__WEBPACK_IMPORTED_MODULE_15__.gridInnerBorderStyle)(isNewBlock, tableIsResolving, showGridLines);
  const gridInnerLineWidth = (0,_style__WEBPACK_IMPORTED_MODULE_15__.gridInnerBorderWidthStyle)(isNewBlock, tableIsResolving, showGridLines, gridLineWidth);
  const headerRowStickyStyle = headerRowSticky ? 'auto' : 'hidden';
  const headerRowStickyClass = headerRowSticky ? 'grid-control__header--sticky ' : '';
  const gridHeaderBackgroundColorStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getGridHeaderBackgroundColorStyle)(isNewBlock, tableIsResolving, gridHeaderBackgroundColor, blockProps.style.backgroundColor);

  /**
   * Header Styling
   */
  const headerTextAlignmentStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getHeaderTextAlignmentStyle)(isNewBlock, tableIsResolving, headerAlignment);
  const headerBorderStyleType = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyleType)(headerBorder);

  // Top header border
  const headerBorderTopColor = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(headerBorder, 'top', 'color', headerBorderStyleType);
  const headerBorderTopStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(headerBorder, 'top', 'style', headerBorderStyleType);
  const headerBorderTopWidth = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(headerBorder, 'top', 'width', headerBorderStyleType);

  // Right header border
  const headerBorderRightColor = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(headerBorder, 'right', 'color', headerBorderStyleType);
  const headerBorderRightStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(headerBorder, 'right', 'style', headerBorderStyleType);
  const headerBorderRightWidth = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(headerBorder, 'right', 'width', headerBorderStyleType);

  // Bottom header border
  const headerBorderBottomColor = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(headerBorder, 'bottom', 'color', headerBorderStyleType);
  const headerBorderBottomStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(headerBorder, 'bottom', 'style', headerBorderStyleType);
  const headerBorderBottomWidth = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(headerBorder, 'bottom', 'width', headerBorderStyleType);

  // Left header border
  const headerBorderLeftColor = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(headerBorder, 'left', 'color', headerBorderStyleType);
  const headerBorderLeftStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(headerBorder, 'left', 'style', headerBorderStyleType);
  const headerBorderLeftWidth = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(headerBorder, 'left', 'width', headerBorderStyleType);

  /**
   * Body Styling
   */
  const bodyTextAlignmentStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getHeaderTextAlignmentStyle)(isNewBlock, tableIsResolving, bodyAlignment);
  const bodyBorderStyleType = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyleType)(bodyBorder);
  // Top body border
  const bodyBorderTopColor = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(bodyBorder, 'top', 'color', bodyBorderStyleType);
  const bodyBorderTopStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(bodyBorder, 'top', 'style', bodyBorderStyleType);
  const bodyBorderTopWidth = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(bodyBorder, 'top', 'width', bodyBorderStyleType);

  // Right body border
  const bodyBorderRightColor = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(bodyBorder, 'right', 'color', bodyBorderStyleType);
  const bodyBorderRightStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(bodyBorder, 'right', 'style', bodyBorderStyleType);
  const bodyBorderRightWidth = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(bodyBorder, 'right', 'width', bodyBorderStyleType);

  // Bottom body border
  const bodyBorderBottomColor = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(bodyBorder, 'bottom', 'color', bodyBorderStyleType);
  const bodyBorderBottomStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(bodyBorder, 'bottom', 'style', bodyBorderStyleType);
  const bodyBorderBottomWidth = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(bodyBorder, 'bottom', 'width', bodyBorderStyleType);

  // Left body border
  const bodyBorderLeftColor = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(bodyBorder, 'left', 'color', bodyBorderStyleType);
  const bodyBorderLeftStyle = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(bodyBorder, 'left', 'style', bodyBorderStyleType);
  const bodyBorderLeftWidth = (0,_style__WEBPACK_IMPORTED_MODULE_15__.getBorderStyle)(bodyBorder, 'left', 'width', bodyBorderStyleType);

  /**
   * Render clickable row menu
   *
   * @since 1.2.0
   */
  const renderRowMenu = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.Fragment, {
    children: rowMenu.isOpen && rowMenu.anchorEl && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_components__WEBPACK_IMPORTED_MODULE_16__.RowMenu, {
      anchor: rowMenu.anchorEl,
      table: table,
      rowId: rowMenu.rowId,
      rowLabel: rowMenu.rowLabel,
      rowAttributes: rowMenu.rowAttributes,
      updatedRow: onUpdateRow,
      onRequestClose: closeRowMenu
    })
  });

  /**
   * Render row height dialog box
   *
   * @since 1.2.0
   */
  const renderRowHeightModal = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.Fragment, {
    children: rowHeightModal.isOpen && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_components__WEBPACK_IMPORTED_MODULE_16__.RowHeightModal, {
      tableId: table_id,
      rowId: rowHeightModal.rowId,
      rowLabel: rowHeightModal.rowLabel,
      rowAttributes: rowHeightModal.rowAttributes,
      updatedRow: onUpdateRow,
      onRequestClose: closeRowHeightModal
    })
  });

  /**
   * Render clickable column menu
   *
   * @since 1.2.0
   */
  const renderColumnMenu = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.Fragment, {
    children: columnMenu.isOpen && columnMenu.anchorEl && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_components__WEBPACK_IMPORTED_MODULE_16__.ColumnMenu, {
      debugSource: "EDIT_TOP_LEVEL",
      anchor: columnMenu.anchorEl,
      table: table,
      columnId: columnMenu.columnId,
      columnLabel: columnMenu.columnLabel,
      columnAttributes: columnMenu.columnAttributes,
      updatedColumn: onUpdateColumn,
      onRequestClose: closeColumnMenu
    })
  });

  /**
   * Render column data content type menu
   *
   * @since 1.2.0
   */
  const renderColumnDataTypeModal = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.Fragment, {
    children: columnDataTypeModal.isOpen && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_components__WEBPACK_IMPORTED_MODULE_16__.ColumnDataTypeModal, {
      tableId: table_id,
      columnId: columnDataTypeModal.columnId,
      columnLabel: columnDataTypeModal.columnLabel,
      columnAttributes: columnDataTypeModal.columnAttributes,
      columnClasses: columnDataTypeModal.columnClasses,
      enableProFeatures: enableProFeatures,
      updatedColumn: onUpdateColumn,
      onRequestClose: closeColumnDataTypeModal
    })
  });

  /**
   * Render column width dialog box
   *
   * @since 1.2.0
   */
  const renderColumnWidthModal = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.Fragment, {
    children: columnWidthModal.isOpen && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_components__WEBPACK_IMPORTED_MODULE_16__.ColumnWidthModal, {
      tableId: table_id,
      columnId: columnWidthModal.columnId,
      columnLabel: columnWidthModal.columnLabel,
      columnAttributes: columnWidthModal.columnAttributes,
      enableProFeatures: enableProFeatures,
      updatedColumn: onUpdateColumn,
      onRequestClose: closeColumnWidthModal
    })
  });

  /**
   * Render inspector controls side panel
   *
   * @since 1.2.0
   *
   * @param {Object} e Change event
   */
  const renderControls = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_6__.BlockControls, {
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_6__.BlockAlignmentToolbar, {
        value: block_alignment,
        onChange: e => props.setAttributes({
          block_alignment: e
        })
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_6__.InspectorControls, {
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.Panel, {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelBody, {
          title: "Definition",
          initialOpen: true,
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelRow, {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)("div", {
              className: "grid-control__inspector-controls--read-only",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("span", {
                className: "grid-control__inspector-controls--read-only-label",
                children: "Table Name:"
              }), htmlToText(table.table_name)]
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelRow, {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)("div", {
              className: "grid-control__inspector-controls--read-only",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("span", {
                className: "grid-control__inspector-controls--read-only-label",
                children: "Table Columns/Rows:"
              }), numColumns, "/", numRows]
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelRow, {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.CheckboxControl, {
              label: "Show table borders",
              __nextHasNoMarginBottom: true,
              checked: showBorders,
              onChange: e => onToggleBorders(table, e)
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelRow, {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.CheckboxControl, {
              label: "Hide Table Title",
              __nextHasNoMarginBottom: true,
              checked: hideTitle,
              onChange: e => onHideTitle(table, e)
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelBody, {
          title: "Table Header",
          initialOpen: false,
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelRow, {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.CheckboxControl, {
              label: "First Row as Header?",
              __nextHasNoMarginBottom: true,
              checked: enableHeaderRow,
              onChange: e => onEnableHeaderRow(table, e)
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelRow, {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.CheckboxControl, {
              label: "Freeze Header Row?",
              __nextHasNoMarginBottom: true,
              disabled: !enableHeaderRow,
              checked: headerRowSticky,
              onChange: e => onHeaderRowSticky(table, e)
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelRow, {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)("span", {
              className: "inspector-controls-menu__header-alignment--middle",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_6__.AlignmentControl, {
                id: "header-alignment",
                value: headerAlignment,
                onChange: e => onAlignHeader(table, e)
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("label", {
                className: "inspector-controls-nemu__label--left-margin",
                htmlFor: "header-alignment",
                children: "Text Alignment"
              })]
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelRow, {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.BorderBoxControl, {
              className: "border-box-workaround",
              __next40pxDefaultSize: true,
              __experimentalIsRenderedInSidebar: true,
              label: "Borders"
              // hideLabelFromVision="false"
              ,
              isCompact: "true",
              colors: borderBoxColors,
              value: headerBorder,
              onChange: e => onHeaderBorder(table, e)
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelBody, {
          title: "Table Body",
          initialOpen: false,
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelRow, {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.CheckboxControl, {
              label: "Allow Horizontal Acroll?",
              __nextHasNoMarginBottom: true,
              checked: allowHorizontalScroll,
              onChange: e => onAllowHorizontalScroll(table, e)
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelRow, {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)("span", {
              className: "inspector-controls-menu__header-alignment--middle",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_6__.AlignmentControl, {
                id: "body-alignment",
                value: bodyAlignment,
                onChange: e => onAlignBody(table, e)
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("label", {
                className: "inspector-controls-menu__label--left-margin",
                htmlFor: "body-alignment",
                children: "Text Alignment"
              })]
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelRow, {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.BorderBoxControl, {
              className: "border-box-workaround",
              label: "Borders",
              hideLabelFromVision: "false",
              isCompact: "true",
              colors: borderBoxColors,
              value: bodyBorder,
              onChange: e => onBodyBorder(table, e)
            })
          })]
        })]
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_6__.InspectorControls, {
      group: "styles",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelBody, {
        title: "Banded Table Rows",
        initialOpen: false,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelRow, {
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.CheckboxControl, {
            label: "Display Banded Rows",
            __nextHasNoMarginBottom: true,
            checked: bandedRows
            // checked={true}
            ,
            onChange: e => onShowBandedRows(table, e)
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_6__.PanelColorSettings, {
          __experimentalIsRenderedInSidebar: true,
          title: 'Banded Row Color',
          colors: themeColors,
          colorSettings: [{
            value: bandedTextColor,
            onChange: newColor => onBandedRowColor(table, 'text', newColor),
            label: 'Text'
          }, {
            value: bandedRowBackgroundColor,
            onChange: newColor => onBandedRowColor(table, 'background', newColor),
            label: 'Background'
          }]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelBody, {
        title: "Grid Lines",
        initialOpen: false,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelRow, {
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.CheckboxControl, {
            label: "Display Inner Grid Lines",
            __nextHasNoMarginBottom: true,
            checked: showGridLines,
            onChange: e => onShowGridLines(table, e)
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.PanelRow, {
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.__experimentalNumberControl, {
            label: "Inner Grid Line Width",
            value: gridLineWidth,
            labelPosition: "side",
            onChange: e => onGridLineWidth(table, e)
          })
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_6__.InspectorControls, {
      group: "typography"
    })]
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)("div", {
    ...blockProps,
    children: [!isNewBlock && !tableIsResolving && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.Fragment, {
      children: [renderRowMenu, renderRowHeightModal, renderColumnMenu, renderColumnDataTypeModal, renderColumnWidthModal, renderControls, /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)("div", {
        style: {
          display: 'block'
        },
        children: [!hideTitle && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_6__.RichText, {
          id: "tableTitle",
          style: {
            '--gridAlignment': gridAlignment
          },
          tagName: "p",
          allowedFormats: ['core/bold', 'core/italic'],
          onChange: e => setTableAttributes(table_id, 'table_name', '', 'PROP', e),
          value: table.table_name
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("div", {
          ref: gridRef,
          onKeyDownCapture: onCellKeyDown // <-- capture phase
          ,
          onFocusCapture: onGridFocusCapture,
          tabIndex: 0,
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("div", {
            className: "grid-scroller",
            style: {
              '--headerRowSticky': headerRowStickyStyle
              // "--startGridBodyRowNbr": startGridBodyRowNbrStyle,
              // "--endGridBodyRowNbr": endGridBodyRowNbrStyle
            },
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)("div", {
              className: 'grid-control ' + headerRowStickyClass,
              style: {
                '--gridTemplateColumns': gridColumnStyle,
                '--horizontalScroll': horizontalScrollStyle,
                '--headerRowSticky': headerRowStickyStyle,
                '--gridNumColumns': numColumns,
                '--gridNumRows': numRows,
                '--gridAlignment': gridAlignment
              },
              children: [showBorders && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("div", {
                className: 'grid-control__border',
                children: table.cells.filter(cell => cell.attributes.border && cell.row_id === '0').map(({
                  table_id,
                  row_id,
                  column_id,
                  cell_id,
                  content,
                  attributes,
                  classes
                }) => {
                  const borderContent = (0,_utils__WEBPACK_IMPORTED_MODULE_13__.setBorderContent)(row_id, column_id, content);
                  const isFirstColumn = column_id === '1' ? true : false;
                  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.Fragment, {
                    children: [isFirstColumn && enableFutureFeatures && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("div", {
                      className: 'grid-control__border-cells'
                    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(Cell, {
                      cellType: "border",
                      dataFormat: columnDataTypes[column_id],
                      cell_id: cell_id,
                      table: table,
                      table_id: table_id,
                      row_id: row_id,
                      column_id: column_id,
                      content: borderContent,
                      attributes: attributes,
                      columnClassNames: '',
                      cellClassNames: classes,
                      onMouseDown: onMouseBorderClick
                    })]
                  }, `border-row:${cell_id}`);
                })
              }), table.rows.filter(row => row.attributes.isHeader === true).map(({
                row_id
              }) => {
                const renderedRow = row_id;
                return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("div", {
                  className: "grid-control__header",
                  style: {
                    '--gridTemplateHeaderRows': gridHeaderRowStyle,
                    '--startGridHeaderRowNbr': startGridHeaderRowNbrStyle,
                    '--endGridHeaderRowNbr': endGridHeaderRowNbrStyle,
                    '--headerBorderTopColor': headerBorderTopColor,
                    '--headerBorderTopStyle': headerBorderTopStyle,
                    '--headerBorderTopWidth': headerBorderTopWidth,
                    '--headerBorderRightColor': headerBorderRightColor,
                    '--headerBorderRightStyle': headerBorderRightStyle,
                    '--headerBorderRightWidth': headerBorderRightWidth,
                    '--headerBorderBottomColor': headerBorderBottomColor,
                    '--headerBorderBottomStyle': headerBorderBottomStyle,
                    '--headerBorderBottomWidth': headerBorderBottomWidth,
                    '--headerBorderLeftColor': headerBorderLeftColor,
                    '--headerBorderLeftStyle': headerBorderLeftStyle,
                    '--headerBorderLeftWidth': headerBorderLeftWidth,
                    '--headerTextAlignment': headerTextAlignmentStyle
                  },
                  children: table.cells.filter(cell => cell.row_id === renderedRow).map(({
                    table_id,
                    row_id,
                    column_id,
                    cell_id,
                    content,
                    attributes,
                    classes
                  }) => {
                    let calculatedClasses = '';
                    const isFirstColumn = column_id === '1' ? true : false;
                    const isBorder = attributes.border;
                    const borderContent = (0,_utils__WEBPACK_IMPORTED_MODULE_13__.setBorderContent)(row_id, column_id, content);
                    const showGridLinesCSS = gridShowInnerLines;
                    const gridLineWidthCSS = gridInnerLineWidth;
                    const isFocused = focusedCell.col === Number(column_id) && focusedCell.row === Number(row_id);
                    if (isFocused) {
                      calculatedClasses = calculatedClasses + 'grid-control__body-cells--focused ';
                    }
                    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.Fragment, {
                      children: [isFirstColumn && isBorder && enableFutureFeatures && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("div", {
                        className: 'grid-control__border-cells'
                      }), isBorder && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(Cell, {
                        cellType: "border",
                        dataFormat: columnDataTypes[column_id],
                        cell_id: cell_id,
                        table: table,
                        table_id: table_id,
                        row_id: row_id,
                        column_id: column_id,
                        content: borderContent,
                        attributes: attributes,
                        columnClassNames: '',
                        cellClassNames: classes,
                        onMouseDown: onMouseBorderClick
                      }), isFirstColumn && enableFutureFeatures && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("div", {
                        className: 'grid-control__header-cells',
                        style: {
                          '--showGridLines': showGridLinesCSS,
                          '--gridLineWidth': gridLineWidthCSS
                        }
                      }), !isBorder && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(Cell, {
                        cellType: 'header',
                        dataFormat: columnDataTypes[column_id],
                        cell_id: cell_id,
                        table_id: table_id,
                        row_id: row_id,
                        column_id: column_id,
                        content: content,
                        attributes: attributes,
                        isFocused: isFocused,
                        columnClassNames: '',
                        cellClassNames: 'grid-control__header-cells ' + 'grid-control__cellEditor ' + classes + calculatedClasses,
                        showGridLinesCSS: showGridLinesCSS,
                        gridLineWidthCSS: gridLineWidthCSS,
                        isEditing: editingCellId === cell_id,
                        onRequestFocus: (col, row) => {
                          setFocusedCell(prev => prev.col === col && prev.row === row ? prev : {
                            col,
                            row
                          });
                          focusCell(col, row);
                        },
                        onRequestEdit: id => {
                          setEditingCellId(id);
                          window.requestAnimationFrame(() => {
                            const wrapper = gridRef.current?.querySelector(`[data-cell-id="${CSS.escape(id)}"]`);
                            wrapper?.querySelector?.('[contenteditable="true"], input, textarea')?.focus?.();
                          });
                        },
                        onRequestStopEdit: () => {
                          setEditingCellId(null);
                          window.requestAnimationFrame(() => {
                            const activeCellId = gridRef.current?.ownerDocument?.activeElement?.closest?.('[data-cell-id]')?.getAttribute?.('data-cell-id');
                            if (activeCellId && String(activeCellId) !== String(cell_id)) {
                              return;
                            }
                            focusCell(Number(column_id), Number(row_id));
                          });
                        },
                        onChange: onChangeCellData
                      })]
                    }, `header-cell:${cell_id}`);
                  })
                }, `header-row:${row_id}`);
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("div", {
                className: 'grid-control__body',
                style: {
                  '--gridTemplateBodyRows': gridBodyRowStyle,
                  '--startGridBodyRowNbr': startGridBodyRowNbrStyle,
                  '--endGridBodyRowNbr': endGridBodyRowNbrStyle,
                  '--bodyBorderTopColor': bodyBorderTopColor,
                  '--bodyBorderTopStyle': bodyBorderTopStyle,
                  '--bodyBorderTopWidth': bodyBorderTopWidth,
                  '--bodyBorderRightColor': bodyBorderRightColor,
                  '--bodyBorderRightStyle': bodyBorderRightStyle,
                  '--bodyBorderRightWidth': bodyBorderRightWidth,
                  '--bodyBorderBottomColor': bodyBorderBottomColor,
                  '--bodyBorderBottomStyle': bodyBorderBottomStyle,
                  '--bodyBorderBottomWidth': bodyBorderBottomWidth,
                  '--bodyBorderLeftColor': bodyBorderLeftColor,
                  '--bodyBorderLeftStyle': bodyBorderLeftStyle,
                  '--bodyBorderLeftWidth': bodyBorderLeftWidth,
                  '--bodyTextAlignment': bodyTextAlignmentStyle
                },
                children: table.rows.filter(row => row.attributes.isHeader !== true && row.row_id !== '0').map(({
                  row_id
                }) => {
                  const renderedRow = row_id;

                  /**
                   * Set calculated class names
                   */
                  let calculatedClasses = '';
                  const bandedRowOffset = enableHeaderRow ? 1 : 0;
                  if (bandedRows && bandedRowOffset == 0 && Number(row_id) % 2 === 0) {
                    calculatedClasses = calculatedClasses + 'grid-control__body-rows--banded-row ';
                  }
                  if (bandedRows && bandedRowOffset == 1 && Number(row_id) > 1 && (Number(row_id) + bandedRowOffset) % 2 === 0) {
                    calculatedClasses = calculatedClasses + 'grid-control__body-rows--banded-row ';
                  }
                  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("div", {
                    className: 'grid-control__body-row ' + calculatedClasses,
                    style: {
                      '--bandedRowTextColor': gridBandedRowTextColor,
                      '--bandedRowBackgroundColor': gridBandedRowBackgroundColor
                    },
                    children: table.cells.filter(cell => cell.row_id === renderedRow).map(({
                      table_id,
                      row_id,
                      column_id,
                      cell_id,
                      content,
                      attributes,
                      classes
                    }) => {
                      /**
                       * Set general processing variables
                       */
                      calculatedClasses = '';
                      const isFirstColumn = column_id === '1' ? true : false;
                      const isBorder = attributes.border;
                      const borderContent = (0,_utils__WEBPACK_IMPORTED_MODULE_13__.setBorderContent)(row_id, column_id, content);
                      const showGridLinesCSS = gridShowInnerLines;
                      const gridLineWidthCSS = gridInnerLineWidth;
                      const isFocused = focusedCell.col === Number(column_id) && focusedCell.row === Number(row_id);
                      if (isFocused) {
                        calculatedClasses = calculatedClasses + 'grid-control__body-cells--focused ';
                      }
                      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.Fragment, {
                        children: [isFirstColumn && isBorder && enableFutureFeatures && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("div", {
                          className: 'grid-control__border-cells'
                        }), isBorder && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(Cell, {
                          cellType: "border",
                          dataFormat: columnDataTypes[column_id],
                          cell_id: cell_id,
                          table: table,
                          table_id: table_id,
                          row_id: row_id,
                          column_id: column_id,
                          content: borderContent,
                          attributes: attributes,
                          columnClassNames: '',
                          cellClassNames: classes,
                          onMouseDown: onMouseBorderClick
                        }), isFirstColumn && !isBorder && enableFutureFeatures && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("div", {
                          className: 'grid-control__body-cells grid-control__body-cells--zoom',
                          style: {
                            '--showGridLines': showGridLinesCSS,
                            '--gridLineWidth': gridLineWidthCSS
                          },
                          "data-col": Number(column_id),
                          "data-row": Number(row_id),
                          tabIndex: isFocused ? 0 : -1,
                          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.Button, {
                            href: "#",
                            icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_9__["default"]
                          })
                        }, cell_id), !isBorder && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(Cell, {
                          cellType: 'body',
                          dataFormat: columnDataTypes[column_id],
                          cell_id: cell_id,
                          table_id: table_id,
                          row_id: row_id,
                          column_id: column_id,
                          content: content,
                          attributes: attributes,
                          isFocused: isFocused,
                          columnClassNames: columnClasses[column_id],
                          cellClassNames: 'grid-control__body-cells ' + 'grid-control__cellEditor ' + classes + calculatedClasses,
                          showGridLinesCSS: showGridLinesCSS,
                          gridLineWidthCSS: gridLineWidthCSS,
                          isEditing: editingCellId === cell_id,
                          onRequestFocus: (col, row) => {
                            setFocusedCell(prev => prev.col === col && prev.row === row ? prev : {
                              col,
                              row
                            });
                            focusCell(col, row);
                          },
                          onRequestEdit: id => {
                            setEditingCellId(id);
                            window.requestAnimationFrame(() => {
                              const wrapper = gridRef.current?.querySelector(`[data-cell-id="${CSS.escape(id)}"]`);
                              wrapper?.querySelector?.('[contenteditable="true"], input, textarea')?.focus?.();
                            });
                          },
                          onRequestStopEdit: () => {
                            setEditingCellId(null);
                            window.requestAnimationFrame(() => {
                              const activeCellId = gridRef.current?.ownerDocument?.activeElement?.closest?.('[data-cell-id]')?.getAttribute?.('data-cell-id');
                              if (activeCellId && String(activeCellId) !== String(cell_id)) {
                                return;
                              }
                              focusCell(Number(column_id), Number(row_id));
                            });
                          },
                          onChange: onChangeCellData
                        })]
                      }, `body-cell:${cell_id}`);
                    })
                  }, `body-row:${row_id}`);
                })
              })]
            })
          })
        })]
      })]
    }), !isNewBlock && tableIsResolving && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.Spinner, {
      children: "Retrieving Table Data"
    }), isNewBlock && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.Placeholder, {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Dynamic Table', 'dynamic-table'),
      icon: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_6__.BlockIcon, {
        icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_8__["default"],
        showColors: true
      }),
      instructions: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Create a new dynamic table.', 'dynamic-table'),
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsxs)("form", {
        className: "blocks-table__placeholder-form",
        onSubmit: onCreateTable,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.__experimentalInputControl, {
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Table Name', 'dynamic-table'),
          placeholder: "New Table",
          required: "true",
          onChange: e => setTableName(e),
          value: tableName,
          className: "blocks-table__placeholder-input"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.__experimentalNumberControl, {
          __nextHasNoMarginBottom: true,
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Table Columns', 'dynamic-table'),
          min: 1,
          required: "true",
          value: numColumns,
          onChange: e => onChangeInitialColumnCount(e),
          className: "blocks-table__placeholder-input"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.__experimentalNumberControl, {
          __nextHasNoMarginBottom: true,
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Table Rows', 'dynamic-table'),
          required: "true",
          min: 1,
          value: numRows,
          onChange: e => onChangeInitialRowCount(e),
          className: "blocks-table__placeholder-input"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.Button, {
          className: "blocks-table__placeholder-button",
          variant: "primary",
          type: "submit",
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Create Table')
        })]
      })
    })]
  });
}

/**
 * Component to render and manage cell content editing
 *
 * Data Shape as follows with date-time as an example
 *
 * Type Registry
 *
 *   TYPES = {
 *     general: {
 *       label: 'Rich Text',
 * 	   },
 *
 *     'date-time': {
 *       label: 'Date/Time',
 *       formats: {
 *         date: { label: 'Date' },
 *         time: { label: 'Time' },
 *         datetime-local: { label: 'Date & Time' },
 *       },
 *     },
 *   }
 *
 *   Column - attributes.columnDataType:
 *	  {
 *        Date/Time Example
 *
 *		  type: 'date-time',
 *		  settings: {
 *			  format: 'date',
 *			  defaultToToday: false,
 *	  },
 *
 *   Cell - Content:
 *     Raw content value (example 10/1/2025)
 *
 *   Cell - attributes.value:
 *   {
 *        Column columnDataType may be included only if an override is permitted
 *        for this data type AND an override exists for this particular cell
 *        overrides: {...}
 *
 * 		  meta: {
 *            label: 'My Date',
 * 		      size: 'My Size',
 *        },
 * 		  // Dependencies on other objects external to Cell. Example for post
 * 	  	  ref: {
 * 			  kind: 'post',
 * 			  id: 45,
 * 		  },
 * 		  // search support
 * 		  indexText: 'optimized for web search, all text only' (example 2025-10-01),
 *   }
 *
 * @since 1.1.1
 * @since 1.2.0  Added column data type logic and Date/Time render
 *
 * @param {Object} props Passed attributes
 * @return {Object} events for cell content editing
 */
function Cell(props) {
  const {
    cellType,
    dataFormat,
    table,
    row_id,
    cell_id,
    table_id,
    column_id,
    content,
    attributes,
    isFocused,
    columnClassNames,
    cellClassNames,
    showGridLinesCSS,
    gridLineWidthCSS,
    onChange,
    onMouseDown,
    isEditing,
    onRequestEdit,
    onRequestStopEdit,
    onRequestFocus
  } = props;
  const {
    type,
    settings
  } = (0,_utils__WEBPACK_IMPORTED_MODULE_13__.normalizeColumnDataType)(dataFormat);
  const [inputType, setInputType] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(() => settings?.format || 'date');
  const [cellContent, setCellContent] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)();
  const initialCellValue = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useRef)(content);
  const [cellAttributes, setCellAttributes] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(attributes);
  const htmlToText = (html = '') => (0,_wordpress_rich_text__WEBPACK_IMPORTED_MODULE_7__.getTextContent)((0,_wordpress_rich_text__WEBPACK_IMPORTED_MODULE_7__.create)({
    html
  })).replace(/\s+/g, ' ').trim();
  const numberDisplayValue = (0,_utils__WEBPACK_IMPORTED_MODULE_13__.formattedNumber)(cellContent, inputType, settings?.formatOptions?.thousandSeparator, settings?.formatOptions?.decimalPlaces, settings?.formatOptions?.showCurrencySymbol);
  const sanitizedNumber = (0,_utils__WEBPACK_IMPORTED_MODULE_13__.sanitizeNumberInput)(cellContent, inputType);
  const redNegativeNumber = settings?.formatOptions?.redNegative && sanitizedNumber !== '' && sanitizedNumber !== '-' && Number(sanitizedNumber) < 0;
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
    setCellAttributes(attributes);
    initialCellValue.current = content ?? '';

    // Default behavior: raw content as-is
    setCellContent(content ?? '');
  }, [content, attributes]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
    if (cellType !== 'body' || type !== 'date-time') return;
    const resolvedFormat = inputType || 'date';
    // const resolvedFormat = settings?.format || 'date';

    if (isEditing) {
      // Enter edit mode: force a valid HTML input value FIRST
      if (cellType === 'body' && type === 'date-time') {
        setInputType(resolvedFormat);
        const raw = content ?? initialCellValue.current ?? '';
        if (raw) {
          setCellContent((0,_utils__WEBPACK_IMPORTED_MODULE_13__.formattedIsoDate)(raw, resolvedFormat));
        } else if (settings?.defaultToToday) {
          setCellContent((0,_utils__WEBPACK_IMPORTED_MODULE_13__.formattedIsoDate)('', resolvedFormat));
        } else {
          setCellContent('');
        }
      }
    } else {
      const raw = content ?? '';
      setCellContent(raw ? (0,_utils__WEBPACK_IMPORTED_MODULE_13__.formatedDisplayDate)(raw, resolvedFormat) : '');
    }
    setCellAttributes(attributes);
    initialCellValue.current = content ?? '';
  }, [isEditing, content, attributes, cellType, type, inputType, settings?.defaultToToday]);

  /**
   * Handle onChange event for cell content update
   *
   * @since 1.1.1
   * @since 1.2.0   Converted input to object to update multiple fields
   *
   * @param {Object} patch event data
   */
  function updateCellData(patch) {
    initialCellValue.current = patch.content;
    if (patch.content !== undefined) setCellContent(patch.content);
    if (patch.attributes !== undefined) setCellAttributes(patch.attributes);
    onChange(table_id, cell_id, patch);
  }

  /**
   * Support key press overrides for date/time input
   *
   * @since 1.2.2
   *
   * @param {Object} event Key press event
   */
  function onDateTimeKeyDown(event) {
    const key = String(event.key || '').toLowerCase();
    if ((inputType === 'time' || inputType === 'datetime-local') && (key === 'a' || key === 'p')) {
      const currentValue = event.currentTarget?.value ?? cellContent ?? '';
      const nextValue = applyMeridiemShortcut(currentValue, inputType, key);
      if (nextValue !== currentValue) {
        event.preventDefault();
        event.stopPropagation();
        setCellContent(nextValue);
      }
    }
  }

  /**
   * Support key press overrides for date/time input
   *
   * @since 1.2.2
   *
   * @param {string} currentCellContent Cell contents
   * @param {string} format             Date/Time format
   * @param {string} keyValue           Key press value
   * @return {string} Updated input value
   */
  function applyMeridiemShortcut(currentCellContent, format, keyValue) {
    if (!currentCellContent || format !== 'time' && format !== 'datetime-local') {
      return currentCellContent;
    }
    const isPm = keyValue === 'p';
    if (format === 'time') {
      const match = /^(\d{2}):(\d{2})(:\d{2})?$/.exec(currentCellContent);
      if (!match) return currentCellContent;
      let hours = Number(match[1]);
      if (!Number.isFinite(hours)) return currentCellContent;
      if (isPm && hours < 12) hours += 12;
      if (!isPm && hours >= 12) hours -= 12;
      return `${String(hours).padStart(2, '0')}:${match[2]}${match[3] || ''}`;
    }
    const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(:\d{2})?$/.exec(currentCellContent);
    if (!match) return currentCellContent;
    let hours = Number(match[2]);
    if (!Number.isFinite(hours)) return currentCellContent;
    if (isPm && hours < 12) hours += 12;
    if (!isPm && hours >= 12) hours -= 12;
    return `${match[1]}T${String(hours).padStart(2, '0')}:${match[3]}${match[4] || ''}`;
  }

  /**
   * Change number string from entry
   *
   * @since 1.2.4
   *
   * @param {Object} event New number string
   */
  function onNumberChange(event) {
    const nextRawValue = (0,_utils__WEBPACK_IMPORTED_MODULE_13__.sanitizeNumberInput)(event, inputType);
    let returnedRawValue = nextRawValue;
    if (inputType !== 'integer') {
      const [integerPart, fractionPart = ''] = nextRawValue.split('.');
      const fractionalExcessLength = fractionPart.length - settings?.formatOptions?.decimalPlaces;
      if (fractionalExcessLength > 0) {
        returnedRawValue = `${integerPart}.${fractionPart.slice(0, settings?.formatOptions?.decimalPlaces)}`;
      }
      if (fractionalExcessLength < 0) {
        const paddedSpaces = fractionalExcessLength * -1;
        returnedRawValue = `${integerPart}.${fractionPart.padEnd(paddedSpaces, '0')}`;
      }
    }
    setCellContent(returnedRawValue);
    updateCellData({
      content: returnedRawValue,
      attributes: {
        ...cellAttributes,
        value: {
          ...(cellAttributes?.value || {}),
          indexText: returnedRawValue
        }
      }
    });

    // setNumberRawValue(returnedRawValue);
  }

  /**
   * Relay mouse down event for border cells
   *
   * @since 1.2.0
   *
   * @param {number} column_id Clicked table row
   * @param {number} row_id    Clicked table row
   * @param {Object} table     Current Dynamic Table
   * @param {Object} e         Border click event object
   */
  function passMouseBorderClick(column_id, row_id, table, e) {
    onMouseDown(column_id, row_id, table, e);
  }

  /**
   * React HTML to render a cell based on its type
   *
   * @since 1.1.1
   * @since 1.2.0    Add DateTime render type
   *
   * @param {Object} e On Focus event
   * @return {void}
   */
  const renderTypes = {
    richText: () => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_6__.RichText, {
      tagName: "div",
      value: cellContent,
      readOnly: !isEditing,
      onChange: !isEditing ? undefined : next => {
        const plainText = htmlToText(next);
        updateCellData({
          content: next,
          attributes: {
            ...cellAttributes,
            value: {
              ...(cellAttributes?.value || {}),
              indexText: plainText
            }
          }
        });
      }
    }),
    border: () => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("div", {
      children: cellContent
    }),
    dateTime: () => {
      if (!isEditing) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("div", {
          children: cellContent
        });
      }
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.TextControl
      // className="grid-control__cellEditor--dateTimeInput"
      , {
        className: renderClasses,
        type: inputType,
        __next40pxDefaultSize: true,
        value: cellContent,
        onKeyDown: event => {
          onDateTimeKeyDown(event);
        },
        onChange: next => {
          setCellContent(next);
        },
        onBlur: event => {
          const format = settings?.format || inputType || 'date';
          const next = event?.target?.value ?? cellContent ?? '';
          const formattedContent = (0,_utils__WEBPACK_IMPORTED_MODULE_13__.formattedIsoDate)(next, format);
          updateCellData({
            content: next,
            attributes: {
              ...cellAttributes,
              value: {
                ...(cellAttributes?.value || {}),
                indexText: formattedContent
              }
            }
          });
          onRequestStopEdit?.();
        }
      });
    },
    number: () => {
      if (!isEditing) {
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("div", {
          children: numberDisplayValue
        });
      }
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_5__.TextControl, {
        className: renderClassesEdit,
        type: 'text',
        inputMode: inputType === 'integer' ? 'numeric' : 'decimal',
        __next40pxDefaultSize: true,
        value: numberDisplayValue
        // onKeyDown={event => {
        // 	onDateTimeKeyDown(event);
        // }}
        ,
        onChange: event => {
          onNumberChange(event);
        }
        // onBlur={event => {
        // 	const format = settings?.format || inputType || 'date';
        // 	const next = event?.target?.value ?? cellContent ?? '';
        // 	const formattedContent = formattedIsoDate(next, format);
        // 	updateCellData({
        // 		content: next,
        // 		attributes: {
        // 			...cellAttributes,
        // 			value: {
        // 				...(cellAttributes?.value || {}),
        // 				indexText: formattedContent,
        // 			},
        // 		},
        // 	});
        // 	onRequestStopEdit?.();
        // }}
      });
      // return <div>Number Content</div>
    }
  };
  let renderPipeline = [];
  switch (cellType) {
    case 'border':
      renderPipeline = ['border'];
      break;
    case 'header':
      renderPipeline = ['richText'];
      break;
    case 'body':
      switch (type) {
        case 'general':
          renderPipeline = ['richText'];
          break;
        case 'border':
          renderPipeline = ['border'];
          break;
        case 'date-time':
          renderPipeline = ['dateTime'];
          break;
        case 'number':
          renderPipeline = ['number'];
          break;
        default:
          break;
      }
      break;
    default:
      break;
  }

  // console.log('column classes = ', columnClassNames);
  const renderClassesDisplay = (0,clsx__WEBPACK_IMPORTED_MODULE_10__["default"])(columnClassNames, cellClassNames, {
    'grid-control__cellEditor--dateTimeInput': cellType === 'body' || type === 'date-time',
    'grid-control__body-columns--number-red': redNegativeNumber
  });
  const renderClassesEdit = (0,clsx__WEBPACK_IMPORTED_MODULE_10__["default"])(columnClassNames, {
    'grid-control__cellEditor--dateTimeInput': cellType === 'body' || type === 'date-time',
    'grid-control__body-columns--number-red': redNegativeNumber
  });
  const isBorderCell = cellType === 'border';
  const computedTabIndex = !isBorderCell && isFocused ? 0 : -1;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)("div", {
    "data-cell-id": cell_id,
    "data-col": Number(column_id),
    "data-row": Number(row_id),
    tabIndex: computedTabIndex,
    className: renderClassesDisplay,
    style: cellType === 'border' ? undefined : {
      '--showGridLines': showGridLinesCSS,
      '--gridLineWidth': gridLineWidthCSS
    },
    onMouseDown: e => {
      if (cellType === 'border') {
        passMouseBorderClick(column_id, row_id, table, e);
        return;
      }
      if (isEditing) return;
      e.preventDefault();
      e.stopPropagation();
      onRequestFocus?.(Number(column_id), Number(row_id));
    },
    onDoubleClick: e => {
      if (cellType === 'border') return;
      e.preventDefault();
      onRequestEdit?.(cell_id);
    },
    children: renderPipeline.map(key => {
      const renderPart = renderTypes[key];
      if (!renderPart) {
        return null;
      }

      // Stable key in React list:
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_18__.jsx)(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.Fragment, {
        children: renderPart()
      }, key);
    })
  });
}

/***/ },

/***/ "./src/hooks.js"
/*!**********************!*\
  !*** ./src/hooks.js ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   useEditorIdentity: () => (/* binding */ useEditorIdentity),
/* harmony export */   useNotInInserterPreview: () => (/* binding */ useNotInInserterPreview),
/* harmony export */   usePostChangesSaved: () => (/* binding */ usePostChangesSaved)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/compose */ "@wordpress/compose");
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_compose__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_2__);




/**
 * Returns `true` if post changes are saved, otherwise `false`.
 *
 * @since    1.0.0
 *
 * @return {boolean} Are post changes saved
 */
const usePostChangesSaved = () => {
  const [areChangesSaved, setAreChangesSaved] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const {
    hasUnsavedChanges
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_2__.useSelect)(select => {
    return {
      hasUnsavedChanges: select('core/editor').isEditedPostDirty()
    };
  });
  const hadUnsavedChanges = (0,_wordpress_compose__WEBPACK_IMPORTED_MODULE_1__.usePrevious)(hasUnsavedChanges);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!hasUnsavedChanges && hadUnsavedChanges) {
      setAreChangesSaved(true);
    }
    if (hasUnsavedChanges) {
      setAreChangesSaved(false);
    }
  }, [hasUnsavedChanges, hadUnsavedChanges]);
  return areChangesSaved;
};

/**
 * Returns the current post ID and post type from the block.
 *
 * @since    1.1.0
 *
 * @param {Array} props
 * @return {Object} Post ID and post type
 */
function useEditorIdentity(props) {
  var _ref, _ref2;
  const context = props.context || {};
  const contextPostId = context.postId;
  const contextPostType = context.postType;
  const {
    storePostId,
    storePostType
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_2__.useSelect)(select => {
    // Retrieve postId and postType from the editor.
    const editor = select('core/editor');
    const editorPostId = editor?.getCurrentPostId?.();
    const editorPostType = editor?.getCurrentPostType?.();
    if (editorPostId && editorPostType) {
      return {
        storePostId: editorPostId,
        storePostType: editorPostType
      };
    }

    // Legacy fallback for Site Editor to retrieve postId and postType when current Wordpress
    // version < 6.8. These values were previously stored in site editor.
    const editSite = select('core/edit-site');
    return {
      storePostId: editSite?.getEditedPostId?.(),
      storePostType: editSite?.getEditedPostType?.()
    };
  }, []);

  // Choose context first, then store, then fallback.
  const postId = (_ref = contextPostId !== null && contextPostId !== void 0 ? contextPostId : storePostId) !== null && _ref !== void 0 ? _ref : 0;
  const postType = (_ref2 = contextPostType !== null && contextPostType !== void 0 ? contextPostType : storePostType) !== null && _ref2 !== void 0 ? _ref2 : '';
  return {
    postId,
    postType
  };
}

/**
 * Identifies when the inserter panel is open, but not necessarily if the
 * block is just in preview.
 *
 * @since    1.1.0
 *
 * @return {boolean} Is block editor inserter panel open
 */
function useNotInInserterPreview() {
  return (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_2__.useSelect)(select => {
    const be = select('core/block-editor');
    const settings = be?.getSettings?.() || {};

    // Your debug shows these are true in the pattern list preview renderer.
    const isPreview = !!settings.isPreviewMode || !!settings.__unstableIsPreviewMode || !!settings.__experimentalIsPreviewMode;
    return !isPreview;
  }, []);
}

/***/ },

/***/ "./src/index.js"
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/blocks */ "@wordpress/blocks");
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./style.scss */ "./src/style.scss");
/* harmony import */ var _edit__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./edit */ "./src/edit.js");
/* harmony import */ var _block_json__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./block.json */ "./src/block.json");




(0,_wordpress_blocks__WEBPACK_IMPORTED_MODULE_0__.registerBlockType)(_block_json__WEBPACK_IMPORTED_MODULE_3__.name, {
  apiVersion: 3,
  edit: _edit__WEBPACK_IMPORTED_MODULE_2__["default"],
  save(props) {
    return null;
  }
});

/***/ },

/***/ "./src/style.js"
/*!**********************!*\
  !*** ./src/style.js ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   endGridRowNbr: () => (/* binding */ endGridRowNbr),
/* harmony export */   getBorderStyle: () => (/* binding */ getBorderStyle),
/* harmony export */   getBorderStyleType: () => (/* binding */ getBorderStyleType),
/* harmony export */   getGridHeaderBackgroundColorStyle: () => (/* binding */ getGridHeaderBackgroundColorStyle),
/* harmony export */   getHeaderTextAlignmentStyle: () => (/* binding */ getHeaderTextAlignmentStyle),
/* harmony export */   gridBandedRowBackgroundColorStyle: () => (/* binding */ gridBandedRowBackgroundColorStyle),
/* harmony export */   gridBandedRowTextColorStyle: () => (/* binding */ gridBandedRowTextColorStyle),
/* harmony export */   gridInnerBorderStyle: () => (/* binding */ gridInnerBorderStyle),
/* harmony export */   gridInnerBorderWidthStyle: () => (/* binding */ gridInnerBorderWidthStyle),
/* harmony export */   processBodyRows: () => (/* binding */ processBodyRows),
/* harmony export */   processColumns: () => (/* binding */ processColumns),
/* harmony export */   processHeaderRow: () => (/* binding */ processHeaderRow),
/* harmony export */   startGridRowNbr: () => (/* binding */ startGridRowNbr)
/* harmony export */ });
/**
 * Establish grid css grid-template-columns based upon attributes associated with columns
 *
 * @since    1.0.0
 *
 * @param {boolean}      isNewBlock           Has the block been newly created and not yet persisted?
 * @param {boolean}      tableIsResolving     Are we still waiting for table to finish resolving?
 * @param {boolean}      enableFutureFeatures Include features intended for a future release?
 * @param {Array|Object} columns              Table columns
 * @return {string} Value for grid-template-columns css attribute
 */

function processColumns(isNewBlock, tableIsResolving, enableFutureFeatures, columns) {
  if (isNewBlock || tableIsResolving) {
    return undefined;
  }
  let newGridColumnStyle = '';
  {
    columns.map(({
      column_id,
      column_name,
      attributes,
      classes
    }) => {
      const {
        columnWidthType,
        minWidth,
        minWidthUnits,
        maxWidth,
        maxWidthUnits,
        fixedWidth,
        fixedWidthUnits,
        disableForTablet,
        disableForPhone
      } = attributes;
      let sizing = '';
      if (column_id === '1' && enableFutureFeatures) {
        newGridColumnStyle = newGridColumnStyle + '40px ';
      }
      switch (columnWidthType) {
        case 'Proportional':
          {
            if (minWidth > 0) {
              sizing = 'minmax(' + minWidth + minWidthUnits + ', ' + maxWidth + 'fr) ';
            } else
              // sizing = '1fr '
              sizing = maxWidth + 'fr ';
            newGridColumnStyle = newGridColumnStyle + sizing;
            break;
          }
        case 'Auto':
          {
            newGridColumnStyle = newGridColumnStyle + 'auto ';
            break;
          }
        case 'Fixed':
          {
            newGridColumnStyle = newGridColumnStyle + fixedWidth + fixedWidthUnits + ' ';
            break;
          }
        case 'Custom':
          {
            sizing = 'minmax(' + minWidth + minWidthUnits + ', ' + maxWidth + maxWidthUnits + ') ';
            newGridColumnStyle = newGridColumnStyle + sizing;
            break;
          }
        default:
          console.log('Unrecognized Attibute Type');
      }
    });
  }
  return newGridColumnStyle;
}

/**
 * Establish grid css grid-template-rows based upon attributes associated with header row(s).
 *
 * @since    1.0.0
 *
 * @param {boolean}      isNewBlock       Has the block been newly created and not yet persisted?
 * @param {boolean}      tableIsResolving Are we still waiting for table to finish resolving?
 * @param {Array|Object} rows             Table rows
 * @return {string} Value for grid-template-rows css attribute in header rows
 */
function processHeaderRow(isNewBlock, tableIsResolving, rows) {
  if (isNewBlock || tableIsResolving) {
    return undefined;
  }
  let newGridRowStyle = '';
  {
    rows.map(({
      row_id,
      attributes,
      classes
    }) => {
      const {
        rowHeightType,
        minHeight,
        minHeightUnits,
        maxHeight,
        maxHeightUnits,
        fixedHeight,
        fixedHeightUnits,
        isHeader
      } = attributes;
      let sizing = '';
      if (isHeader) {
        switch (rowHeightType) {
          case 'Auto':
            {
              newGridRowStyle = newGridRowStyle + 'auto ';
              break;
            }
          case 'Fixed':
            {
              newGridRowStyle = newGridRowStyle + fixedHeight + fixedHeightUnits + ' ';
              break;
            }
          case 'Custom':
            {
              sizing = 'minmax(' + minHeight + minHeightUnits + ', ' + maxHeight + maxHeightUnits + ') ';
              newGridRowStyle = newGridRowStyle + sizing;
              break;
            }
          default:
            console.log('Unrecognized Attibute Type');
        }
      }
    });
  }
  return newGridRowStyle;
}

/**
 * Establish grid css grid-template-rows based upon attributes associated with body row(s).
 *
 * @since    1.0.0
 *
 * @param {boolean}      isNewBlock       Has the block been newly created and not yet persisted?
 * @param {boolean}      tableIsResolving Are we still waiting for table to finish resolving?
 * @param {Array|Object} rows             Table rows
 * @return {string} Value for grid-template-rows css attribute in body rows
 */
function processBodyRows(isNewBlock, tableIsResolving, rows) {
  if (isNewBlock || tableIsResolving) {
    return undefined;
  }
  let newGridRowStyle = '';
  {
    rows.map(({
      row_id,
      attributes,
      classes
    }) => {
      const {
        rowHeightType,
        minHeight,
        minHeightUnits,
        maxHeight,
        maxHeightUnits,
        fixedHeight,
        fixedHeightUnits,
        isHeader
      } = attributes;
      let sizing = '';
      if (!isHeader) {
        switch (rowHeightType) {
          case 'Auto':
            {
              newGridRowStyle = newGridRowStyle + 'auto ';
              break;
            }
          case 'Fixed':
            {
              newGridRowStyle = newGridRowStyle + fixedHeight + fixedHeightUnits + ' ';
              break;
            }
          case 'Custom':
            {
              sizing = 'minmax(' + minHeight + minHeightUnits + ', ' + maxHeight + maxHeightUnits + ') ';
              newGridRowStyle = newGridRowStyle + sizing;
              break;
            }
          default:
            console.log('Unrecognized Attibute Type');
        }
      }
    });
  }
  return newGridRowStyle;
}

/**
 * Create Styling Variable for the text color in banded rows.
 *
 * @since    1.0.0
 *
 * @param {boolean} isNewBlock       Has the block been newly created and not yet persisted?
 * @param {boolean} tableIsResolving Are we still waiting for table to finish resolving?
 * @param {string}  color            Color code associated with the banded row text
 * @return {string} CSS color code
 */
function gridBandedRowTextColorStyle(isNewBlock, tableIsResolving, color) {
  if (isNewBlock || tableIsResolving) {
    return undefined;
  }
  return color;
}

/**
 * Create Styling Variable for the background color in banded rows.
 *
 * @since    1.0.0
 *
 * @param {boolean} isNewBlock       Has the block been newly created and not yet persisted?
 * @param {boolean} tableIsResolving Are we still waiting for table to finish resolving?
 * @param {string}  color            Color code associated with the banded row background color
 * @return {string} CSS color code
 */
function gridBandedRowBackgroundColorStyle(isNewBlock, tableIsResolving, color) {
  if (isNewBlock || tableIsResolving) {
    return undefined;
  }
  return color;
}

/**
 * Create Styling Variable for the header background color.
 *
 * @since    1.0.0
 *
 * @param {boolean} isNewBlock       Has the block been newly created and not yet persisted?
 * @param {boolean} tableIsResolving Are we still waiting for table to finish resolving?
 * @param {string}  tableColor       Color code associated with table header color if populated
 * @param {string}  blockColor       Color code associated with block
 * @return {string} Value for header background-color
 */
function getGridHeaderBackgroundColorStyle(isNewBlock, tableIsResolving, tableColor, blockColor) {
  if (isNewBlock || tableIsResolving) {
    return undefined;
  }
  if (tableColor) {
    return tableColor;
  }
  return blockColor;
}

/**
 * Create Styling Variable for showing inner grid borders/lines.
 *
 * @since    1.0.0
 *
 * @param {boolean} isNewBlock       Has the block been newly created and not yet persisted?
 * @param {boolean} tableIsResolving Are we still waiting for table to finish resolving?
 * @param {boolean} showGridLines    Do we render grid lines
 * @return {string} CSS value to show vs. hide table inside grid (border) lines
 */
function gridInnerBorderStyle(isNewBlock, tableIsResolving, showGridLines) {
  if (isNewBlock || tableIsResolving) {
    return undefined;
  }
  if (showGridLines) {
    return 'solid';
  }
  return 'hidden';
}

/**
 * Create Styling Variable for inner grid borders/lines width.
 *
 * @since    1.0.0
 *
 * @param {boolean} isNewBlock       Has the block been newly created and not yet persisted?
 * @param {boolean} tableIsResolving Are we still waiting for table to finish resolving?
 * @param {boolean} showGridLines    Do we render grid lines
 * @param {string}  gridLineWidth    Number of pixels for grid line width
 * @return  {string} CSS value for border width
 */
function gridInnerBorderWidthStyle(isNewBlock, tableIsResolving, showGridLines, gridLineWidth) {
  if (isNewBlock || tableIsResolving) {
    return undefined;
  }
  if (!showGridLines) {
    return '0px';
  }
  return String(gridLineWidth) + 'px';
}

/**
 * CSS starting grid row line number for body rows.
 *
 * @since    1.0.0
 *
 * @param {boolean} enableHeader Does the table contain a header row?
 * @param {boolean} showBorders  Are borders to be displayed?
 * @return  {number} First body row number
 */
function startGridRowNbr(enableHeader, showBorders) {
  let startGridLine = 1;
  startGridLine = enableHeader ? startGridLine + 1 : startGridLine;
  startGridLine = showBorders ? startGridLine + 1 : startGridLine;
  return startGridLine;
}

/**
 * CSS ending grid row line number.
 *
 * @since    1.0.0
 *
 * @param {number}  startGridLine Starting line number for the row group
 * @param {string}  rowGroup      Header or Body
 * @param {number}  numRows       Total number of grid rows in this row group
 * @param {boolean} enableHeader  Does the table contain a header row(s)?
 * @param {boolean} showBorders   Are borders to be displayed?
 * @param {boolean} enableFooter  Does the table contain a footer row(s)?
 * @return  {number} Line number of ending grid row
 */
function endGridRowNbr(startGridLine, rowGroup, numRows, enableHeader, showBorders, enableFooter // Always false.  Reserved for future functionality
) {
  let endGridLine;
  switch (rowGroup) {
    case 'Header':
      {
        endGridLine = 2;
        endGridLine = showBorders ? endGridLine++ : endGridLine;
        break;
      }
    case 'Body':
      {
        endGridLine = startGridLine + numRows;
        endGridLine = showBorders ? endGridLine++ : endGridLine;
        endGridLine = enableHeader ? endGridLine - 1 : endGridLine;
        endGridLine = enableFooter ? endGridLine - 1 : endGridLine;
        break;
      }
    default:
      console.log('Unknown row type');
  }
  return endGridLine;
}
function getHeaderTextAlignmentStyle(isNewBlock, tableIsResolving, textAlignment) {
  if (isNewBlock || tableIsResolving) {
    return undefined;
  }
  return textAlignment;
}

/**
 * Determine whether the border is styled differently or the same for each side of the border.
 *
 * The BorderBoxControl stores the syle values as a flat object (simple) or as nested objects
 * (complex).  We evaluate the object value to determine which type it is.
 *
 * @since    1.0.0
 *
 * @param {Object} border Border style definition
 * @return {string} Border type (flat vs. split)
 */
function getBorderStyleType(border) {
  if (border) {
    const borderWrapper = Object.entries(border);
    for (let i = 0; i < borderWrapper.length; i++) {
      if (borderWrapper[i].some(value => {
        return typeof value == 'object';
      })) {
        return 'split';
      }
    }
    return 'flat';
  }
  return 'unknown';
}

/**
 * Get the border style, color, and width of the specified border segment.
 *
 * @since    1.0.0
 *
 * @param {Object} border          Border style definition
 * @param {string} borderLocation  The specified border segment (top | right | bottom | left)
 * @param {string} borderAttribute The attribute to be styled (style | color | width)
 * @param {string} borderType      Whether the border is the same on all side (flat) or different (split)
 * @return {string} CSS value for the requested attribute
 */
function getBorderStyle(border, borderLocation, borderAttribute, borderType) {
  switch (borderType) {
    case 'split':
      {
        return border[borderLocation][borderAttribute];
      }
    case 'flat':
      {
        return border[borderAttribute];
      }
    default:
      {
        switch (borderAttribute) {
          case 'color':
            {
              return 'black';
            }
          case 'style':
            {
              return 'solid';
            }
          case 'width':
            {
              return '1px';
            }
        }
      }
  }
}

/***/ },

/***/ "./src/table-defaults.js"
/*!*******************************!*\
  !*** ./src/table-defaults.js ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDefaultCell: () => (/* binding */ getDefaultCell),
/* harmony export */   getDefaultColumn: () => (/* binding */ getDefaultColumn),
/* harmony export */   getDefaultRow: () => (/* binding */ getDefaultRow),
/* harmony export */   getDefaultTableAttributes: () => (/* binding */ getDefaultTableAttributes),
/* harmony export */   getDefaultTableClasses: () => (/* binding */ getDefaultTableClasses),
/* harmony export */   initTable: () => (/* binding */ initTable),
/* harmony export */   initTableCells: () => (/* binding */ initTableCells)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./src/utils.js");
/* Internal dependencies */


/**
 * Create a new dynamic table
 *
 * @since    1.0.0
 *
 * @param {string} newBlockTableRef Block table cross reference unique string
 * @param {number} columnCount      Number of columns to include in the table
 * @param {number} rowCount         Number of rows to include in the table
 * @param {string} tableName        Name of the new table
 * @return  {Object} New Dynamic Table
 */
function initTable(newBlockTableRef, columnCount, rowCount, tableName) {
  const tableCells = initTableCells(Number(columnCount), Number(rowCount));
  const rowArray = [];
  for (let i = 1; i <= rowCount; i++) {
    const row = getDefaultRow('0', i);
    rowArray.push(row);
  }
  const columnArray = [];
  for (let i = 1; i <= columnCount; i++) {
    const column = getDefaultColumn('0', i);
    columnArray.push(column);
  }
  const newTable = {
    table: {
      table_id: '0',
      block_table_ref: newBlockTableRef,
      post_id: '0',
      table_status: 'new',
      table_name: tableName,
      attributes: getDefaultTableAttributes('table'),
      classes: getDefaultTableClasses('table'),
      rows: rowArray,
      columns: columnArray,
      cells: tableCells
    }
  };
  return newTable;
}

/**
 * Build an array of table cells using default attribute values.
 *
 * @since    1.0.0
 *
 * @param {number} init_num_columns
 * @param {number} init_num_rows
 * @return  {Array} Array of cells associated with the new table
 */
function initTableCells(init_num_columns, init_num_rows) {
  const tableCells = [];
  let x = 1;
  let y = 1;
  while (y <= init_num_rows) {
    while (x <= init_num_columns) {
      if (y == 1) {
        const cell = getDefaultCell('0', String(x), String(y));
        tableCells.push(cell);
      } else {
        const cell = getDefaultCell('0', String(x), String(y));
        tableCells.push(cell);
      }
      x++;
    }
    x = 1;
    y++;
  }
  return tableCells;
}

/**
 * Get a new row with default values.
 *
 * @since    1.0.0
 *
 * @param {number} tableId     Table id to assign to row
 * @param {number} rowId       Row id to assign to row
 * @param {string} rowLocation Border or another value, default = body
 * @return  {Array} New table row
 */
function getDefaultRow(tableId, rowId, rowLocation = 'Body') {
  let row;
  if (rowLocation === 'Border') {
    row = {
      table_id: String(tableId),
      row_id: String(rowId),
      attributes: getDefaultTableAttributes('rows', rowLocation),
      classes: getDefaultTableClasses('rows')
    };
  } else {
    row = {
      table_id: String(tableId),
      row_id: String(rowId),
      attributes: getDefaultTableAttributes('rows', rowLocation),
      classes: getDefaultTableClasses('rows')
    };
  }
  return row;
}

/**
 * Get a new column with default values.
 *
 * @since    1.0.0
 *
 * @param {number} tableId        Table id to assign to column
 * @param {number} columnId       Column id to assign to column
 * @param {string} columnLocation Border or another value, default = body
 * @return  {Array} New table column
 */
function getDefaultColumn(tableId, columnId, columnLocation = 'Body') {
  let column;
  if (columnLocation === 'Border') {
    column = {
      table_id: String(tableId),
      column_id: String(columnId),
      column_name: 'Border',
      attributes: getDefaultTableAttributes('columns', columnLocation),
      classes: ''
    };
  } else {
    column = {
      table_id: String(tableId),
      column_id: String(columnId),
      column_name: 'Comments',
      attributes: getDefaultTableAttributes('columns', columnLocation),
      classes: getDefaultTableClasses('columns')
    };
  }
  return column;
}

/**
 * Get a new cell with default values.
 *
 * @since    1.0.0
 *
 * @param {number} tableId      Table id to assign to cell
 * @param {number} columnId     Column id to assign to column
 * @param {number} rowId        Row id to assign to row
 * @param {string} cellLocation Border or another value, default = body
 * @return {Array} New table cell
 */
function getDefaultCell(tableId, columnId, rowId, cellLocation = 'Body') {
  let cell;
  const columnLetter = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.numberToLetter)(columnId);
  const borderContent = rowId == 0 ? columnLetter : String(rowId);
  if (cellLocation === 'Border') {
    cell = {
      table_id: String(tableId),
      column_id: String(columnId),
      row_id: String(rowId),
      cell_id: rowId === 0 ? columnLetter + '0' : '0' + String(rowId),
      attributes: getDefaultTableAttributes('cells', cellLocation),
      classes: 'grid-control__border-cells hover',
      content: borderContent
    };
  } else {
    cell = {
      table_id: String(tableId),
      column_id: String(columnId),
      row_id: String(rowId),
      cell_id: columnLetter + rowId,
      attributes: getDefaultTableAttributes('cells', cellLocation),
      classes: getDefaultTableClasses('cells'),
      content: ''
    };
  }
  return cell;
}

/**
 * Get default attributes for a specific table part.
 *
 * @since    1.0.0
 *
 * @param {string} tableComponent    table header, rows, column, cell
 * @param {string} componentLocation Border or another value, default = body
 * @return {Object} Attributes
 */
function getDefaultTableAttributes(tableComponent, componentLocation = 'Body') {
  const tableBaseAttributes = {
    showGridLines: true,
    bandedRows: false,
    bandedRowBackgroundColor: '#d8dbda',
    bandedTextColor: '#d8dbda',
    gridLineWidth: 1,
    allowHorizontalScroll: true,
    enableHeaderRow: false,
    headerAlignment: 'center',
    headerRowSticky: false,
    headerBorder: {
      color: 'black',
      style: 'solid',
      width: '1px'
    },
    horizontalAlignment: 'none',
    bodyAlignment: undefined,
    bodyBorder: {
      color: 'black',
      style: 'solid',
      width: '1px'
    },
    verticalAlignment: 'none',
    hideTitle: true
  };
  const columnAttributes = {
    columnDataType: {
      type: 'general'
    },
    columnWidthType: 'Proportional',
    minWidth: 2,
    minWidthUnits: 'ch',
    maxWidth: 1,
    maxWidthUnits: 'fr',
    fixedWidth: 1,
    fixedWidthUnits: 'fr',
    disableForTablet: false,
    disableForPhone: false,
    isFixedLeftColumnGroup: false,
    horizontalAlignment: 'none'
  };
  const columnBorderAttributes = {
    columnDataType: {
      type: 'border'
    },
    columnWidthType: 'Fixed',
    minWidth: 0,
    minWidthUnits: '',
    maxWidth: 0,
    maxWidthUnits: '',
    fixedWidth: 28,
    fixedWidthUnits: 'px',
    disableForTablet: false,
    disableForPhone: false,
    isFixedLeftColumnGroup: false,
    horizontalAlignment: 'center'
  };
  const rowAttributes = {
    rowHeightType: 'Auto',
    minHeight: 0,
    minHeightUnits: 'em',
    maxHeight: 0,
    maxHeightUnits: 'em',
    fixedHeight: 0,
    fixedHeightUnits: 'em',
    isHeader: false,
    verticalAlignment: 'none'
  };
  const rowBorderAttributes = {
    rowHeightType: 'Auto',
    minHeight: 0,
    minHeightUnits: 'em',
    maxHeight: 0,
    maxHeightUnits: 'em',
    fixedHeight: 0,
    fixedHeightUnits: 'em',
    isHeader: false,
    verticalAlignment: 'none'
  };
  const cellAttributes = {
    border: false,
    value: {
      indexText: ''
    }
  };
  const cellBorderAttributes = {
    border: true
  };
  switch (tableComponent) {
    case 'table':
      return tableBaseAttributes;
    case 'columns':
      if (componentLocation === 'Border') {
        return columnBorderAttributes;
      }
      return columnAttributes;
    case 'rows':
      if (componentLocation === 'Border') {
        return rowBorderAttributes;
      }
      return rowAttributes;
    case 'cells':
      if (componentLocation === 'Border') {
        return cellBorderAttributes;
      }
      return cellAttributes;
  }
}

/**
 * Get default classes for a specific table part.
 *
 * @since    1.0.0
 *
 * @param {string} tableComponent table header, rows, column, cell
 * @return  {string} Classes
 */
function getDefaultTableClasses(tableComponent) {
  const tableBaseClasses = '';
  const columnClasses = '';
  const rowClasses = '';
  const cellClasses = '';
  switch (tableComponent) {
    case 'table':
      return tableBaseClasses;
    case 'columns':
      return columnClasses;
    case 'rows':
      return rowClasses;
    case 'cells':
      return cellClasses;
  }
}

/***/ },

/***/ "./src/utils.js"
/*!**********************!*\
  !*** ./src/utils.js ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_COLUMN_DATA_TYPE: () => (/* binding */ DEFAULT_COLUMN_DATA_TYPE),
/* harmony export */   computeCellIds: () => (/* binding */ computeCellIds),
/* harmony export */   formatedDisplayDate: () => (/* binding */ formatedDisplayDate),
/* harmony export */   formattedIsoDate: () => (/* binding */ formattedIsoDate),
/* harmony export */   formattedNumber: () => (/* binding */ formattedNumber),
/* harmony export */   generateBlockTableRef: () => (/* binding */ generateBlockTableRef),
/* harmony export */   normalizeColumnDataType: () => (/* binding */ normalizeColumnDataType),
/* harmony export */   numberToLetter: () => (/* binding */ numberToLetter),
/* harmony export */   openCurrentColumnMenu: () => (/* binding */ openCurrentColumnMenu),
/* harmony export */   openCurrentRowMenu: () => (/* binding */ openCurrentRowMenu),
/* harmony export */   prepareClassesForUse: () => (/* binding */ prepareClassesForUse),
/* harmony export */   sanitizeNumberInput: () => (/* binding */ sanitizeNumberInput),
/* harmony export */   setBorderContent: () => (/* binding */ setBorderContent),
/* harmony export */   stageClassesForEdit: () => (/* binding */ stageClassesForEdit),
/* harmony export */   tableSort: () => (/* binding */ tableSort),
/* harmony export */   updateArray: () => (/* binding */ updateArray)
/* harmony export */ });
/* harmony import */ var _wordpress_date__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/date */ "@wordpress/date");
/* harmony import */ var _wordpress_date__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_date__WEBPACK_IMPORTED_MODULE_0__);
/* External dependencies */

const LETTER_MAP = {
  1: 'A',
  2: 'B',
  3: 'C',
  4: 'D',
  5: 'E',
  6: 'F',
  7: 'G',
  8: 'H',
  9: 'I',
  a: 'J',
  b: 'K',
  c: 'L',
  d: 'M',
  e: 'N',
  f: 'O',
  g: 'P',
  h: 'Q',
  i: 'R',
  j: 'S',
  k: 'T',
  l: 'U',
  m: 'V',
  n: 'W',
  o: 'X',
  p: 'Y',
  q: 'Z'
};

/**
 * Convert a column number to a string of letters.
 *
 * @since    1.0.0
 * @since    1.1.0 Refactored
 *
 * @param {number} letterNumber Integer
 * @return  {string} Column letter
 */
function numberToLetter(letterNumber) {
  if (letterNumber === 0) {
    return '0';
  }
  const digits = letterNumber.toString(26);
  let result = '';
  for (let i = 0; i < digits.length; i++) {
    result += LETTER_MAP[digits[i]] ?? '';
  }
  return result;
}

/**
 * Update one attribute value inside the array.
 *
 * @since    1.0.0
 *
 * @param {Array|Object} arrayIn     current state with nested arrays and objects
 * @param {string}       key         State array type
 * @param {number}       id          Identifier of object associated with they key
 * @param {Object}       updatedData New object value
 * @return  {Array|Object} Updated object that represents one attribute of the new state
 */
function updateArray(arrayIn, key, id, updatedData) {
  return arrayIn.map(item => item[key] === id ? {
    ...item,
    ...updatedData
  } : item);
}

/**
 * Sort table part array by the natural identifier assigned at design time.
 *
 * @since    1.0.0
 *
 * @param {string} tablePart  Table part to be sorted (columns | rows | cells)
 * @param {Array}  tableArray Array of all attributes of the table part being sorted
 * @return Sorted tableArray based on the ID of each object in the array
 */
function tableSort(tablePart, tableArray) {
  if (tablePart === 'rows') {
    const sortedRows = [...tableArray];
    sortedRows.sort((a, b) => {
      if (Number([a.row_id]) < Number([b.row_id])) {
        return -1;
      }
      return 1;
    });
    return sortedRows;
  }
  if (tablePart === 'columns') {
    const sortedColumns = [...tableArray];
    sortedColumns.sort((a, b) => {
      if (Number([a.column_id]) < Number([b.column_id])) {
        return -1;
      }
      return 1;
    });
    return sortedColumns;
  }
  if (tablePart === 'cells') {
    const sortedCells = [...tableArray];
    sortedCells.sort((a, b) => {
      if (Number([a.row_id]) === Number([b.row_id])) {
        if (Number([a.column_id]) < Number([b.column_id])) {
          return -1;
        }
        return 1;
      }
      if (Number([a.row_id]) < Number([b.row_id])) {
        return -1;
      }
      return 1;
    });
    return sortedCells;
  }
}

/**
 * Create a set of css classes from a space delimited string
 *
 * @since 1.2.4
 *
 * @param {string} classString String of css class names
 * @return  {Set}              Set of class names
 */
function stageClassesForEdit(classString) {
  if (typeof classString !== 'string' || classString === '') return new Set();
  return new Set(classString.split(/\s+/).filter(Boolean));
}

/**
 * Build string of space delimited classes from class set
 *
 * @since 1.2.4
 *
 * @param {Set} classSet String of css class names
 * @return  {string}              Set of class names
 */
function prepareClassesForUse(classSet) {
  return Array.from(classSet).join(' ');
}

/**
 * Create a random identifier for assignment as a block/table cross reference.
 *
 * @since    1.0.0
 *
 * @return  {string} New block_table_ref
 */
function generateBlockTableRef() {
  const timestamp = Date.now();
  return timestamp.toString(16);
}

/**
 * Calculate the cell id for each cell in the Summary.
 *
 * @since    1.0.0
 * @since	 1.1.0 Moved from resolvers.js to utils.js
 *
 * @param {*} fetchedCells cell array retrieved the REST api
 * @return  {Array|Object} Cells with the added cell id attribute
 */
function computeCellIds(fetchedCells) {
  fetchedCells.forEach(cell => {
    cell.cell_id = numberToLetter(cell.column_id) + cell.row_id;
  });
  return {
    fetchedCells
  };
}

/**
 * Set content for borders occuring in rows (integers) and columns (letters).
 *
 * @since    1.0.0
 *
 * @param {*} row     current row_id
 * @param {*} column  current column_id
 * @param {*} content current content
 * @return  {number | string | null} cell content
 */
function setBorderContent(row, column, content) {
  if (row === '0' && column === '0') {
    return '';
  }
  return content;
}

/**
 * Identify whether to display the column menu component for the current column
 *
 * @since    1.0.0
 *
 * @param {boolean} columnMenuVisible Whether the column menu should be visible based on current state of processing
 * @param {number}  openColumnRow     The column id or row id that should be open
 * @param {number}  column_id         Current column id
 * @return  {boolean} Show the current column menu?
 */
function openCurrentColumnMenu(columnMenuVisible, openColumnRow, column_id) {
  if (columnMenuVisible && openColumnRow === column_id) {
    return true;
  }
  return false;
}

/**
 * Identify whether to display the row menu component for the current column
 *
 * @since    1.0.0
 *
 * @param {boolean} rowMenuVisible Whether the row menu should be visible based on current state of processing
 * @param {number}  openColumnRow  The column id or row id that should be open
 * @param {number}  row_id         Current row id
 * @return  {boolean} Show the current row menu?
 */
function openCurrentRowMenu(rowMenuVisible, openColumnRow, row_id) {
  if (rowMenuVisible && openColumnRow === row_id) {
    return true;
  }
  return false;
}

/** Fallback detault data type of backward compatibility */
const DEFAULT_COLUMN_DATA_TYPE = {
  type: 'general'
};

/**
 * Velidate the existance of a column data type and create a detault if there is not one
 *
 * @since 1.2.3
 *
 * @param {Object} columnDataType Data Type of the current column
 * @return {Object} Default data type object
 */
function normalizeColumnDataType(columnDataType) {
  // console.log('Consolidate to one columnDataType shape')
  if (columnDataType?.type) {
    return columnDataType;
  }
  if (columnDataType?.columnDataType?.type) {
    return columnDataType.columnDataType;
  }
  return DEFAULT_COLUMN_DATA_TYPE;
}

/**
 * Test whether a data is formatted as a valid ISO date string
 *
 * @since 1.2
 *
 * @param {string} value Test date string
 * @return {boolean}     Passed test?
 */
function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const test = new Date(Date.UTC(year, month - 1, day));
  return test.getUTCFullYear() === year && test.getUTCMonth() === month - 1 && test.getUTCDate() === day;
}
function isValidTime(value) {
  // 00:00 to 23:59, optional :ss (00-59)
  const m = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(value);
  return !!m;
}

/**
 * Test whether a data is formatted as a valid ISO date-time string
 *
 * @since 1.2
 *
 * @param {string} value Test date string
 * @return {boolean}     Passed test?
 */
function isValidISODatetime(value) {
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
  if (!isoRegex.test(value)) return false;
  const test = new Date(value);
  return !Number.isNaN(test.valueOf());
}

/**
 * Format Date/Time values for display when focus is not on this cell
 *
 * @since 1.2.0
 *
 * @param {Date}   date   ISO Date
 * @param {string} format Date/Time format
 * @return {string}       Formatted date for display
 */
function formatedDisplayDate(date, format) {
  if (!date) return '';

  // Test whether input is a valid ISO date
  if (!isValidISODate(date) && !isValidISODatetime(date) && !isValidTime(date)) {
    // console.log('invalidly formatted date - ' + date);
    // console.log('Valid Date = ' + isValidISODate(date));
    // console.log('Valid Datetime = ' + isValidISODatetime(date));
    // console.log('Valid Time = ' + isValidTime(date));
    return '';
  }
  if (format === 'date') {
    // console.log('Return Date');
    return (0,_wordpress_date__WEBPACK_IMPORTED_MODULE_0__.dateI18n)('n/j/Y', date);
  }
  if (format === 'time') {
    // console.log('Return Time from ' + date);

    const [hh, mm] = date.split(':').map(Number);
    if (!Number.isInteger(hh) || !Number.isInteger(mm)) return '';
    const ampm = hh >= 12 ? 'pm' : 'am';
    const h12 = (hh + 11) % 12 + 1;
    return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
  }
  if (format === 'datetime-local') {
    // console.log('Return Date/Time');
    return (0,_wordpress_date__WEBPACK_IMPORTED_MODULE_0__.dateI18n)('n/j/Y g:i a', date);
  }
  return '';
}

/**
 * Format Date/Time values for canonical storage in ISO format
 *
 * @since 1.2.0
 *
 * @param {string} date   Date string
 * @param {string} format Date/Time format
 * @return {Date}         ISO date
 */
function formattedIsoDate(date, format) {
  // Test whether input is a valid ISO date
  if (date) {
    switch (format) {
      case 'date':
        if (!isValidISODate(date)) return '';
        break;
      case 'time':
        if (!isValidTime(date)) return '';
        break;
      case 'datetime-local':
        if (!isValidISODatetime(date)) return '';
        break;
      default:
        return '';
    }
  }
  const dateString = date ? new Date(date) : new Date();
  if (format === 'date') {
    return dateString.toISOString().split('T')[0];
  }
  if (format === 'time') {
    if (!!date) {
      return date;
    }
    const hh = String(dateString.getHours()).padStart(2, '0');
    const mm = String(dateString.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  if (format === 'datetime-local') {
    const yyyy = dateString.getFullYear();
    const mo = String(dateString.getMonth() + 1).padStart(2, '0');
    const dd = String(dateString.getDate()).padStart(2, '0');
    const hh = String(dateString.getHours()).padStart(2, '0');
    const mm = String(dateString.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mo}-${dd}T${hh}:${mm}`;
  }
  return '';
}

/**
 * Strip formatting characters from numeric display string
 *
 * @since    1.2.4
 *
 * @param {string} value          String representation of number
 * @param {string} dataTypeFormat Number format type
 * @return {string} Sanitized numeric string
 */
function sanitizeNumberInput(value, dataTypeFormat) {
  let next = String(value ?? '');

  // Remove display formatting first.
  next = next.replace(/,/g, '');
  next = next.replace(/[^\d.\-]/g, '');

  // console.log('Replace brackets with minus sign');

  // Keep only a single leading minus.
  next = next.replace(/(?!^)-/g, '');

  // Integers do not allow decimals.
  if (dataTypeFormat === 'integer') {
    return next.replace(/\./g, '');
  }

  // Keep only the first decimal point.
  const firstDot = next.indexOf('.');
  if (firstDot !== -1) {
    next = next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, '');
  }
  return next;
}

/**
 * Strip formatting characters from numeric display string
 *
 * @since    1.2.4
 *
 * @param {string}  rawValue           String representation of canonical number
 * @param {string}  dataTypeFormat     Number format type
 * @param {boolean} thousandSeparator  Add thousands separator
 * @param {number}  decimalPlaces      Number of decimal places
 * @param {boolean} showCurrencySymbol Display currency symbol
 * @param {boolean} bracketNegative    Display negative numbers with brackets
 * @return {string}                   Formatted string representation of number
 */
function formattedNumber(rawValue, dataTypeFormat, thousandSeparator, decimalPlaces, showCurrencySymbol = dataTypeFormat === 'currency', bracketNegative = false) {
  // console.log('In Formatted Number');
  const sanitizedNumber = sanitizeNumberInput(rawValue, dataTypeFormat);
  console.log('  Sanitized number = ' + sanitizedNumber);
  if (sanitizedNumber === '') return '';
  if (sanitizedNumber === '-') return '-';
  const isNegative = sanitizedNumber.startsWith('-');
  const unsigned = isNegative ? sanitizedNumber.slice(1) : sanitizedNumber;
  const hasDecimal = unsigned.includes('.');
  let [integerPart = '', fractionPart = ''] = unsigned.split('.');
  integerPart = integerPart.replace(/\D/g, '');
  fractionPart = fractionPart.replace(/\D/g, '');
  let numberStyle = 'decimal';
  let revisedDecimalPlaces = decimalPlaces;
  switch (dataTypeFormat) {
    case 'number':
      numberStyle = 'decimal';
      break;
    case 'integer':
      numberStyle = 'decimal';
      break;
    case 'percent':
      numberStyle = 'percent';
      revisedDecimalPlaces = decimalPlaces + 2;
      break;
    case 'currency':
      numberStyle = showCurrencySymbol ? 'currency' : 'decimal';
      break;
    default:
      numberStyle = 'decimal';
  }

  // console.log('Thousands Separator = ' + thousandSeparator);

  const formatOptions = {
    style: numberStyle,
    currency: 'USD',
    // Options include code | symbol | narrowSymbol | name
    currencyDisplay: 'symbol',
    currencySign: bracketNegative ? 'accounting' : 'standard',
    // Reserved for future unit of measure adoption
    // unit:  Per subset of ECMA-402 specification
    // unitDisplay:
    minimumIntegerDigits: 1,
    // provides ability to left pad zeros
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    // Not implemented at this time
    // minimumSignificantDigits:
    // maximumSignificantDigits:
    // roundingPriority:
    // roundingIncrement:
    // roundingMode:
    // trailingZeros:
    // notation:
    // compactDisplay:
    signDisplay: 'auto',
    useGrouping: thousandSeparator ? true : false
  };
  if (numberStyle === 'currency') {
    formatOptions.currency = 'USD';
    formatOptions.currencyDisplay = 'symbol';
  }
  console.log(formatOptions);
  const limitedFraction = fractionPart.slice(0, Math.max(0, revisedDecimalPlaces));
  console.log('  Limited fraction =  ' + limitedFraction);
  const decimalFragment = hasDecimal ? `.${limitedFraction}` : '';
  console.log('  Decimal fragment =  ' + decimalFragment);
  const rawNumberString = `${integerPart}${decimalFragment}`;
  console.log('  Raw Number =  ' + rawNumberString);
  const formattedMagnitude = new Intl.NumberFormat('en-US', formatOptions).format(Number(rawNumberString));
  if (!isNegative) {
    return formattedMagnitude;
  }
  if (bracketNegative) {
    return `(${formattedMagnitude})`;
  }
  return `-${formattedMagnitude}`;
}

/***/ },

/***/ "./src/components/column-dropdown-menu/style.scss"
/*!********************************************************!*\
  !*** ./src/components/column-dropdown-menu/style.scss ***!
  \********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "./src/components/configure-column-data-types/style.scss"
/*!***************************************************************!*\
  !*** ./src/components/configure-column-data-types/style.scss ***!
  \***************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "./src/components/configure-column-width/style.scss"
/*!**********************************************************!*\
  !*** ./src/components/configure-column-width/style.scss ***!
  \**********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "./src/components/configure-row-height/style.scss"
/*!********************************************************!*\
  !*** ./src/components/configure-row-height/style.scss ***!
  \********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "./src/components/row-dropdown-menu/style.scss"
/*!*****************************************************!*\
  !*** ./src/components/row-dropdown-menu/style.scss ***!
  \*****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "./src/editor.scss"
/*!*************************!*\
  !*** ./src/editor.scss ***!
  \*************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "./src/style.scss"
/*!************************!*\
  !*** ./src/style.scss ***!
  \************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "react/jsx-runtime"
/*!**********************************!*\
  !*** external "ReactJSXRuntime" ***!
  \**********************************/
(module) {

module.exports = window["ReactJSXRuntime"];

/***/ },

/***/ "@wordpress/block-editor"
/*!*************************************!*\
  !*** external ["wp","blockEditor"] ***!
  \*************************************/
(module) {

module.exports = window["wp"]["blockEditor"];

/***/ },

/***/ "@wordpress/blocks"
/*!********************************!*\
  !*** external ["wp","blocks"] ***!
  \********************************/
(module) {

module.exports = window["wp"]["blocks"];

/***/ },

/***/ "@wordpress/components"
/*!************************************!*\
  !*** external ["wp","components"] ***!
  \************************************/
(module) {

module.exports = window["wp"]["components"];

/***/ },

/***/ "@wordpress/compose"
/*!*********************************!*\
  !*** external ["wp","compose"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["compose"];

/***/ },

/***/ "@wordpress/core-data"
/*!**********************************!*\
  !*** external ["wp","coreData"] ***!
  \**********************************/
(module) {

module.exports = window["wp"]["coreData"];

/***/ },

/***/ "@wordpress/data"
/*!******************************!*\
  !*** external ["wp","data"] ***!
  \******************************/
(module) {

module.exports = window["wp"]["data"];

/***/ },

/***/ "@wordpress/date"
/*!******************************!*\
  !*** external ["wp","date"] ***!
  \******************************/
(module) {

module.exports = window["wp"]["date"];

/***/ },

/***/ "@wordpress/editor"
/*!********************************!*\
  !*** external ["wp","editor"] ***!
  \********************************/
(module) {

module.exports = window["wp"]["editor"];

/***/ },

/***/ "@wordpress/element"
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["element"];

/***/ },

/***/ "@wordpress/i18n"
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
(module) {

module.exports = window["wp"]["i18n"];

/***/ },

/***/ "@wordpress/notices"
/*!*********************************!*\
  !*** external ["wp","notices"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["notices"];

/***/ },

/***/ "@wordpress/primitives"
/*!************************************!*\
  !*** external ["wp","primitives"] ***!
  \************************************/
(module) {

module.exports = window["wp"]["primitives"];

/***/ },

/***/ "@wordpress/rich-text"
/*!**********************************!*\
  !*** external ["wp","richText"] ***!
  \**********************************/
(module) {

module.exports = window["wp"]["richText"];

/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/block-table.mjs"
/*!****************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/block-table.mjs ***!
  \****************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ block_table_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/block-table.tsx


var block_table_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 4.5h14c.3 0 .5.2.5.5v3.5h-15V5c0-.3.2-.5.5-.5zm8 5.5h6.5v3.5H13V10zm-1.5 3.5h-7V10h7v3.5zm-7 5.5v-4h7v4.5H5c-.3 0-.5-.2-.5-.5zm14.5.5h-6V15h6.5v4c0 .3-.2.5-.5.5z" }) });

//# sourceMappingURL=block-table.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/cog.mjs"
/*!********************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/cog.mjs ***!
  \********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ cog_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/cog.tsx


var cog_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(
  _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path,
  {
    fillRule: "evenodd",
    d: "M10.289 4.836A1 1 0 0111.275 4h1.306a1 1 0 01.987.836l.244 1.466c.787.26 1.503.679 2.108 1.218l1.393-.522a1 1 0 011.216.437l.653 1.13a1 1 0 01-.23 1.273l-1.148.944a6.025 6.025 0 010 2.435l1.149.946a1 1 0 01.23 1.272l-.653 1.13a1 1 0 01-1.216.437l-1.394-.522c-.605.54-1.32.958-2.108 1.218l-.244 1.466a1 1 0 01-.987.836h-1.306a1 1 0 01-.986-.836l-.244-1.466a5.995 5.995 0 01-2.108-1.218l-1.394.522a1 1 0 01-1.217-.436l-.653-1.131a1 1 0 01.23-1.272l1.149-.946a6.026 6.026 0 010-2.435l-1.148-.944a1 1 0 01-.23-1.272l.653-1.131a1 1 0 011.217-.437l1.393.522a5.994 5.994 0 012.108-1.218l.244-1.466zM14.929 12a3 3 0 11-6 0 3 3 0 016 0z",
    clipRule: "evenodd"
  }
) });

//# sourceMappingURL=cog.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/search.mjs"
/*!***********************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/search.mjs ***!
  \***********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ search_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/search.tsx


var search_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M13 5c-3.3 0-6 2.7-6 6 0 1.4.5 2.7 1.3 3.7l-3.8 3.8 1.1 1.1 3.8-3.8c1 .8 2.3 1.3 3.7 1.3 3.3 0 6-2.7 6-6S16.3 5 13 5zm0 10.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z" }) });

//# sourceMappingURL=search.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/settings.mjs"
/*!*************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/settings.mjs ***!
  \*************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ settings_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/settings.tsx


var settings_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: [
  /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "m19 7.5h-7.628c-.3089-.87389-1.1423-1.5-2.122-1.5-.97966 0-1.81309.62611-2.12197 1.5h-2.12803v1.5h2.12803c.30888.87389 1.14231 1.5 2.12197 1.5.9797 0 1.8131-.62611 2.122-1.5h7.628z" }),
  /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "m19 15h-2.128c-.3089-.8739-1.1423-1.5-2.122-1.5s-1.8131.6261-2.122 1.5h-7.628v1.5h7.628c.3089.8739 1.1423 1.5 2.122 1.5s1.8131-.6261 2.122-1.5h2.128z" })
] });

//# sourceMappingURL=settings.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/table-column-after.mjs"
/*!***********************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/table-column-after.mjs ***!
  \***********************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ table_column_after_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/table-column-after.tsx


var table_column_after_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M19 3H5c-1.1 0-2 .9-2 2v14.2c.1.9.9 1.7 1.8 1.8H19.2c1-.1 1.8-1 1.8-2V5c0-1.1-.9-2-2-2ZM8.5 19.5H5c-.3 0-.5-.2-.5-.5v-3.5h4v4Zm0-5.5h-4v-4h4v4Zm0-5.5h-4V5c0-.3.2-.5.5-.5h3.5v4Zm11 10.5c0 .3-.2.5-.5.5h-9v-15h9c.3 0 .5.2.5.5v14Zm-4-10.8H14v3h-3v1.5h3v3h1.5v-3h3v-1.5h-3v-3Z" }) });

//# sourceMappingURL=table-column-after.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/table-column-before.mjs"
/*!************************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/table-column-before.mjs ***!
  \************************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ table_column_before_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/table-column-before.tsx


var table_column_before_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1 .8 1.9 1.8 2H19.2c.9-.1 1.7-.9 1.8-1.8V5c0-1.1-.9-2-2-2Zm-5 16.5H5c-.3 0-.5-.2-.5-.5V5c0-.3.2-.5.5-.5h9v15Zm5.5-.5c0 .3-.2.5-.5.5h-3.5v-4h4V19Zm0-5h-4v-4h4v4Zm0-5.5h-4v-4H19c.3 0 .5.2.5.5v3.5Zm-11 7.3H10v-3h3v-1.5h-3v-3H8.5v3h-3v1.5h3v3Z" }) });

//# sourceMappingURL=table-column-before.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/table-column-delete.mjs"
/*!************************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/table-column-delete.mjs ***!
  \************************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ table_column_delete_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/table-column-delete.tsx


var table_column_delete_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M19 3H5c-1.1 0-2 .9-2 2v14.2c.1.9.9 1.7 1.8 1.8H19.2c1-.1 1.8-1 1.8-2V5c0-1.1-.9-2-2-2ZM8.5 19.5H5c-.3 0-.5-.2-.5-.5V5c0-.3.2-.5.5-.5h3.5v15Zm11-.5c0 .3-.2.5-.5.5h-9v-15h9c.3 0 .5.2.5.5v14ZM16.9 8.8l-2.1 2.1-2.1-2.1-1.1 1.1 2.1 2.1-2.1 2.1 1.1 1.1 2.1-2.1 2.1 2.1 1.1-1.1-2.1-2.1L18 9.9l-1.1-1.1Z" }) });

//# sourceMappingURL=table-column-delete.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/table-row-after.mjs"
/*!********************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/table-row-after.mjs ***!
  \********************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ table_row_after_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/table-row-after.tsx


var table_row_after_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M19 3H4.8c-.9.1-1.7.9-1.8 1.8V19.2c.1 1 1 1.8 2 1.8h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm-9 1.5h4v4h-4v-4ZM4.5 5c0-.3.2-.5.5-.5h3.5v4h-4V5Zm15 14c0 .3-.2.5-.5.5H5c-.3 0-.5-.2-.5-.5v-9h15v9Zm0-10.5h-4v-4H19c.3 0 .5.2.5.5v3.5Zm-8.3 10h1.5v-3h3V14h-3v-3h-1.5v3h-3v1.5h3v3Z" }) });

//# sourceMappingURL=table-row-after.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/table-row-before.mjs"
/*!*********************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/table-row-before.mjs ***!
  \*********************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ table_row_before_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/table-row-before.tsx


var table_row_before_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M21 5c0-1.1-.9-2-2-2H5c-1 0-1.9.8-2 1.8V19.2c.1.9.9 1.7 1.8 1.8H19c1.1 0 2-.9 2-2V5ZM4.5 14V5c0-.3.2-.5.5-.5h14c.3 0 .5.2.5.5v9h-15Zm4 5.5H5c-.3 0-.5-.2-.5-.5v-3.5h4v4Zm5.5 0h-4v-4h4v4Zm5.5-.5c0 .3-.2.5-.5.5h-3.5v-4h4V19ZM11.2 10h-3V8.5h3v-3h1.5v3h3V10h-3v3h-1.5v-3Z" }) });

//# sourceMappingURL=table-row-before.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/table-row-delete.mjs"
/*!*********************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/table-row-delete.mjs ***!
  \*********************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ table_row_delete_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/table-row-delete.tsx


var table_row_delete_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M19 3H4.8c-.9.1-1.7.9-1.8 1.8V19.2c.1 1 1 1.8 2 1.8h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm.5 16c0 .3-.2.5-.5.5H5c-.3 0-.5-.2-.5-.5v-9h15v9Zm0-10.5h-15V5c0-.3.2-.5.5-.5h14c.3 0 .5.2.5.5v3.5Zm-9.6 9.4 2.1-2.1 2.1 2.1 1.1-1.1-2.1-2.1 2.1-2.1-1.1-1.1-2.1 2.1-2.1-2.1-1.1 1.1 2.1 2.1-2.1 2.1 1.1 1.1Z" }) });

//# sourceMappingURL=table-row-delete.mjs.map


/***/ },

/***/ "./node_modules/clsx/dist/clsx.mjs"
/*!*****************************************!*\
  !*** ./node_modules/clsx/dist/clsx.mjs ***!
  \*****************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   clsx: () => (/* binding */ clsx),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function r(e){var t,f,n="";if("string"==typeof e||"number"==typeof e)n+=e;else if("object"==typeof e)if(Array.isArray(e)){var o=e.length;for(t=0;t<o;t++)e[t]&&(f=r(e[t]))&&(n&&(n+=" "),n+=f)}else for(f in e)e[f]&&(n&&(n+=" "),n+=f);return n}function clsx(){for(var e,t,f=0,n="",o=arguments.length;f<o;f++)(e=arguments[f])&&(t=r(e))&&(n&&(n+=" "),n+=t);return n}/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (clsx);

/***/ },

/***/ "./src/block.json"
/*!************************!*\
  !*** ./src/block.json ***!
  \************************/
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$schema":"https://schemas.wp.org/trunk/block.json","apiVersion":3,"name":"dynamic-table-blocks/dynamic-table-blocks","version":"0.1.0","title":"Dynamic Tables","category":"design","icon":"editor-table","description":"Create custom table blocks with highly customizable and responsive formats","example":{},"textdomain":"dynamic-table-blocks","attributes":{"table_id":{"type":"integer","default":"0"},"block_table_ref":{"type":"string","default":""},"original_post_type":{"type":"string","default":""},"original_post_id":{"type":"integer","default":"0"},"block_alignment":{"type":"string","default":"undefined"}},"usesContext":["postId","postType"],"supports":{"html":false,"className":false,"color":{"button":true,"gradients":true,"heading":true,"link":true},"typography":{"fontSize":true,"__experimentalFontFamily":true,"__experimentalTextDecoration":true,"__experimentalFontStyle":true,"__experimentalFontWeight":true,"__experimentalLetterSpacing":true,"__experimentalWritingMode":true,"__experimentalDefaultControls":{"fontSize":true}},"interactivity":{"clientNavigation":true}},"editorScript":"file:./index.js","editorStyle":"file:./index.css","style":"file:./style-index.css","render":"file:./render.php","viewScript":"file:./view.js"}');

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"index": 0,
/******/ 			"./style-index": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = globalThis["webpackChunkdynamic_table_blocks"] = globalThis["webpackChunkdynamic_table_blocks"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["./style-index"], () => (__webpack_require__("./src/index.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map