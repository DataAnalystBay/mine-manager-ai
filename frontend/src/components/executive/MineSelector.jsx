import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";

function MineSelector({ selectedMine, setSelectedMine }) {
  const mines = [
    "Oyu Tolgoi Surface",
    "Oyu Tolgoi Underground",
    "Oyu Tolgoi Concentrator",
    "Erdenet",
    "Tavan Tolgoi",
  ];

  const handleChange = (event) => {
    setSelectedMine(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 260 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="mine-selector-label">Mine</InputLabel>

        <Select
          labelId="mine-selector-label"
          value={selectedMine}
          label="Mine"
          onChange={handleChange}
        >
          {mines.map((mine) => (
            <MenuItem key={mine} value={mine}>
              {mine}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export default MineSelector;