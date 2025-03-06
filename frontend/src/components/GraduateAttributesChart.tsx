/*
Source code for LISU CCM @UofG
Copyright (C) 2025 Maxine Armstrong, Ibrahim Asghar, Finlay Cameron, Colin Nardo, Rachel Horton, Qikai Zhou

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program at /LICENSE.md. If not, see <https://www.gnu.org/licenses/>.
*/

import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { Table } from 'flowbite-react';
import { CustomBadge } from './CustomBadge';
import { ApexOptions } from 'apexcharts';
import fontColorContrast from 'font-color-contrast';

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
      width: 800,
      height: 500,
      type: 'pie',
      animations: {
        enabled: true,
        dynamicAnimation: {
          speed: 350,
        },
      },
    },
    labels: data.labels,
    colors: data.colors,
    legend: {
      position: 'right',
      fontSize: '14px',
      markers: {
        width: 10,
        height: 10,
        radius: 5,
      },
      itemMargin: {
        horizontal: 5,
        vertical: 3,
      },
      containerMargin: {
        left: 0,
        top: 0,
      },
      // eslint-disable-next-line
      formatter: function (seriesName: string, opts?: any) {
        const value = opts.w.globals.series[opts.seriesIndex];
        const color = value > 0 ? data.colors[opts.seriesIndex] : '#6c757d';
        const style =
          value > 0
            ? `color: ${color}; font-weight: bold;`
            : `color: ${color}; font-style: italic;`;
        return `<span style="${style}">${seriesName}${value > 0 ? `: ${value}` : ''}</span>`;
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      custom: function ({ seriesIndex, w }) {
        const hexColor = w.globals.colors[seriesIndex];
        const textColor = fontColorContrast(hexColor, 0.7);
        const label = w.globals.labels[seriesIndex];

        return (
          `<div style="background-color: ${hexColor}; padding: 8px; border-radius: 4px;">` +
          `<span style="color: ${textColor}; font-size: 14px;">${label} </span>` +
          '</div>'
        );
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 400,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
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
                    <span
                      style={{
                        color: data.colors[index],
                        fontWeight: data.series[index] > 0 ? 'bold' : 'normal',
                      }}
                    >
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
          <ReactApexChart options={chartOptions} series={data.series} type="pie" width={600} />
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
