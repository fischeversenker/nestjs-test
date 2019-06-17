import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Response } from '@nestjs/common';
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

  @Post()
  @HttpCode(201)
  create(@Body() student: Student, @Response() res: Response) {
    this.studentsService.addStudent(student);
    // TODO: figure out how to set location header
    res.headers['Location'] = '/students/' + student.matriculationNumber;
    return res.headers;
  }
}
