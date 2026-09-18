Reconstructed EditCellContentModal proposal

The original temporary patch and before/after snapshots were deleted. These files reconstruct the previously proposed behavior from the conversation and the surviving integration. They are not a byte-for-byte recovery.

edit-cell-content-modal-reconstructed.patch
  Reference diff against Git commit cbcba3511e2a446120e04dd313f1806b4a860325.
  Includes the five proposed files. Because the original uncommitted baseline is unavailable, this diff also includes changes between that commit and the original review baseline. It is for reference; it is not an incremental patch for the already integrated working tree.

edit-cell-content-modal-vs-current.patch
  Comparison of the working files read on 2026-09-16 with the reconstructed proposal.
  Shows remaining integration differences, including intentional user deviations. Review those deviations before adopting them. In particular, the proposal uses normalizeAttributes, recovers legacy cached post URLs, normalizes post refs as arrays, and refreshes a post during save only if the cached URL is missing.

Source files were not modified. Both diffs were checked by reconstructing their target content from the emitted hunks. JavaScript lint reported no errors; its import/named warning for normalizeAttributes reflects resolution against the current working-tree helper name, while the proposed helper exports normalizeAttributes. This reconstruction was not browser-tested.

Comparison diff revised to preserve all comments and console statements from the current working files. Those lines may appear as unchanged context. The full reconstructed reference diff remains historical; use the revised vs-current patch for continued integration. The revised proposal was parsed and its patch hunks verified; source files were not modified.
