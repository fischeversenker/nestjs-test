import { Body, Controller, Get, Param, ParseIntPipe, Post, Res, Render } from '@nestjs/common';
import { Response } from 'express';
import { Student } from './students.model';
import { StudentsService } from './students.service';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Render('students')
  async findAll(): Promise<Object> {
    const students = await this.studentsService.findAll();
    return { students };
  }

  @Get(':matriculationNumber')
  async find(@Param('matriculationNumber', new ParseIntPipe()) matriculationNumber): Promise<Student> {
    return await this.studentsService.find(matriculationNumber);
  }

  @Post()
  async create(@Body() student: Partial<Student>, @Res() res: Response) {
    await this.studentsService.addStudent(student);
    res.redirect('/students');
  }
}
