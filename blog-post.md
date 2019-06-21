# Writing a basic HTTP server with Nest.js

**To follow along you should be at least somewhat familiar with TypeScript, the terminal and node/npm.\
Experience with Angular definitely helps but is not a requirement.**

## Background
TypeScript is fairly common when it comes to Frontend Frameworks.
For backend frameworks there still are not a lot of options if you want to enjoy TypeScript at framework level. One well established framework based on [express.js](https://expressjs.com) and [koa.js](https://koajs.com/) is [routing-controller](https://github.com/typestack/routing-controllers) but it's stuck at `v0.7.0` since June 2017 and hasn't seen a lot of activity from the original maintainers since. Coincidentally that is around the time when [nest](https://nestjs.com/) emerged.

## Nest.js
Nest.js has surpassed `routing-controller`'s success (measured in GitHub stars) manyfold already and is still under heavy active development (`v6.2.0` shipped two days ago at the time of writing this). Like `routing-controller`, nest is built on top of express.js but can optionally be setup to run with [fastify](https://www.fastify.io/).

## What are we going to build?
I don't have a real life use case for nest just yet, but wanted to try it out anyways.
In this project and blog post we are going to build a server that manages students [^university].
After having setup a new Nest.js project we will teach our server to return students and in a second step we will teach it
to also accept new students.

Sidenote: For the sake of brevity we won't cover database connections, though. All data will be held in memory.

[^university]: In case you're asking: I am currently working with a local university. That's where the inspiration comes from.

## Create a new Nest.js project via the CLI
Install the Nest.js CLI globally with `npm install -g @nestjs/cli` and get going with `nest new <project-name>`. If you have both `npm` and `yarn` installed the `nest new ...` command will let you choose between the available package managers for this project. This will create a folder `<project-name>` containing your "blank"[^hello-world] nest.js application.

[^hello-world]: Hello world!

## What did that just generate?
Inside the new directory `project-name` (or whatever name you chose) you will find a bunch of config and metadata files (`package.json`, `tsconfig.json`, etc.) and a simple nest application in `src/`, complete with Unit- and E2E-tests written with [Jest](https://jestjs.io/).

Let's take a closer look at the files that got generated. This will make it easier to understand what we are going to be doing later in this post.

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

Defines `class AppModule` that is decorated with nest's `@Module()` decorator which receives a list of Controllers and Providers that are used throughout the module or provided to other consuming modules.
Quick refresher on modules: A "module" is a piece of software that is very well encapsulated and provides a precise range of functions and a public
interface so clients know how to use these functions.

In the case of Nest.js the module definition very closely resembles the one you might know from Angular. The metadata we pass to the `@Module()` decorator will be explained in more detail later. Keep on reading.

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
This class is decorated with nest's `@Controller()` decorator which wires things up in the
background [^controller-decorator] and is required for a class to act as a controller.
A controller in Nest.js does what any other controller in an http backend framework would do: It provides handlers for routes.

In the `AppController`'s constructor it states a dependency to the `AppService`.
This dependency will be automatically resolved by Nest.js as long as it's listed in the `providers` of one of the parent modules.
When the `AppController` is being instantiated it will be passed an instance of `AppService` automatically. Keep on reading to learn how...

[^controller-decorator]: Mostly routing. We'll cover this later in the `StudentsController`.

### *app.service.ts*
```ts
...

@Injectable()
export class AppService {
  ...
}
```

Defines `class AppService` that may provide service functionality in the application.
It's decorated with `@Injectable()` to let Nest.js know that this class can be stated as a dependency
somewhere else. You can see this in the constructor of *app.controller.ts* above.
For this to work `AppService` has to be enlisted in the array of providers in `AppModule`.

Sidenote:
To readers who are familiar with Angular it should be fairly obvious that Nest.js is heavily inspired by [Angular](https://angular.io). They not only share similar decorators but also split code similarly and provide seemingly the same Dependency Injection (DI) functionality. If you enjoy this kind of structure and haven't yet done so I strongly recommend giving Angular a try ❤️.

After we have seen what Nest.js generated for us you can now go ahead and start that new app with `npm start` and browse to `http://localhost:3000` for a rewarding `Hello World!`.

## Serving Students
Let's customize and extend the generated code so that our server can serve students. We start by adding a dedicated new module: `StudentsModule`.

Similar to Angular, Nest.js provides a `generate` CLI functionality. We can create a new Nest.js module with `nest generate module students` (or shorter: `nest g mo students`). The new module will be placed at *src/students/students.module.ts* and will automatically be added to the list of imported modules in  `AppModule`.

```ts
@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class StudentsModule {}
```

### Model (`students/student.model.ts`)
To make sure controller and service both agree on what a `student` is, we need to define a model. We do so in a separate file *src/students/student.model.ts*:

```ts
export interface Student {
  matriculationNumber: number;
  name: string;
}
```

In a real life application this model definition would also need to fit into a database. This can be accomplished by using an already well established library like [TypeORM](https://github.com/typeorm/typeorm) that takes care of object-relational mapping and database connections. There is a [section in the nest documentation](https://docs.nestjs.com/techniques/database) regarding *TypeORM* as well as other means to store/manipulate data like using [MongoDB](https://www.mongodb.com/).

With this simplified model (defined as TypeScript interface [^interface]) for students in place we can now start adding some functionality into our `StudentsModule` by creating a service to manage our students.

[^interface]: [TypeScript documentation: Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)

### Service (`students/students.service.ts`)
We can generate a new service by using Nest.js's CLI again: `nest g s students` (`s`ervice).
It will be added as *src/students/students.service.ts* and will also be appended to the list of provided services in `StudentsModule`.
We will also get unit test boilerplates "for free" 🎉

The service will manage the known students, i.e. will fetch students from a data source as well as allow to create, read, update and delete students (*CRUD*). *Persisting data will not be part of this blog post, for now we will simply keep any data in memory as long as our server is running.*

```ts
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

To actually have some students to work with we can fetch some placeholder user data from [jsonplaceholder](https://jsonplaceholder.typicode.com):

```ts
@Injectable()
export class StudentsService implements OnModuleInit {
  constructor(private readonly httpService: HttpService) {}

  async onModuleInit() {
    // Don't do this. Keep on reading though.
    this.students = await this._fetchStudents();
  }

  ...
  // You should mention observables and why you use toPromise here
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

Nest.js provides an `HttpService` that we can use here. To get a hold of this service we make Nest.js pass an instance of the `HttpService` to our own `StudentsService`. For Nest.js to be able to properly provide the `HttpService` we also need to add Nest.js's `HttpModule` to the `imports` list of `StudentsModule`. We can use this `HttpService` to fetch students from a remote database.

Now. Nest.js *does* provide lifecycle hooks for you to hook into and execute some code when specific events passed or are about to pass. As shown in the code above it would be possible to fetch the data we need in some early lifecycle hook so it's available when it starts being used. It is, however, **considered bad practive to do API calls and other heavy lifting in lifecycle hooks** as not to slow down the startup process.

The usage of the `OnModuleInit` (in `class StudentsService implements OnModuleInit`) interface and the `onModuleInit()` function in the code above are merely there to showcase Nest.js's lifecycle hooks. `onModuleInit` gets executed as soon as the hosting module (`StudentsModule`) gets initialized.

Inside the `onModuleInit()` we retrieve `jsonplaceholder`s list of users and transform the response to only contain the properties we currently need. In the private function `_fetchStudents()` we initially receive an `Observable` from the `HttpService` which uses RxJS. If you don't know about RxJS I highly recommend you check it out: [RxJS Documentation](https://rxjs-dev.firebaseapp.com/guide/overview). Since we are working with `async/await` a lot we turn the `Observable` into a `Promise` with `.toPromise()`.

We can avoid the bad lifecycle hooking and can overall drastically improve the above service code by applying rough manual caching and some more of that sweet `async/await`:

```ts
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

  private async _getStudents(): Promise<Student[]> {
    if (!this._cachedStudents) {
      this._cachedStudents = await this._fetchStudents();
    }
    return Promise.resolve(this._cachedStudents);
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

This new code introduces a private property `_cachedStudents` which holds the already fetched students. It also introduces a bug that when you add new students before you receive some the API is never queried... solving this problem is up to you if you want to. [Pull Requests](https://github.com/fischeversenker/nestjs-test/pulls) with suggestions are very welcome. The code can of course still be improved. The whole caching mechanism and the data holding part could each be separated into their own classes and maybe even modules.

### Controller (`students/students.controller.ts`)
Similarly to the service we just covered we can generate a new controller by using Nest.js's CLI: `nest g co students` (`co`ntroller).
It will be added as *src/students/students.controller.ts* and will also be appended to the list of known controllers in `StudentsModule` automatically.
The generator will also create unit test boilerplates as well.

This new controller calls service functions and exposes routes in your server. Let's extend the empty controller:

```ts
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
}
```

Nest.js probably wouldn't strive like it does if it wasn't so intuitive to use. Using the decorator `@Controller('students')` we tell Nest.js to serve this controller at path `/students`. The controller exposes two functions:
- `findAll()` is decorated with `@Get()` (notice the empty parantheses). This tells Nest.js to respond to any GET request to `/students` with the result of `findAll()`.
- `find(...)` on the other hand is decorated with `@Get(':matriculationNumber')`, so Nest.js calls this function if it receives a GET request like `/students/0`. Due to the colon notation `:matriculationNumber` Nest.js will know that this part of the resource path can change from request to request and will forward it to the respective function. To get a hold of the parameter(s) inside the function we can add the `@Param()` decorator to the desired argument. Inside the `@Param()` decorator we can specify which parameter we want to grab and can also add a pipe to automagically coerce the parameter. The `ParseIntPipe` in this case turns the received `string` (which all params are initially) into a `number` (Int).

**Note that the name of the function does not in any way dictate the URL of the resource. That's all handled by the `@Get('path/to/your/resource')` decorator.**

You might as well rename `findAll()` to something like `foobar()` and the app would work the same as it did before (all else unchanged). Meaningful function names are nontheless very valuable when it comes to debugging and generally reading the code.

### Run it!
With module, service and controller written we can go ahead and fire up our server with `npm start` (or `npm run start:dev` if you want the server to recompile on file changes).
As soon as the server is running you can navigate to `http://localhost:3000/students` to receive a list of students (which are actually jsonplaceholder's users) or request `http://localhost:3000/students/1` to receive only one specific student identified by their matriculationNumber (`1` in this case).

So now we can request students both in their entirety and individuals. Wouldn't it be nice to also be able to add new students? Keep on reading...

## Adding students
To be able to send new students to our server we need to use a different HTTP method than we did before. The current handlers in our `StudentsController` all deal with GET requests which by definition cannot contain a body. We want to establish a new endpoint for POST requests to add new students (aiming for ReST compliance here). We will first extend `StudentsService`.

### Service (`students/students.service.ts`)
To allow adding new students in a (somewhat) failsafe way we add two new functions to our service:

```ts
@Injectable()
export class StudentsService {
  ...

  async addStudent(student: Partial<Student>): Promise<any> {
    return await this._safeAddStudent(student);
  }

  private async _safeAddStudent(student: Partial<Student>, fetchIfEmpty: boolean = true): Promise<any> {
    if  (!student.name || !student.matriculationNumber) {
      throw new HttpException({ error: 'Not a valid student!' }, 400);
    }

    if (!this._cachedStudents) {
      this._cachedStudents = fetchIfEmpty ? (await this._fetchStudents()) : [];
    }

    return Promise.resolve(this._cachedStudents.push(student as Student));
  }

  ...
}
```

The new public function `addStudent()` accepts a `Partial<Student>` [^partials] since we can't rely on the client passing a valid student.
Inside of `addStudent()` we call the private function `_safeAddStudent()` that makes sure that our cache is setup and the passed object is a valid student.
If it's not a valid student we throw an `HttpException` (imported from `@nestjs/common`). This exception will be caught by Nest.js's global "Exception Filter" [^exception-filters]. Nest.js uses this filter layer to catch any uncaught exceptions and respond appropiately. In this case the response will have a status code of 400 (Bad Request) and will pass the error object we gave the `HttpException` in the response body.

[^partials]: [TypeScript documentation: Advanced Types](https://www.typescriptlang.org/docs/handbook/advanced-types.html)
[^exception-filters]: [Nest.js documentation: Exception filters](https://docs.nestjs.com/exception-filters)

### Controller (`students/students.controller.ts`)
Now let's add a new endpoint to our `StudentsController` that makes use of the new service functionality:

```ts
@Controller('students')
export class StudentsController {
  ...

  @Post()
  @HttpCode(201)
  async create(@Body() student: Partial<Student>, @Res() res: Response) {
    await this.studentsService.addStudent(student);

    res.append('Location', '/students/' + student.matriculationNumber).send('OK');
  }
}
```

To create this new POST endpoint we use the `@Post()` decorator (instead of the previous `@Get()`). Notice how it has empty parenthesis so we are listening for the controllers base path (i.e. `students`) but this time for `POST` requests. By default Nest.js responds to POST requests with 204. We introduce the `@HttpCode()` decorator to tell Nest.js to respond with a status code of 201 (i.e. "Created") to make our API slightly less self explaining.

For the `students/:id` endpoint we already made use of the `@Param()` decorator. For this new endpoint we use the similar `@Body()` decorator. This tells Nest.js to pass the request body to our handler. Once the body reaches our handler function it has already convienently been turned into a JS object and thus can easily be handled by us. We also state that we want to get a hold of the response object with the `@Res()` decorator. This decorator injects the underlying server framework's (`express` in this case) response object as opposed to a Nest.js wrapper (which we could get via `@Response()`). `Res` is imported from `@nestjs/common`, whereas the `Response` interface comes directly from `express`. We do this to be able to set the `Location` header... I wasn't able to find the Nest.js way of doing this.

### Try it out!
Using a tool that enables us to send POST requests we can now test this new functionality of adding students. I decided to use Postman [^postman] to do this. When we point our POST request to `http://localhost:3000/students` and pass nothing as the request body we will receive the expected response with status code `400` that tells us that we did not send the correct data along with the request. If we however add a JSON formatted valid student (according to our model definition at least) as the request body we will receive a "201 Created".

```json
{
  "name": "Tina Tester",
  "matriculationNumber": 42
}
```

To confirm that this worked we can now get all students with a GET request to `http://localhost:3000/students` like we did before. If all went well the received list of students now contains Tina Tester. Or, even more specific, we can request `http://localhost:3000/students/42` to only receive Tina.

[^postman]: [Get Postman](https://www.getpostman.com/)


## Where to go from here

We taught our application the very basics it needs to handle students. We could continue and provide similar functionality for courses and lectures now. This would mostly follow the same process as before though, so we will skip this and look at some more high-level features that Nest.js provides.
<!-- At this point I wonder where I would have created a html template. Maybe this is worth as a look out so I have a full image? -->
##


## Things that did not work ootb

- could not set a response code dynamically (i.e. other than @HttpStatus())



<!--
Nice reading.
1. I miss some introduction what you are doing
2. The document outline is nice. Handling GET & POST.
3. A little bit of template handling would be awesome as I would have everything at hand to get started.
4. The end comes pretty quickly, I wasn't ready to stop reading and wanted to read so much more.
5. **The** detail/summary thing at the beginning is nice. But after reading everything it feels akward and misplaced. Either make it a chapter or remove it. You are not using details/summary for anything else so it feels like "what happend back there, why did he told me about that stuff which such a mechnanism/

 -->
