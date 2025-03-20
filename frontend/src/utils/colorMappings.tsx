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

// Colour mappings for statuses
export const areaColors: { [key: string]: string } = {
  'College of Arts & Humanities': '#FFE4E1', 
  'College of Medical, Veterinary & Life Sciences': '#E0FFFF', 
  'College of Science & Engineering': '#F0FFF0',
  'College of Social Sciences': '#FFF0F5', 
  'University Services': '#F5F5DC', 
};

export const statusColors: { [key: string]: string } = {
  completed: '#00b050', // Green
  inprogress: '#ffc000', // Amber
  unassigned: '#ff0000', // Red
};

// Colour mappings for learning types
export const learningTypeColors: { [key: string]: string } = {
  practice: '#bb98dc', // Purple
  acquisition: '#a1f5ed', // turqoise
  discussion: '#7aaeea', // Blue
  collaboration: '#ffd21a', // Yellow
  production: '#bdea75', // Green
  investigation: '#f8807f', // Red
  assessment: '#44546a', // Navy
};

// Colour mappings for graduate attributes
export const graduateAttributeColors: { [key: string]: string } = {
  adaptable: '#fabc2a',
  effectivecommunication: '#FFCAB1',
  reflectivelearners: '#F38D68',
  resourcefulandresponsible: '#EE6C4D',
  subjectspecialists: '#F76F8E',
  confident: '#F2BAC9',
  ethicallyandsociallyaware: '#7FD8BE',
  experiencedcollaborators: '#A1FCDF',
  independentandcriticalthinkers: '#3b5249',
  investigative: '#519872',
  selectanattribute: '#6c757d',
};
