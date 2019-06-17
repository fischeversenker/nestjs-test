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

  addStudent(student: Student) {
    if (this._isValidStudent(student)) {
      this.students.push(student);
    } else {
      throw new Error(`Can not add an invalid student! Name: "${student.name}", matriculationNumber: "${student.matriculationNumber}"`);
    }
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

  private _isValidStudent(student: Student) {
    return student.name && student.matriculationNumber;
  }
}
