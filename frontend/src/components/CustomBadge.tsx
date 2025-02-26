import { Badge } from 'flowbite-react';
import fontColorContrast from 'font-color-contrast';

interface CustomBadgeProps {
  label: string;
  colorMapping: { [key: string]: string }; // Accept a color mapping
}

const normaliseKey = (status: string): string => {
  return status.trim().toLowerCase().replace(/\s+/g, ''); // Normalize spaces
};

// Colour mappings for statuses
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
