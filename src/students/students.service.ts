import { HttpService, Injectable } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Student } from './students.model';

@Injectable()
export class StudentsService {
  private _cachedStudents: Student[];

  constructor(private readonly httpService: HttpService) {}

  async findAll(): Promise<Student[]> {
    return await this._getStudents();
  }

  async find(matrNr: number): Promise<Student | undefined> {
    const students = await this._getStudents();
    return students.find(s => s.matriculationNumber === matrNr);
  }

  async addStudent(student: Partial<Student>): Promise<any> {
    try {
      await this._safeAddStudent(student as Partial<Student>);
    } catch(error) {
      console.error(`Could not add student! Name: "${student.name}", matriculationNumber: "${student.matriculationNumber}"`, error);
    }
    return Promise.resolve();
  }

  private async _getStudents(): Promise<Student[]> {
    if (!this._cachedStudents) {
      this._cachedStudents = await this._fetchStudents();
    }
    return Promise.resolve(this._cachedStudents);
  }

  private async _safeAddStudent(student: Partial<Student>, fetchIfEmpty: boolean = true): Promise<any> {
    if  (!student.name || !student.matriculationNumber) {
      throw new Error('The passed object is not a valid Student');
    }

    if (!this._cachedStudents) {
      this._cachedStudents = fetchIfEmpty ? (await this._fetchStudents()) : [];
    }

    return Promise.resolve(this._cachedStudents.push(student as Student));
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
