import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { Student } from './students.model';
import { StudentsService } from './students.service';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async findAll(): Promise<Student[]> {
    return await this.studentsService.findAll();
  }

  @Get(':matriculationNumber')
  async find(@Param('matriculationNumber', new ParseIntPipe()) matriculationNumber): Promise<Student> {
    return await this.studentsService.find(matriculationNumber);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() student: Partial<Student>, @Res() res: Response) {
    await this.studentsService.addStudent(student);

    res.append('Location', '/students/' + student.matriculationNumber).send('OK');
  }
}
