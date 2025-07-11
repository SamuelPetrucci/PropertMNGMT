import React from 'react';
import { Box, Typography, Stack, TextField } from '@mui/material';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFE', '#FF6699'];

function ProjectionCalculator({ properties = [] }) {
  const [growthRate, setGrowthRate] = React.useState(0.03); // 3% default
  const [projectionYears, setProjectionYears] = React.useState(10);

  function getProjectionData() {
    const years = Array.from({ length: projectionYears + 1 }, (_, i) => i);
    return properties.map((property) => {
      const initialValue = property.mortgage?.amount ? Number(property.mortgage.amount) : 0;
      return {
        name: property.name,
        values: years.map((year) => ({
          year,
          value: initialValue * Math.pow(1 + growthRate, year),
        })),
      };
    });
  }
  const projectionData = getProjectionData();

  const chartData = Array.from({ length: projectionYears + 1 }, (_, i) => {
    const row = { year: i };
    projectionData.forEach((prop) => {
      row[prop.name] = prop.values[i].value;
    });
    return row;
  });

  return (
    <Box sx={{ width: '100%', mt: 6 }}>
      <Typography variant="h6" mb={2}>Property Value Projection</Typography>
      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <TextField
          label="Annual Growth Rate (%)"
          type="number"
          value={growthRate * 100}
          onChange={e => setGrowthRate(Number(e.target.value) / 100)}
          size="small"
          inputProps={{ min: 0, max: 100, step: 0.1 }}
          sx={{ width: 180 }}
        />
        <TextField
          label="Projection Years"
          type="number"
          value={projectionYears}
          onChange={e => setProjectionYears(Number(e.target.value))}
          size="small"
          inputProps={{ min: 1, max: 50, step: 1 }}
          sx={{ width: 150 }}
        />
      </Stack>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <XAxis dataKey="year" tickFormatter={v => `${v} yr`} />
          <YAxis tickFormatter={v => typeof v === 'number' ? `$${Math.round(v).toLocaleString()}` : 'N/A'} />
          <Tooltip formatter={v => typeof v === 'number' ? `$${Math.round(v).toLocaleString()}` : 'N/A'} labelFormatter={v => `Year ${v}`} />
          <Legend />
          {projectionData.map((prop, idx) => (
            <Line
              key={prop.name}
              type="monotone"
              dataKey={prop.name}
              stroke={COLORS[idx % COLORS.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

export default ProjectionCalculator; 