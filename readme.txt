=== Dynamic Tables ===
Contributors:      glschaub, myfamilyweb
Tags:              tables, data table, responsive tables, table block, gutenberg table
Tested up to:      7.0
Stable tag:        1.4.4
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Responsive table blocks with intuitive keyboard navigation, familiar spreadsheet-style interactions, and advanced formatting.

== Description ==

Dynamic Tables lets you create and edit WordPress tables as naturally as working in a spreadsheet.

Built as a native Gutenberg block, Dynamic Tables combines intuitive spreadsheet-style editing with a modern architecture that treats table data as structured information rather than embedded HTML. Content creators enjoy familiar keyboard navigation and inline editing, while developers benefit from clean, semantic output and a flexible data model designed for long-term growth.

Whether you're creating comparison tables, pricing tables, product specifications, schedules, directories, or other presentation-focused content, Dynamic Tables makes building and maintaining tables faster, easier, and more reliable.

=== Why Dynamic Tables? ===

Unlike traditional table blocks that embed table content directly into post content, Dynamic Tables stores table data independently while the block itself simply references the table. This architecture allows tables to be managed as structured data while remaining fully integrated with the Gutenberg editor.

That means:

* Edit tables naturally using familiar spreadsheet interactions.
* Keep structured table data independent from page content.
* Publish responsive, semantic tables designed for accessibility and SEO.
* Build on a foundation designed for future capabilities including search, front-end editing, filtering, sorting, and external integrations.

=== Designed for Everyone ===

Dynamic Tables was designed for two audiences simultaneously.

**Content creators** want tables that are easy to build and maintain without needing HTML, shortcodes, or complicated configuration.

**Developers and site administrators** want an architecture that is maintainable, extensible, and integrates naturally with modern WordPress development practices.

Rather than forcing you to choose between ease of use and technical capability, Dynamic Tables delivers both.

=== Highlights ===

* Native Gutenberg block — no page builders or external dependencies
* Spreadsheet-style editing with familiar keyboard navigation
* Fully responsive tables that preserve alignment across screen sizes
* Structured column data types including rich text, numbers, date/time, and checkbox values
* Inline editing with contextual menus and keyboard shortcuts
* Import CSV files or restore tables from JSON backups
* Export tables for backup or interoperability
* Precise control over column widths, row heights, borders, headers, and formatting
* Semantic HTML output for accessibility and search engines
* Built with multisite support in mind

=== Key Features ===

**Spreadsheet-style Editing**

Anyone familiar with a spreadsheet will feel immediately at home.

* Navigate with Arrow keys, Tab, and Enter
* Edit cells directly
* Insert, move, and delete rows or columns using menus or keyboard shortcuts
* Copy, cut, and paste individual cells
* Adjust row heights and column widths visually

**Structured Data Types**

Columns understand the type of information they contain.

Current supported data types include:

* General (rich) text
* Numbers (float, currency, percentages, integers)
* Date/Time (date, time, date/time)
* Checkbox (standard, toggle, icon, freeform)

Formatting is applied consistently across an entire column while preserving the underlying value.

**Responsive by Design**

Tables remain readable across desktop, tablet, and mobile devices without sacrificing structure.

Rather than allowing rows and columns to become misaligned, Dynamic Tables was designed from the beginning with responsive presentation in mind.

**Clean Semantic Output**

Dynamic Tables generates semantic HTML that benefits:

* Accessibility
* Search engines
* Theme compatibility
* Performance

Numbers remain numbers. Dates remain dates. Tables remain real tables.

=== Built on a Modern Architecture ===

Dynamic Tables is more than a visual table editor.

Unlike many table blocks that store complete table markup inside post content, Dynamic Tables stores table definitions and content in dedicated WordPress database tables. Posts contain only lightweight references to those tables.

This architecture provides several important advantages:

* Cleaner separation between content and presentation
* Structured data suitable for future capabilities
* REST-based loading and saving of table content
* Greater flexibility for import, export, search, and future integrations
* Easier long-term maintenance

Under the hood, Dynamic Tables includes:

* Native Gutenberg block entities
* RESTful APIs
* An abstracted data layer built on WPDB
* CSS Grid-based rendering
* A design intended to support future external data sources

The technical complexity remains invisible to content editors while providing developers with a robust foundation for building on the platform.

=== Roadmap ===

Dynamic Tables continues to evolve. Planned enhancements include:

* Additional column content types such as links, buttons, images, and more
* Undo and redo support
* Expanded copy and paste capabilities
* Additional responsive formatting options
* Integration with WordPress search
* Front-end sorting and filtering
* Front-end editing
* Additional REST API capabilities
* Support for external data sources

== Installation ==
1. In your WordPress dashboard, go to **Plugins -> Add New**, search for *Dynamic Tables*, click **Install Now** and then **Activate**.
2. Alternatively: Download the ZIP file from the WordPress Plugin Directory. Upload it via **Plugins -> Add New -> Upload Plugin**, install and activate.
3. After activation, open any post or page, click the **+** button in the block editor and insert the "Dynamic Tables" block.
4. Start building your table: add columns and rows, set header options, adjust widths, edit content.
> **Note:** On multisite installations the plugin must be activated on each site where it is used (network-activation is not supported).
> **Important:** Deactivating and deleting the plugin does *not* auto-remove stored tables. However, there is a setting to support the removal of stored tables. Re-activating restores existing tables in posts.

== Frequently Asked Questions ==
= Will this work with any theme? =

Yes. Dynamic Tables outputs semantic HTML and relies on standard CSS. It should be compatible with virtually all well-coded themes.

= Does this plugin work with WordPress Real-Time Collaboration? =

Yes, but Real-Time Collaboration behavior is controlled by WordPress/Gutenberg, not this plugin.

Known WordPress RTC constraints may affect the editor experience:
- Collaboration is disabled when classic meta boxes are present on the edit screen.
- Current WordPress/Gutenberg RTC defaults may limit the number of simultaneous collaborators.
- If you see RTC session-limit or reconnect issues, close extra editor tabs or windows for the same content and retry with fewer active editors.

If your site needs broader RTC support, check your WordPress/Gutenberg version and hosting configuration, and review the current WordPress RTC developer notes.

= Does this work on mobile devices? =

Yes. The responsive behavior ensures tables resize, wrap or scroll appropriately to maintain readability on smaller screens.

= Is there a fee to use this plugin? =

No. This plugin is free to use. However, we are planning for a premium version of Dynamic Tables to support advanced features.

= What happens if I deactivate or delete the plugin? =

* Dynamic Tables block will render while the plugin is disabled or deleted.
* Data may be retained or deleted when the plugin is uninstalled. The default is to retain the data.
* Reinstallation and activation will make all tables reappear if the data has not been purged.

== Screenshots ==

1. Create a brand new Dynamic Table block
2. Create a new Dynamic Table block from an existing unattached table
3. Import and create a new table available for attachment
4. Editor actions and navigation
5. Header border menu options
6. Format specific table text ("general" content type)
7. Format header row if one exists
8. Format header grid lines
9. Format table body
10. Set column width (corresponding configuration is available for rows too)

== Changelog ==
= 1.4.4 =
* Show borders when table is created
* Fix bug that prevents allowing checkbox to be hidden when no content is found.
* Initial foundation for undo/redo feature

= 1.4.3 =
* Added checkbox column content type

= 1.4.2 =
* Added support restore backup files which contain full table formatting
* Added support to export tables to csv files

= 1.4.1 =
* Added support to delete table from the admin Table Maintenance
* Added support to change a table's status from the admin Table Maintenance
* Fixed bug that prevented import "choose file" button from opening file expolorer
* Fixed bug that made table delete unreliable

= 1.4.0 =
* Added support for importing CSV files and loading them as Dynamic Tables
* Updated table creation to attach loaded tables to new blocks
* Enhanced REST API to get multiple tables and apply filters to those requests
* Fix bug that can incorrectly render banded row text color
* Fixed multiple additional bugs

= 1.3.1 =
* Added support for copy/cut/paste a single cell's content to other cell in the same table with the same content type
* Created right-click cell menu
* Created centralized message library and utility functions to support consistent user messaging and notices
* Bump support for WordPress 7.0


= 1.3.0 =
* Added support for collaborative editing features targeted for the next major WordPress release
* Smoother handling when tables are added, edited, saved, or removed

= 1.2.5 =
* Added keyboard shortcuts to insert and delete rows and columns
* Enhance HTML semantics and accessibility support
* Fix bug that prevented selection of existing theme colors on color pickers
* Add support for WordPress contentOnly editing mode

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
