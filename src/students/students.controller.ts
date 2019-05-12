import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Student } from './students.model';
import { StudentsService } from './students.service';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  findAll(): Student[] {
    return this.studentsService.findAll();
  }

  @Get(':mnr')
  find(@Param('mnr', new ParseIntPipe()) mnr): Student {
    return this.studentsService.find(mnr);
  }
}
