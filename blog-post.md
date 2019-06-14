# Writing a basic HTTP server with Nest.js

**To follow along you should be at least somewhat familiar with TypeScript, the terminal and node/npm.\
Experience with Angular definitely helps but is not a requirement.**

## Background

TypeScript is fairly common when it comes to Frontend Frameworks.
For backend frameworks there still are not a lot of options if you want to enjoy TypeScript at framework level. One well established framework based on [express.js](https://expressjs.com) and [koa.js](https://koajs.com/) is [routing-controller](https://github.com/typestack/routing-controllers) but it's stuck at `v0.7.0` since June 2017 and hasn't seen a lot of activity from the original maintainers since. Coincidentally that is around the time when [nest](https://nestjs.com/) emerged.

## Nest.js

Nest.js has surpassed `routing-controller`'s success (measured in GitHub stars) manyfold already and is still under heavy active development (`v6.2.0` shipped two days ago at the time of writing this). Like `routing-controller`, nest is built on top of express.js but can optionally be setup to run with [fastify](https://www.fastify.io/).

## What are we going to build?

I don't have a real life use case for nest just yet, but wanted to try it out anyways. Since I am currently occupied with a university project I decided to aptly theme my experimental project and this blog post around students, lectures and courses.

<details>
  <summary>What will be generated?</summary>
  <p>
After having run the `nest new project-name` command you will find a directory `project-name` (or whatever name you chose) which contains a bunch of config and metadata files (`package.json`, `tsconfig.json`, etc.) and a simple nest application in `src/`, complete with Unit- and E2E-tests written using [Jest](https://jestjs.io/).

Let's take a closer look at the files that got generated. To inclined readers it will be fairly obvious that nest is heavily inspired by [Angular](https://angular.io). They not only share similar decorators but also split code similarly and provide seemingly the same Dependency Injection (DI) functionality.

### *main.ts*

```ts
...

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

Bootstraps your application by creating a new nest app and telling it to listen for requests on port 3000.

### *app.module.ts*

```ts
...

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Defines `class AppModule` that is decorated with nest's `@Module()` decorator which receives a list of Controllers and Providers that are used throughout the module.

### *app.controller.ts*

```ts
...

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  ...
}
```

Defines `class AppController`.
This class is decorated with nest's `@Controller()` decorator. In it's constructor it states a dependency to the `AppService` provided by the `AppModule`. This will be automatically resolved by nest.

### *app.service.ts*

```ts
...

@Injectable()
export class AppService {
  ...
}
```

Defines `class AppService` that provides service functionality in the application. It's decorated with `@Injectable()` to let nest know that this can be stated as a dependency somewhere else. For this to work `AppService` has to be enlisted in the array of providers in `AppModule`.

  </p>
</details>

## Getting started

Install the Nest.js CLI globally with `npm install -g @nestjs/cli` and get going with `nest new <project-name>`. If you have both `npm` and `yarn` installed the `nest new ...` command will let you choose between the available package managers for this projet.

Go ahead and start the blank application with `npm run start` and request `http://localhost:3000` (curl, Postman, Browser, ...) to receive the mandatory `Hello World!`.

## Students

Let's customize and extend the generated code so that our server can handle students. We start by adding a dedicated `StudentsModule`.

Similar to Angular, nest provides a `generate` CLI functionality. We can create a new module with `nest generate module students` (or shorter: `nest g mo students`). The new module will be placed at *src/students/students.module.ts* and will automatically be added to the list of imported modules in  `AppModule`. To now also add a controller and a service to `StudentsModule` we can run `nest g s students` and `nest g co students` (`s`ervice, `co`ntroller). These will be added as new files in *src/students/* and to the lists for controllers and services in the new `StudentsModule`. Along with the controller and the service we will get unit test boilerplates "for free" :tada:.

### Model

To make sure controller and service both agree on what a `student` is, we need to define a model. We do so in a separate file *src/students/student.model.ts*:

```ts
export interface Student {
  matriculationNumber: number;
  name: string;
}
```

In a real life application this model definition would need to be a lot more robust. This can be accomplished by using an already well established library like [TypeORM](https://github.com/typeorm/typeorm) that takes care of object-relational mapping and database connections. There is a [section in the nest documentation](https://docs.nestjs.com/techniques/database) regarding *TypeORM* as well as other means to store/manipulate data like using [MongoDB](https://www.mongodb.com/).

With this simple interface for students in place we can now take a closer look at the files we generated using the CLI and extend them a little.

### *students/students.service.ts*

The service will manage the known students, i.e. will fetch students from a data source as well as allow to create, read, update and delete students (*CRUD*). *Persisting data will not be part of this blog post, for now we will simply keep any data in memory as long as our server is running.*

```ts
...

@Injectable()
export class StudentsService {
  private students: Student[];

  findAll(): Student[] {
    return this.students;
  }

  find(matrNr: number): Student | undefined {
    return this.students.find(s => s.matriculationNumber === matrNr);
  }
}
```

To actually have some students to work with we can fetch some placeholder data from [jsonplaceholder](https://jsonplaceholder.typicode.com):

```ts
...

@Injectable()
export class StudentsService implements OnModuleInit {
  constructor(private readonly httpService: HttpService) {}

  async onModuleInit() {
    this.students = await this._fetchStudents();
  }

  ...

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
```

Nest provides an `HttpService` that we can make use of here. We can attach the data fetching logic to one of nests lifecycle events. Here we use `onModuleInit` which gets executed as soon as the hosting module (`StudentsModule`) got initialized (notice the `implements OnModuleInit` that we added to `class StudentsService`). Inside the `onModuleInit()` we retrieve `jsonplaceholder`s list of users and transform the response to only contain the properties we currently need.

For nest to be able to properly provide the needed `HttpService` we also need to add nest's `HttpModule` to the `imports` list of `StudentsModule`:

```ts
...

@Module({
  imports: [HttpModule],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
```

### *students/students.controller.ts*

The controller mostly calls service functions and manages the exposed routes. Let's extend the empty controller:

```ts
...

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
```

Nest probably wouldn't strive like it does if it wasn't so intuitive to use. Using `@Controller('students')` we tell nest to serve this controller at `/students`. The controller now exposes two functions:
- `findAll()` is decorated with `@Get()` (notice the empty parantheses). This tells nest to respond to any request to `/students` with the result of `findAll()`.
- `find(@Param() params)` on the other hand is decorated with `@Get(':id')`, so nest calls this function if it receives a request like `/students/0`. Due to the colon notation `:id` nest will know that this part of the resource path is variable and will forward it as a param to the respective function. To get a hold of the parameter(s) inside the function we can add the `@Param()` decorator to the desired argument. Inside the `@Param()` decorator we can specify which parameter we want to grab and can also add a pipe to automagically typecast the parameter. The `ParseIntPipe` in this case turns the received `string` from the path into a `number`.

**Note that the name of the function does not in any way dictate the URL of the resource.**

## Resume

Let's take a look at what we got so far.
The folder structure should look like this:

![directory tree](/docs/tree.png)

<iframe src="https://stackblitz.com/edit/nestjs-test?embed=1&file=src/students/students.controller.ts&view=editor" width="100%" height="400px">

Let's go over each file
```ts
# app.module.ts
# (got rid of the not used AppController and AppService)

import { Module } from '@nestjs/common';
import { StudentsModule } from './students/students.module';

@Module({
  imports: [StudentsModule],
})
export class AppModule {}
```

```ts
# students/students.module.ts

import { Module, HttpModule } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [HttpModule],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
```

```ts
# students/students.controller.ts

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
```

```ts
# students/students.service.ts

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
```

If we start the nest application with `npm run start:dev`/`yarn run start:dev` (`:dev` to get a watcher for file changes) we will get an http server listening at port 3000 (unless you changed the port in `main.ts`).

Using a tool like [Postman](https://www.getpostman.com/) we can now start requesting data from our server:

Requesting `http://localhost:3000/students` will yield a list of students. Notice that Nest automatically stringifies objects and adds the `Content-Type: application/json` header to the response.

Requesting `http://localhost:3000/students/1` expectedly yields the student with id 1, which at the time of writing this is *Leanne Graham*:

```json
{
    "id": 1,
    "name": "Leanne Graham"
}
```
