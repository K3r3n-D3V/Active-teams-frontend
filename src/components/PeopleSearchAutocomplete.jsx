import { useState, useEffect, useRef } from "react";
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Popper,
} from "@mui/material";

const SameWidthPopper = (props) => {
  const { anchorEl } = props;
  const width =
    anchorEl && typeof anchorEl.getBoundingClientRect === "function"
      ? anchorEl.getBoundingClientRect().width
      : undefined;

  return <Popper {...props} style={{ width, zIndex: 20000 }} />;
};

function PeopleSearchAutocomplete({
  label,
  value,
  inputValue,
  onInputChange,
  onChange,
  authFetch,
  backendUrl,
  placeholder,
  error,
  helperText,
  disabled,
  required,
  sx,
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (!inputValue?.trim() || inputValue.trim().length < 2) {
      setOptions([]);
      setSearchError("");
      setLoading(false);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setLoading(true);
      setSearchError("");

      try {
        const response = await authFetch(
          `${backendUrl}/people/search-fast?query=${encodeURIComponent(
            inputValue.trim(),
          )}&limit=25`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        const results = Array.isArray(data?.results) ? data.results : [];

        const formatted = results.map((person) => ({
          id: person._id,
          fullName:
            person.FullName ||
            `${person.Name || ""} ${person.Surname || ""}`.trim(),
          email: person.Email || person.email || "",
          subtitle: person.Role || person.role || person.Title || "",
          leader1: person["Leader @1"] || person.leader1 || "",
          leader12: person["Leader @12"] || person.leader12 || "",
          leader144: person["Leader @144"] || person.leader144 || "",
          leaderValues: {
            leader1: person["Leader @1"] || person.leader1 || "",
            leader12: person["Leader @12"] || person.leader12 || "",
            leader144: person["Leader @144"] || person.leader144 || "",
          },
        }));

        setOptions(formatted);
      } catch (err) {
        if (
          err?.name === "AbortError" ||
          err?.message?.toLowerCase()?.includes("aborted")
        ) {
          return;
        }
        setSearchError("Could not load leader suggestions");
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [inputValue, authFetch, backendUrl]);

  return (
    <Autocomplete
      fullWidth
      disabled={disabled}
      value={value || null}
      inputValue={inputValue || ""}
      onInputChange={(event, newInputValue, reason) => {
        if (reason === "reset") return;
        onInputChange?.(newInputValue);
      }}
      onChange={(_, newValue) => {
        onChange?.(newValue || null);
      }}
      options={options}
      getOptionLabel={(option) => option?.fullName || ""}
      isOptionEqualToValue={(option, selected) =>
        Boolean(option?.id && selected?.id && option.id === selected.id)
      }
      noOptionsText={
        inputValue?.trim().length < 2
          ? "Type 2 or more characters to search"
          : searchError || "No matching leaders found"
      }
      loading={loading}
      PopperComponent={SameWidthPopper}
      renderOption={(props, option) => (
        <li {...props} key={option.id || option.fullName}>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography variant="body2" fontWeight={500}>
              {option.fullName}
            </Typography>
            {(option.subtitle || option.email) && (
              <Typography variant="caption" color="text.secondary">
                {[option.subtitle, option.email].filter(Boolean).join(" • ")}
              </Typography>
            )}
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={!!error}
          helperText={error || helperText}
          size="small"
          sx={sx}
          required={required}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          inputProps={{
            ...params.inputProps,
            autoComplete: "off",
          }}
        />
      )}
    />
  );
}

export default PeopleSearchAutocomplete;
