import {
  areaColors,
  statusColors,
  learningTypeColors,
  graduateAttributeColors,
} from '../../src/utils/colorMappings';

describe('colorMappings', () => {
  describe('areaColors', () => {
    it('should have correct color mappings for all areas', () => {
      expect(areaColors).toEqual({
        'College of Arts & Humanities': '#FFE4E1',
        'College of Medical, Veterinary & Life Sciences': '#E0FFFF',
        'College of Science & Engineering': '#F0FFF0',
        'College of Social Sciences': '#FFF0F5',
        'University Services': '#F5F5DC',
      });
    });

    it('should return undefined for non-existent areas', () => {
      expect(areaColors['Non Existent Area']).toBeUndefined();
    });
  });

  describe('statusColors', () => {
    it('should have correct color mappings for all statuses', () => {
      expect(statusColors).toEqual({
        completed: '#00b050',
        inprogress: '#ffc000',
        unassigned: '#ff0000',
      });
    });

    it('should use the correct colors for specific statuses', () => {
      expect(statusColors.completed).toBe('#00b050'); // Green
      expect(statusColors.inprogress).toBe('#ffc000'); // Amber
      expect(statusColors.unassigned).toBe('#ff0000'); // Red
    });
  });

  describe('learningTypeColors', () => {
    it('should have correct color mappings for all learning types', () => {
      expect(learningTypeColors).toEqual({
        practice: '#bb98dc',
        acquisition: '#a1f5ed',
        discussion: '#7aaeea',
        collaboration: '#ffd21a',
        production: '#bdea75',
        investigation: '#f8807f',
        assessment: '#44546a',
      });
    });

    it('should return correct colors for each learning type', () => {
      expect(learningTypeColors.practice).toBe('#bb98dc'); // Purple
      expect(learningTypeColors.acquisition).toBe('#a1f5ed'); // Turquoise
      expect(learningTypeColors.discussion).toBe('#7aaeea'); // Blue
      expect(learningTypeColors.collaboration).toBe('#ffd21a'); // Yellow
      expect(learningTypeColors.production).toBe('#bdea75'); // Green
      expect(learningTypeColors.investigation).toBe('#f8807f'); // Red
      expect(learningTypeColors.assessment).toBe('#44546a'); // Navy
    });
  });

  describe('graduateAttributeColors', () => {
    it('should have correct color mappings for all graduate attributes', () => {
      expect(graduateAttributeColors).toEqual({
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
      });
    });

    it('should return correct colors for specific graduate attributes', () => {
      expect(graduateAttributeColors.adaptable).toBe('#fabc2a');
      expect(graduateAttributeColors.effectivecommunication).toBe('#FFCAB1');
      expect(graduateAttributeColors.selectanattribute).toBe('#6c757d');
    });

    it('should return undefined for non-existent graduate attributes', () => {
      expect(graduateAttributeColors['nonexistentattribute']).toBeUndefined();
    });
  });
});
