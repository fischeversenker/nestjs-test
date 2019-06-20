import { Test, TestingModule } from '@nestjs/testing';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

describe('Students Controller', () => {
  let controller: StudentsController;
  let studentsService: StudentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [StudentsService],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
    studentsService = module.get<StudentsService>(StudentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all students', () => {
      const students = [{
        matriculationNumber: 0,
        name: 'Max',
      }];
      jest.spyOn(studentsService, 'findAll').mockReturnValue(Promise.resolve(students));

      expect(controller.findAll()).toBe(students);
    });
  });
});
