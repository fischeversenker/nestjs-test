import { HttpService, Injectable, OnModuleInit } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Student } from './students.model';

@Injectable()
export class StudentsService implements OnModuleInit {
  private students: Student[] = [];

  constructor(private readonly httpService: HttpService) {}

  async onModuleInit() {
    this.students = await this._fetchStudents();
  }

  findAll(): Student[] {
    return this.students;
  }

  find(matrNr: number): Student | undefined {
    return this.students.find(s => s.matriculationNumber === matrNr);
  }

  private async _fetchStudents(): Promise<Student[]> {
    return this.httpService.get('https://jsonplaceholder.typicode.com/users')
      .pipe(
        map(res => res.data.map(user => ({
          matriculationNumber: user.id,
          name: user.name,
        }))),
      ).toPromise();
  }
}
