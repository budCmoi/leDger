import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';

import type { TrendPoint } from '../../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface TrendBarChartProps {
  points: TrendPoint[];
}

export const TrendBarChart = ({ points }: TrendBarChartProps) => {
  return (
    <Bar
      data={{
        labels: points.map((point) => point.month),
        datasets: [
          {
            label: 'Income',
            data: points.map((point) => point.income),
            backgroundColor: '#7AE7C7',
            borderRadius: 999,
          },
          {
            label: 'Expenses',
            data: points.map((point) => point.expenses),
            backgroundColor: '#FF8C61',
            borderRadius: 999,
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: 'rgba(255,255,255,0.55)' },
          },
        },
        scales: {
          x: {
            ticks: { color: 'rgba(255,255,255,0.45)' },
            grid: { display: false },
          },
          y: {
            ticks: { color: 'rgba(255,255,255,0.45)' },
            grid: { color: 'rgba(255,255,255,0.06)' },
          },
        },
      }}
    />
  );
};