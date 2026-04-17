import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

import type { DashboardSummary } from '../../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ExpenseDoughnutChartProps {
  categories: DashboardSummary['expenseCategories'];
}

const palette = ['#F5C65B', '#FF8C61', '#5BC0FF', '#7AE7C7', '#FFFFFF'];

export const ExpenseDoughnutChart = ({ categories }: ExpenseDoughnutChartProps) => {
  return (
    <Doughnut
      data={{
        labels: categories.map((item) => item.label),
        datasets: [
          {
            data: categories.map((item) => item.value),
            backgroundColor: categories.map((_, index) => palette[index % palette.length]),
            borderWidth: 0,
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255,255,255,0.55)',
              padding: 18,
            },
          },
        },
        cutout: '72%',
      }}
    />
  );
};