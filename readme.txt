=== Dynamic Tables ===
Contributors:      glschaub, myfamilyweb
Tags:              tables, data table, table builder, block editor, responsive tables, editable tables
Tested up to:      6.9
Stable tag:        1.1.1
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Create highly responsive custom table blocks that are easily configured.

== Description ==
Need a powerful table block that works beautifully in the Gutenberg / Block Editor?
Dynamic Tables gives you a **responsive**, **sortable**, and **inline-editable** table block that beats the limitations of the default Table block — without complex shortcode plugins or heavy imports.

**Highlights:**
* Create new tables with your own columns & rows right in the block editor
* Resize and reformat columns and rows, set header rows, define grid-lines
* Fully responsive — tables won’t break on mobile or misalign in complex layouts
* Editable: Make your tables quickly updatable inside content without leaving the editor
* Lightweight and fast — no bulky page-builders required
* Built with multisite in mind (use on individual site basis)
* Built with developers in mind — API architecture supports future external data sources

Whether you’re building comparison tables, product listings, directory lookup tables or publishing data-rich content — Dynamic Tables gives you a simple, elegant solution.

== Features ==
* Gutenberg native block: “Dynamic Table”
* Add / delete / reorder columns and rows
* Header row support + header grid lines
* Adjustable column widths (and row heights)
* Inline editing of cell text
* Fully responsive: tables scale, wrap and adapt to mobile screens
* Works on multisite installations (activate per site)
* Clean semantic HTML output for SEO and accessibility
* Lightweight footprint and compatible with most themes
* Future-ready API layer for importing external data sources (in roadmap)

== Why Choose Dynamic Tables over the Default Table Block? ==

The default WordPress Table block is well-suited for simple, static tables. However, as content becomes more structured or data-driven, its limitations become more apparent.

Dynamic Tables is designed specifically for tables that require ongoing updates, consistent structure, and reliable responsive behavior.

With Dynamic Tables you can:
* Edit table content inline without rebuilding the table
* Maintain consistent column and row structure as content evolves
* Present data in a way that remains readable across desktop and mobile devices
* Build tables intended for comparisons, listings, and structured datasets
* Avoid the need for shortcode-based table plugins or external builders

If your use case goes beyond basic layout tables and into repeatable, data-oriented content, Dynamic Tables provides a purpose-built solution that stays fully native to the block editor.

== Roadmap ==
Some roadmap highlights include:
* Integrating Dynamic Tables with WordPress search
* Allowing for specific content types and formats for all rows in a column (e.g, images, links, buttons, numeric formats, etc.) without the need to format each cell
* Support for front end interactivity to sort and filter tables
* Importing in common formats (e.g., csv, xlsx)
* Enhanced responsive formatting for mobile devices
* Front end editing

== For Wordpress Developers ==
Dynamic Blocks has an architecture that is somewhat unique to the world of Gutenberg development in that the table definition and content are stored in custom WordPress database tables because we didn't believe it structurally lent itself well to the Post data metaphore.  These are the primary building blocks:
* Table data and definitions are abstracted through block entity types
* Entities natively call RESTful api's
* There is an underlying WordPress REST API service that supports the loading and saving of table data
* The service interacts with a highly abstracted SQL layer which leverages WordPress WPDB
* The tables themselves leverage the newer CSS grid framework
  * Much of the flexibility is derived from grid functinality that has been incorporated into mainstream web browsers as recently as 2024
  * This framework provides responsiveness that doesn't "break" table structure.  Misalighed rows and columns, unexpected wrapping, and otherwise indecipherable tables have been beaten down.
* The API architecture can theoretically support data stored in external files or web services. We're considering these capabilities in our roadmap.

== Installation ==
1. In your WordPress dashboard, go to **Plugins → Add New**, search for *Dynamic Tables*, click **Install Now** and then **Activate**.
2. Alternatively: Download the ZIP file from the WordPress Plugin Directory. Upload it via **Plugins → Add New → Upload Plugin**, install and activate.
3. After activation, open any post or page, click the **+** button in the block editor and insert the “Dynamic Table” block.
4. Start building your table: add columns and rows, set header options, adjust widths, edit content, enable sorting.
> **Note:** On multisite installations the plugin must be activated on each site where it is used (network-activation is not supported).
> **Important:** Deactivating and deleting the plugin does *not* auto-remove stored tables. However, there is an setting to support the removal of stored tables. Re-activating restores existing tables in posts.

== Frequently Asked Questions ==
= Can I import data from CSV or Excel? =
Not yet in this version. The architecture for external data sources is in the roadmap, and upcoming versions will include more import/export options.

= Will this work with any theme? =
Yes. Dynamic Tables outputs semantic HTML and relies on standard CSS. It should be compatible with virtually all well-coded themes.

= How do I enable sorting for visitors? =
In the block settings, check the “Sortable” option. Then publish your page. On the front-end your visitors will see column headers that can be clicked to sort ascending/descending.

= Does this work on mobile devices? =
Yes. The responsive behavior ensures tables resize, wrap or scroll appropriately to maintain readability on smaller screens.

= Is there a fee to use this plugin? =
No. This plugin is free to use. However, we are planning for a premium version of Dynamic Tables to support advanced features.

= What happens if I deactivate or delete the plugin? =
If you deactivate, your tables will still appear in posts but may render incorrectly or as plain HTML. Deleting the plugin does *not* clean up the custom database tables by default—this is to prevent data loss. If you wish to remove old data, consult the documentation or support forums.

== Screenshots ==

1. Create a new Dynamic Table block
2. Format specific table text
3. Insert columns and rows
4. Format header row if one exists
5. Format header grid lines
6. Format table body
7. Set column width (corresponding configuration is available for rows too)

== Changelog ==

= 1.1.1 =
* Add keyboard navigation through table cells via arrow keys
* Added a visual indicator to easily identify what cell you're currently editing
* Refactor editor to break out Cell as its own component in support of future enhancements
* Support for table exports that can be used for backup and recovery

= 1.1.0 =
* Fix bug that caused fatal error when editing post with "Show Template" enabled
* Support for post templates and patterns.
* Created scheduled maintenance to ensure posts and tables are internally consistent
* Automatically remove tables when their underying posts are deleted from the admin page
* Provide visibility to all tables, their status, associated post, and to view the table data
* Bump support for WordPress 6.9

= 1.0.0 =
* Initial Release
