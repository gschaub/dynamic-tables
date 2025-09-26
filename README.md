# Dynamic Tables #
**Contributors:** [glschaub](https://profiles.wordpress.org/glschaub/)  
**Tags:**              block, table, responsive  
**Tested up to:**      6.1  
**Stable tag:**        1.0.0  
**License:**           GPL-2.0-or-later  
**License URI:**       https://www.gnu.org/licenses/gpl-2.0.html  

Create highly responsive custom table blocks that are easily configured.

## Description ##

Built from the ground up based upon the latest technology and designed to support WordPress' vision for the platform's
future,  **Dynamic Tables** is a new WordPress block plugin to create and manage information that is best organized
as a table. The block is designed to be easily configured and highly responsive.

Dynamic Tables was created on a solid technical framework with the objective of delivering a complete end-to-end
block solution for creating beautiful tables that are easy to maintain.  Additionally, this famework will provide a
springboard to rapidly build upon this foundation to provide additional features.  Some capabilities on the
roadmap include:
* Support for front end interactivity to sort and filter tables
* Integrating Dynamic Tables with WordPress search
* Allowing for specific content types and formats for all rows in a column (e.g, images, links, buttons, numeric formats, etc.) without the need to format each cell
* Importing and exporting table data in common formats (e.g., cvs, xlsx)
* Enhanced responsive formatting for mobile devices
* Front end editing

This is just a sample of the roadmap, some of which will be included in this free community edition while others will be available in a future premium version of Dynamic Tables.

### Formatting Features
* Column & Row Actions
  * "Show table borders" creates a spreadsheet metephore for intuitive column and row formatting. Toggle the boarders off when formats are set
  * Menu options to add or delete columns and rows
  * Fine grain control of column widths including support for:
    * Proportional or fix widths
	* Minimum and maximum widths so that text wraps appropriately, automatically adjusting row height
    * Supports both fixed (e.g., pixel) and inferred (e.g., character) sizing units
* Header
  * Optionally allow the first row to be a header
  * Optionally freeze headers with a vertical scrollbar
  * Support styling for the header row including borders and text alignment independently from table body rows
* Body Rows
  * Optionally display table grid licenses
  * Optionally display banded rows with styling for the band and text color
  * Allow for a horizontal scroll if table contents exceed the page width
  * Support styling for all body rows including borders and text alignment
* All color styling comes pre-loaded with the current theme colors with support for custom colors as well
* Optionally display or hide table title

### Love You Inner Geek!
This information will be appealing to our techie friends, soothing their passion for embracing the technology.  Dynamic Blocks has an
architecture that is somewhat unique to the world of Gutenberg development in that the table definition and content are stored in
custom WordPress database tables because we didn't believe it structurally lent itself well to the Post data metephore.  These are
the primary building blocks:
* Table data and definitions are abstracted through a block entity types
* Entities natively call RESTful api's
* There is an underlying WordPress REST API service that supports the loading and saving of table data
* The service interacts with a highly abstracted SQL layer which leverages WordPress WPDB
* The tables themselves leverage the newer CSS grid framework
  * Much of the flexibility is derived from grid functinality that has been incorporated into mainstream web browsers as recently as 2024
  * This framework provides responsiveness that doesn't "break" table structure.  Misalighed rows and columns, unexpected wrapping, and otherwise indecipherable tables have been beaten down.
* The API architecture can theoretically support data stored in external files or web services. We're considering these capcbilities in our roadmap.

## Installation ##
#### Option 1: Through the Wordpress Plugin Directory
1. Locate the plugin from the directory
1. Click `Install Now`
1. Activate the plugin

#### Option 2: Manually load the plugin .zip file
1. Navigate to the `Pluging > Add Plugins Page`
1. Press the `Upload Plugins` buttons
1. Select the `dynamic-tables.zip` file and click `Install Now`
1. Activate the plugin through the 'Plugins' screen in WordPress

**Important Notes:**
* Dynamic Tables contains support for Wordpress MultiSite.  However, it cannot be network activated.  Therefore, navigate to the specific site(s) on which it will be used and activate the plugin from there.
* The Dynamic Tables database tables are not removed by default if the plugin is deleted
  * Deleting the tables will break each Post that contains a table block upon deactivation
  * Reinstalling and activating Dynamic Tables will restore the Posts
  * We strongly encourage you to delete any table blocks from existing posts prior to permenately deleting Dynamic Tables
  * There is a Dynamic Tables Administrative menu to provide an option to delete the underlying database tables upon its deletion
  * Dynamic Tables blocks cannot be restored if the underlying tables are deleted without performing a database restore
  * We plan to provide an export option in the future that will make retrieval backup and restoration of Dynamic Tables much easier.

## Screenshots ##

1. Create a new Dynamic Table block
2. Format specific table text
3. Insert columns and rows
4. Format header row if one exists
5. Format header grid lines
6. Format table body
7. Set column width (corresponding configuration is available for rows too)

## Changelog ##

### 1.0.0 ###
* Initial Release
