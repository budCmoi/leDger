import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import type { MetricPoint } from '../../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface RevenueLineChartProps {
  points: MetricPoint[];
}

export const RevenueLineChart = ({ points }: RevenueLineChartProps) => {
  return (
    <Line
      data={{
        labels: points.map((point) => point.month),
        datasets: [
          {
            label: 'Revenue',
            data: points.map((point) => point.value),
            borderColor: '#F5C65B',
            backgroundColor: 'rgba(245, 198, 91, 0.18)',
            fill: true,
            tension: 0.42,
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            ticks: { color: 'rgba(255,255,255,0.45)' },
            grid: { color: 'rgba(255,255,255,0.06)' },
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