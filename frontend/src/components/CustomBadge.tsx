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

import { Badge } from 'flowbite-react';
import fontColorContrast from 'font-color-contrast';

interface CustomBadgeProps {
  label: string;
  colorMapping: { [key: string]: string }; // Accept a color mapping
}

const normaliseKey = (status: string): string => {
  return status.trim().toLowerCase().replace(/\s+/g, ''); // Normalize spaces
};

export const CustomBadge: React.FC<CustomBadgeProps> = ({ label, colorMapping }) => {
  const normalizedKey = normaliseKey(label); // Normalize the label
  const hexColor = colorMapping[normalizedKey] || '#6c757d'; // Default to gray if unmatched
  const textColour = fontColorContrast(hexColor, 0.7);

  return (
    <Badge
      style={{
        backgroundColor: hexColor,
        color: textColour,
        borderRadius: '12px',
        textAlign: 'center',
        justifyContent: 'center', // Center horizontally
        alignItems: 'center', // Center vertically
      }}
    >
      {label}
    </Badge>
  );
};
