import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { Table } from 'flowbite-react';
import { CustomBadge } from './CustomBadge';
import { ApexOptions } from 'apexcharts';

interface GraduateAttributesChartProps {
  data: {
    labels: string[];
    series: number[];
    colors: string[];
  };
  showTable: boolean;
  toggleShowTable: () => void;
}

const GraduateAttributesChart: React.FC<GraduateAttributesChartProps> = ({
  data,
  showTable,
  toggleShowTable,
}) => {
  const chartOptions: ApexOptions = {
    chart: {
      width: 600,
      height: 600,
      type: 'pie',
      animations: {
        enabled: true,
        dynamicAnimation: {
          speed: 350
        }
      }
    },
    labels: data.labels,
    colors: data.colors,
    legend: {
      position: 'right',
      height: 600,
      fontSize: '14px',
      markers: {
        width: 12,
        height: 12,
        radius: 6
      },
      formatter: function(seriesName: string, opts?: any) {
        const value = opts.w.globals.series[opts.seriesIndex];
        const color = data.colors[opts.seriesIndex];
        const style = value > 0 
          ? `color: ${color}; font-weight: bold;` 
          : `color: ${color}; opacity: 0.5; font-style: italic;`;
        return `<span style="${style}">${seriesName}${value > 0 ? `: ${value}` : ''}</span>`;
      }
    },
    dataLabels: {
      enabled: false
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 600
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    ]
  };

  return (
    <div>
      {showTable ? (
        <div className="overflow-x-auto">
          <Table striped>
            <Table.Head>
              <Table.HeadCell>
                <CustomBadge label="Graduate Attribute" colorMapping={{ default: '#6c757d' }} />
              </Table.HeadCell>
              <Table.HeadCell>
                <CustomBadge label="Count" colorMapping={{ default: '#6c757d' }} />
              </Table.HeadCell>
            </Table.Head>
            <Table.Body style={{ textAlign: 'center' }}>
              {data.labels.map((label, index) => (
                <Table.Row key={index}>
                  <Table.Cell>
                    <span style={{ color: data.colors[index], fontWeight: data.series[index] > 0 ? 'bold' : 'normal' }}>
                      {label}
                    </span>
                  </Table.Cell>
                  <Table.Cell>{data.series[index]}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      ) : (
        <div id="chart">
          <ReactApexChart
            options={chartOptions}
            series={data.series}
            type="pie"
            width={600}
          />
        </div>
      )}
      <button
        onClick={toggleShowTable}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        {showTable ? 'Show Chart' : 'Show Table'}
      </button>
    </div>
  );
};

export default GraduateAttributesChart;
