import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Req, Res, Next } from '@nestjs/common';
import { Student } from './students.model';
import { StudentsService } from './students.service';
import { Request, Response } from 'express';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async findAll(): Promise<Student[]> {
    return await this.studentsService.findAll();
  }

  @Get(':mnr')
  async find(@Param('mnr', new ParseIntPipe()) mnr): Promise<Student> {
    return await this.studentsService.find(mnr);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() student: Student, @Res() res: Response) {
    await this.studentsService.addStudent(student);
    res
      .append('Location', '/students/' + student.matriculationNumber)
      .send('OK');
  }
}
