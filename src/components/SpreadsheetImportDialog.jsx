import React, { useState, useCallback, useRef } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, Select, MenuItem, Chip, Alert,
  LinearProgress, Stack, Divider, IconButton, Tooltip,
  Avatar, CircularProgress,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import HowToRegIcon from "@mui/icons-material/HowToReg";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const CORE_DB_FIELDS = [
  "Name", "Surname", "Email", "Number", "Gender", "Address",
  "Birthday", "InvitedBy", "Stage", "DecisionType", "DecisionDate",
  "LastDecisionDate", "FirstDecisionDate", "Org_id",
];

export default function SpreadsheetImportDialog({
  open,
  onClose,
  orgId,
  eventId,
  authFetch,
  onImportComplete,
  orgLeaderFields = [],
}) {
  const fileRef = useRef(null);
  const [step, setStep] = useState("upload"); // upload | mapping | importing | done
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({});
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setPreview(null);
    setMapping({});
    setImportResult(null);
    setError(null);
    setIsLoading(false);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // Step 1 — upload file, get preview + detected mapping
  const handleFileUpload = useCallback(async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", f);

      const url =
        `${BASE_URL}/people/import-spreadsheet?org_id=${encodeURIComponent(orgId || "")}` +
        `${eventId ? `&event_id=${eventId}` : ""}`;

      const res = await authFetch(url, { method: "POST", body: formData });
      const data = await res.json();

      if (!data.success) throw new Error(data.detail || "Failed to parse file");

      const initialMapping = {};
      Object.entries(data.detected_mapping).forEach(([col, db]) => {
        initialMapping[col] = db || "";
      });
      setMapping(initialMapping);
      setPreview(data);
      setStep("mapping");
    } catch (err) {
      setError(err.message || "Failed to upload file");
    } finally {
      setIsLoading(false);
    }
  }, [orgId, eventId, authFetch]);

  // Step 2 — confirm mapping, trigger import
  const handleConfirmImport = useCallback(async () => {
    setIsLoading(true);
    setStep("importing");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const url =
        `${BASE_URL}/people/import-spreadsheet` +
        `?org_id=${encodeURIComponent(orgId || "")}` +
        `${eventId ? `&event_id=${eventId}` : ""}` +
        `&column_mapping=${encodeURIComponent(JSON.stringify(mapping))}`;

      const res = await authFetch(url, { method: "POST", body: formData });
      const data = await res.json();

      if (!data.success) throw new Error(data.detail || "Import failed");

      setImportResult(data.results);
      setStep("done");
      onImportComplete?.(data.results);
    } catch (err) {
      setError(err.message || "Import failed");
      setStep("mapping");
    } finally {
      setIsLoading(false);
    }
  }, [file, orgId, eventId, mapping, authFetch, onImportComplete]);

  const unmatchedCount = preview
    ? Object.values(mapping).filter((v) => !v).length
    : 0;

  // Merge org leader fields from both the prop and the preview response
  const leaderFields = [
    ...(orgLeaderFields || []),
    ...((preview?.org_leader_fields || []).filter(
      (pf) => !(orgLeaderFields || []).some((of) => of.db_field === pf.db_field)
    )),
  ];

  // All available DB fields for the dropdown (deduplicated)
  const availableDbFields = [
    ...new Set([
      ...CORE_DB_FIELDS,
      ...leaderFields.map((f) => f.db_field),
      ...(preview?.available_db_fields || []),
    ]),
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { maxHeight: "90vh", borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
            <UploadFileIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography fontWeight={700}>Import People</Typography>
            <Typography variant="caption" color="text.secondary">
              Upload a spreadsheet to add people in bulk
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ overflowY: "auto", p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* ── STEP: upload ── */}
        {step === "upload" && !isLoading && (
          <Box
            sx={{
              textAlign: "center", py: 6, px: 4,
              border: "2px dashed", borderColor: "divider", borderRadius: 3,
              cursor: "pointer", transition: "all 0.2s",
              "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
            }}
            onClick={() => fileRef.current?.click()}
          >
            <UploadFileIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Drop your spreadsheet here
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Supports .xlsx, .xls, .csv — columns auto-detected using{" "}
              <strong>{orgId || "your org"}</strong>'s field config
            </Typography>
            <Button variant="contained" size="large" startIcon={<UploadFileIcon />}>
              Choose File
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={handleFileUpload}
            />
          </Box>
        )}

        {/* ── STEP: parsing ── */}
        {isLoading && step !== "importing" && (
          <Box py={6} textAlign="center">
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body1" fontWeight={500} gutterBottom>
              Parsing file…
            </Typography>
            <LinearProgress sx={{ maxWidth: 400, mx: "auto", mt: 1 }} />
          </Box>
        )}

        {/* ── STEP: mapping ── */}
        {step === "mapping" && preview && (
          <Box>
            {/* Summary chips */}
            <Stack direction="row" spacing={1.5} mb={3} flexWrap="wrap" gap={1}>
              <Chip label={`${preview.total_rows} rows`} color="primary" size="small" />
              <Chip label={`${preview.spreadsheet_columns.length} columns detected`} size="small" />
              {unmatchedCount > 0 ? (
                <Chip
                  icon={<WarningIcon />}
                  label={`${unmatchedCount} column${unmatchedCount > 1 ? "s" : ""} need mapping`}
                  color="warning"
                  size="small"
                />
              ) : (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="All columns matched"
                  color="success"
                  size="small"
                />
              )}
            </Stack>

            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Column Mapping
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Each spreadsheet column maps to a database field. Highlighted rows need
              attention. Set to <em>Ignore</em> to skip a column entirely.
            </Typography>

            {/* Mapping table */}
            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden", mb: 3 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: "38%", bgcolor: "action.hover" }}>
                      Spreadsheet Column
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: "8%", textAlign: "center", bgcolor: "action.hover" }}>
                      →
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: "54%", bgcolor: "action.hover" }}>
                      Database Field
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.spreadsheet_columns.map((col) => (
                    <TableRow
                      key={col}
                      sx={{
                        bgcolor: !mapping[col] ? "warning.light" : "inherit",
                        opacity: !mapping[col] ? 0.9 : 1,
                        transition: "background-color 0.2s",
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{col}</Typography>
                        {preview.preview_rows[0]?.[col] && (
                          <Typography variant="caption" color="text.secondary">
                            e.g. "{preview.preview_rows[0][col]}"
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {mapping[col] ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <WarningIcon color="warning" fontSize="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          size="small"
                          fullWidth
                          value={mapping[col] || ""}
                          onChange={(e) =>
                            setMapping((prev) => ({ ...prev, [col]: e.target.value }))
                          }
                        >
                          <MenuItem value="">
                            <em>— Ignore this column —</em>
                          </MenuItem>
                          <Divider />

                          {/* Core fields */}
                          <MenuItem disabled>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>
                              CORE FIELDS
                            </Typography>
                          </MenuItem>
                          {CORE_DB_FIELDS.map((f) => (
                            <MenuItem key={f} value={f}>{f}</MenuItem>
                          ))}

                          {/* Org-specific leader fields */}
                          {leaderFields.length > 0 && (
                            <>
                              <Divider />
                              <MenuItem disabled>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                  LEADER FIELDS {orgId ? `(${orgId})` : ""}
                                </Typography>
                              </MenuItem>
                              {leaderFields.map(({ db_field, label }) => (
                                <MenuItem key={db_field} value={db_field}>
                                  {label}
                                  {label !== db_field && (
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                      ({db_field})
                                    </Typography>
                                  )}
                                </MenuItem>
                              ))}
                            </>
                          )}

                          {/* Any extra DB fields from backend */}
                          {(preview.available_db_fields || []).filter(
                            (f) =>
                              !CORE_DB_FIELDS.includes(f) &&
                              !leaderFields.some((lf) => lf.db_field === f)
                          ).length > 0 && (
                            <>
                              <Divider />
                              <MenuItem disabled>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                  OTHER FIELDS
                                </Typography>
                              </MenuItem>
                              {(preview.available_db_fields || [])
                                .filter(
                                  (f) =>
                                    !CORE_DB_FIELDS.includes(f) &&
                                    !leaderFields.some((lf) => lf.db_field === f)
                                )
                                .map((f) => (
                                  <MenuItem key={f} value={f}>{f}</MenuItem>
                                ))}
                            </>
                          )}
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            {/* Data preview */}
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Data Preview (first 5 rows)
            </Typography>
            <Box
              sx={{
                overflowX: "auto",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {preview.spreadsheet_columns.map((col) => (
                      <TableCell
                        key={col}
                        sx={{ fontWeight: 600, whiteSpace: "nowrap", minWidth: 100, bgcolor: "action.hover" }}
                      >
                        {col}
                        {mapping[col] && (
                          <Typography variant="caption" display="block" color="success.main">
                            → {mapping[col]}
                          </Typography>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(preview.preview_rows || []).map((row, i) => (
                    <TableRow key={i} hover>
                      {preview.spreadsheet_columns.map((col) => (
                        <TableCell key={col} sx={{ whiteSpace: "nowrap" }}>
                          <Typography variant="body2">{row[col] || "—"}</Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}

        {/* ── STEP: importing ── */}
        {step === "importing" && (
          <Box py={6} textAlign="center">
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Importing people…
            </Typography>
            <LinearProgress sx={{ mt: 2, maxWidth: 400, mx: "auto" }} />
            <Typography variant="body2" color="text.secondary" mt={2}>
              This may take a moment for large files.
            </Typography>
          </Box>
        )}

        {/* ── STEP: done ── */}
        {step === "done" && importResult && (
          <Box py={2}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Import complete! The people list will refresh automatically.
            </Alert>

            {/* Result summary */}
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" gap={1} mb={3}>
              <Chip
                icon={<AddIcon />}
                label={`${importResult.inserted} added`}
                color="success"
                variant="filled"
              />
              <Chip
                icon={<EditIcon />}
                label={`${importResult.updated} updated`}
                color="primary"
                variant="filled"
              />
              <Chip
                label={`${importResult.skipped} skipped`}
                color="default"
                variant="outlined"
              />
              {importResult.errors?.length > 0 && (
                <Chip
                  icon={<WarningIcon />}
                  label={`${importResult.errors.length} error${importResult.errors.length > 1 ? "s" : ""}`}
                  color="error"
                  variant="filled"
                />
              )}
            </Stack>

            {/* Row errors */}
            {importResult.errors?.length > 0 && (
              <Box
                sx={{
                  p: 2, bgcolor: "error.light", borderRadius: 2,
                  border: "1px solid", borderColor: "error.main",
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} color="error.dark" gutterBottom>
                  Row Errors
                </Typography>
                {importResult.errors.slice(0, 10).map((e, i) => (
                  <Typography key={i} variant="caption" display="block" color="error.dark">
                    Row {e.row}: {e.error}
                  </Typography>
                ))}
                {importResult.errors.length > 10 && (
                  <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                    …and {importResult.errors.length - 10} more error(s)
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        {step === "mapping" && (
          <>
            <Button onClick={reset} variant="outlined" size="medium">
              ← Re-upload
            </Button>
            <Box sx={{ flex: 1 }} />
            {unmatchedCount > 0 && (
              <Typography variant="caption" color="warning.main" sx={{ alignSelf: "center", mr: 1 }}>
                {unmatchedCount} column{unmatchedCount > 1 ? "s" : ""} will be ignored
              </Typography>
            )}
            <Button
              onClick={handleConfirmImport}
              variant="contained"
              size="medium"
              startIcon={<HowToRegIcon />}
              disabled={isLoading}
            >
              Import {preview?.total_rows} People
            </Button>
          </>
        )}

        {step === "done" && (
          <Button onClick={handleClose} variant="contained" size="medium">
            Done
          </Button>
        )}

        {(step === "upload" || step === "importing" || step === "parsing") && (
          <Button onClick={handleClose} variant="outlined" size="medium">
            Cancel
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}