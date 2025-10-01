import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField } from '@mui/material';

function LeaderSelect({ label, value, onChange }) {
  const [options, setOptions] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (search.length < 2) {
      setOptions([]);  // Clear options if search too short
      return;
    }

    fetch(`/api/people?search=${search}`)
      .then(res => res.json())
      .then(data => setOptions(data))
      .catch(console.error);
  }, [search]);

  return (
    <Autocomplete
      options={options}
      getOptionLabel={(option) => option.name || ""}
      onInputChange={(event, value) => setSearch(value)}
      onChange={(event, value) => onChange(value)}
      value={value}
      renderInput={(params) => <TextField {...params} label={label} />}
      isOptionEqualToValue={(option, value) => option._id === value?._id}
    />
  );
}

export default LeaderSelect;
