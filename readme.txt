=== Dynamic Tables ===
Contributors:      glschaub, myfamilyweb
Tags:              tables, data table, responsive tables, table block, gutenberg table
Tested up to:      7.0
Stable tag:        1.2.5
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Responsive table blocks with intuitive keyboard navigation, familiar spreadsheet-style interactions, and advanced formatting.

== Description ==
Dynamic Tables is a powerful WordPress table block for creating responsive, presentation-focused tables with intuitive inline editing. Anyone familiar with spreadsheets will quickly understand how to navigate and format content.


=== Highlights: ===
* Fully responsive — tables maintain alignment and readability across all screen sizes
* Navigate and edit cells using familiar, spreadsheet-style keyboard controls and contextual menus
* Native Gutenberg block — no page builders or external dependencies required
* Build structured tables directly in the block editor with full control over rows and columns
* Precisely control column widths, row heights, header rows, and grid line styling
* Support for column-specific data types including text, numbers, and date/time values
* Built with multisite in mind, with per-site activation support

Whether you're building comparison tables, product listings, directory lookup tables or publishing data-rich content - Dynamic Tables gives you a simple, elegant solution.

=== Key Features ===
* Gutenberg native block: Dynamic Tables
* Use arrow keys, tab, and enter to move between cells
* Menus and keyboard shortcuts support the ability to add, move and delete columns and rows
* Adjustable column widths and row heights
* Support for column specific content types (e.g., rich text, date, time, number, etc.)
* Header row support with formatting independent from the table body
* Inline editing of cell content
* Fully responsive: tables scale, wrap and adapt to mobile screens
* Clean semantic HTML output for SEO and accessibility
* Lightweight footprint and compatible with modern themes
* Table export for backup purposes

=== Why Choose Dynamic Tables over other table blocks? ===
Dynamic Tables is designed specifically for tables that require ongoing updates, consistent structure, and reliable responsive behavior. It is an ideal option if your use case goes beyond basic layout tables and into repeatable, data-oriented content. Dynamic Tables provides a purpose-built solution that stays fully native to the block editor.

=== Roadmap ===
Some roadmap highlights include:

* Adding more content types and formats for all rows in a column (e.g., checkboxes, images, links, buttons, etc.) without the need to format each cell
* Copy/paste support
* Undo/redo support
* Importing in common formats (e.g., csv, xlsx)
* Enhanced responsive formatting for mobile devices
* Integrating Dynamic Tables with WordPress search
* Support for front end interactivity to sort and filter tables
* Front end editing

=== For WordPress Developers ===
Dynamic Tables uses a unique architecture designed to provide power and flexibility for developers while remaining fully transparent to users. Table definitions and content are stored in custom WordPress database tables rather than post content, enabling a more structured and extensible data model. These are the primary building blocks:
* Table data and definitions are abstracted through block entity types
* Entities natively call RESTful APIs
* An underlying WordPress REST API service supports the loading and saving of table data
* The service interacts with a highly abstracted SQL layer which leverages WordPress WPDB
* The tables themselves leverage the newer CSS grid framework
  * Much of the flexibility is derived from grid functionality that has been incorporated into mainstream web browsers in the past few years
  * This framework provides responsiveness that doesn't "break" table structure.  Misaligned rows and columns, unexpected wrapping, and otherwise indecipherable tables have been beaten down.
* The API architecture will eventually support data stored in external files or web services. We're considering these capabilities in our roadmap.

== Installation ==
1. In your WordPress dashboard, go to **Plugins -> Add New**, search for *Dynamic Tables*, click **Install Now** and then **Activate**.
2. Alternatively: Download the ZIP file from the WordPress Plugin Directory. Upload it via **Plugins -> Add New -> Upload Plugin**, install and activate.
3. After activation, open any post or page, click the **+** button in the block editor and insert the "Dynamic Tables" block.
4. Start building your table: add columns and rows, set header options, adjust widths, edit content.
> **Note:** On multisite installations the plugin must be activated on each site where it is used (network-activation is not supported).
> **Important:** Deactivating and deleting the plugin does *not* auto-remove stored tables. However, there is a setting to support the removal of stored tables. Re-activating restores existing tables in posts.

== Frequently Asked Questions ==
= Can I import data from CSV or Excel? =

Not yet in this version. The architecture for external data sources is in the roadmap, and upcoming versions will include more import/export options.

= Will this work with any theme? =

Yes. Dynamic Tables outputs semantic HTML and relies on standard CSS. It should be compatible with virtually all well-coded themes.

= Does this work on mobile devices? =

Yes. The responsive behavior ensures tables resize, wrap or scroll appropriately to maintain readability on smaller screens.

= Is there a fee to use this plugin? =

No. This plugin is free to use. However, we are planning for a premium version of Dynamic Tables to support advanced features.

= What happens if I deactivate or delete the plugin? =

* Dynamic Tables block will render while the plugin is disabled or deleted.
* Data may be retained or deleted when the plugin is uninstalled. The default is to retain the data.
* Reinstallation and activation will make all tables reappear if the data has not been purged.

== Screenshots ==

1. Create a new Dynamic Table block
2. Format specific table text
3. Insert columns and rows
4. Format header row if one exists
5. Format header grid lines
6. Format table body
7. Set column width (corresponding configuration is available for rows too)

== Changelog ==
= 1.2.5 =
* Added keyboard shortcuts to insert and delete rows and columns
* Enhance HTML semantics and accessibility support
* Fix bug that prevented selection of existing theme colors on color pickers
* Add support for contentOnly mode in non-sync patterns
* Bump support for WordPress 7.0

= 1.2.4 =
* Added support for numeric input that may be formatted as whole numbers, integers, percent, or currency
* Added a css class engine to support more granular formatting capabilities
* Added support for auto formatting of dates, currently to right justify dates

= 1.2.3 =
* Fix bug that prevents display of general content type
* Added keyboard shortcuts to move rows and columns up/down left/right, respectively

= 1.2.2 =
* Fix intermittent issue with arrow key navigation
* Fix bug that caused error when changing from one date/time type to another when data was already in the cell
* Allow direct keyboard editing of date/time fields
* Added ability to move rows up or down via border menu
* Added ability to move columns left or right via border menu
* Added ability to insert rows both above and below current row (previously only insert above was supported)
* Added ability to insert columns both left and right of current column (previously only insert left was supported)


= 1.2.1 =
* Fixed bug that made a date/time render in date/time columns when there was not underlying value

= 1.2.0 =
* Separated table control activity from editing so that navigation, delete key, etc. will work properly when not otherwise editing a cell
* Added a Date/Time content type
* Added ability to update column names
* Added a column menu to select content types and related actions
* Added framework for column driven content types
* Refactor Column menus to enhance stability and performance
* Refactor Row menus to enhance stability and performance

= 1.1.1 =
* Add keyboard navigation through table cells via arrow keys
* Added a visual indicator to easily identify what cell you're currently editing
* Refactor editor to break out Cell as its own component in support of future enhancements
* Support for table exports that can be used for backup and recovery

= 1.1.0 =
* Fix bug that caused fatal error when editing post with "Show Template" enabled
* Support for post templates and patterns.
* Created scheduled maintenance to ensure posts and tables are internally consistent
* Automatically remove tables when their underlying posts are deleted from the admin page
* Provide visibility to all tables, their status, associated post, and to view the table data
* Bump support for WordPress 6.9

= 1.0.0 =
* Initial Release
