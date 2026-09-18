# Reusable combobox proposal

Apply the three-file diff together. No source files were changed while preparing it.

- src/hooks/use-latest-request.js moves the existing request hook out of the modal. It retains requestHandler and request naming.
- src/hooks/use-async-combobox.js owns one picker's selected option, results, loading flags, errors, and separate search and selection requests.
- The modal supplies WordPress search/lookup functions, retains its ComboboxControl markup and content-type switches, and passes resolved changes through updateCellValue. Its existing save-time resolution and commit flow remain in place.

## Callback contract

searchOptions(text, { signal }) returns an array of ComboboxControl options. Each selectable option has a string value and a label. Source-specific properties such as postType may travel with it.

resolveOption(option, { signal }) returns { option, data }. The returned option contains the current label; data is the item passed to onChange. If a source needs no further lookup, this callback can return the supplied option as both option and data.

onChange(data) applies a resolved selection. Clearing calls onChange(null). The reusable hook does not know the Cell shape.

refresh(callback) retrieves the current selection again and calls the supplied callback instead of the usual onChange. The post checkbox uses this to send both the checked value and retrieved post to updateCellValue.

## Adding another combobox

1. Call useAsyncCombobox again, unconditionally, alongside the existing hook call. Supply that picker's initial option, search callback, lookup callback, and cell-update callback.
2. Bind its own value/options/loading/search/select methods to the second ComboboxControl, and display its own errors. Retain the saving guard in its event handlers, as the post handlers do.
3. Include the instance in the modal's comboboxes array when that picker is active. This includes it in pending-selection save checks, loading feedback, cancellation, and search cancellation before save.
4. Add its content-specific value update and validation to the existing switches. The hook deliberately does not decide which selections are required or how they map to Cell attributes.

Each hook invocation is independent, including when both pickers search the same source and their option IDs overlap. No registry or additional persisted state is introduced.

## Verification

Mocked hook tests covered two simultaneous picker instances, independent search/selection/loading, superseded and short searches, refresh, clearing during lookup, selection failure/retry, and unmount cancellation. Modal tests covered post updates, checkbox changes, transient URL handling, metadata/class preservation, and save/cancel coordination with two picker instances.

Patch hunks were checked against their source snapshots and reconstructed the proposed files exactly. New hooks were linted; existing unused declarations and legacy documentation findings are not removed by this change. Imports of staged hook files were resolved explicitly during verification because the files have not been applied to the workspace.

No browser or WordPress UI test was performed.
