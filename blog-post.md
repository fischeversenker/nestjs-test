_(the hero cat is from Nest.js's website, in case you were wondering)_

**To follow along you should be at least somewhat familiar with TypeScript, the command line and npm. Having experience with Angular definitely helps but is not a requirement.**

# Background
TypeScript is the language of choice for most popular Frontend Frameworks.
For Backend frameworks however there still are not a lot of options that let you enjoy TypeScript. One well established framework based on [express.js](https://expressjs.com) and [koa.js](https://koajs.com/) is [routing-controller](https://github.com/typestack/routing-controllers) but it's stuck at `v0.7.0` since June 2017 and hasn't seen a lot of activity from the original maintainers since. Coincidentally that is around the time when [Nest](https://nestjs.com/) emerged.

# Nest.js
Nest.js (Nest) has surpassed `routing-controller`'s success (measured in GitHub stars) manyfold already and is still under heavy active development (`v6.2.0` shipped two days ago at the time of writing this). Like `routing-controller`, Nest is built on top of express.js but can also be setup to run with [fastify](https://www.fastify.io/) and other server frameworks.

# What is this post about?
In this project and blog post we are going to build a server that manages university students.

We will setup a new Nest server, teach it to read students from an (external) source and to return these students.
In a second step we will teach the server to accept new students that can be served later on. To finish off we will integrate the template engine `handlebars` to serve rendered HTML on specific requests.

Sidenote: For the sake of brevity we won't cover database connections, though. All data will be fetched once and then held in memory afterwards.

# Create a new Nest project via the CLI
Install the Nest CLI globally with `npm install -g @nestjs/cli` and get going with `nest new <project-name>`. If you have both `npm` and `yarn` installed the `nest new ...` command will let you choose between the available package managers for this project. This will create a folder `<project-name>` containing your "blank" (Hello World!) Nest application.

## What did that just generate?
Inside the new directory `project-name` (or whatever name you chose) you will find a bunch of config and metadata files (`package.json`, `tsconfig.json`, etc.) and a simple Nest application in `src/`, complete with Unit- and E2E-tests written with [Jest](https://jestjs.io/).

Let's take a closer look at the files that got generated. This will make it easier to understand what we are going to be doing later in this post.

#### *main.ts*
```ts
...

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

Bootstraps your application by creating a new Nest app and telling it to listen for requests on port 3000.

#### *app.module.ts*
```ts
...

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Defines `class AppModule` that is decorated with Nest's `@Module()` decorator which receives a list of Controllers and Providers that are used throughout the module or provided to other consuming modules.
Quick refresher on modules: A "module" is a piece of software that is very well encapsulated and provides a precise range of functions and a public
interface so clients know how to use these functions.

In the case of Nest the module definition very closely resembles the one you might know from Angular. The metadata we pass to the `@Module()` decorator will be explained in more detail later. Keep on reading.

#### *app.controller.ts*
```ts
...

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  ...
}
```

Defines `class AppController`.
This class is decorated with Nest's `@Controller()` decorator which wires things up in the
background (we'll cover this later) and is required for a class to act as a controller.
A controller in Nest does what any other controller in an http backend framework would do: It provides handlers for routes.

In the `AppController`'s constructor it states a dependency to the `AppService`.
This dependency will be automatically resolved by Nest as long as it's listed in the `providers` of one of the parent modules.
When the `AppController` is being instantiated it will be passed an instance of `AppService` automatically. Keep on reading to learn how...

#### *app.service.ts*
```ts
...

@Injectable()
export class AppService {
  ...
}
```

Defines `class AppService` that may provide service functionality in the application.
It's decorated with `@Injectable()` to let Nest know that this class can be stated as a dependency
somewhere else. You can see this in the constructor of *app.controller.ts* above.
For this to work `AppService` has to be enlisted in the array of providers in `AppModule`.

Sidenote:
To readers who are familiar with Angular it should be fairly obvious that Nest is heavily inspired by [Angular](https://angular.io). They not only share similar decorators but also split code similarly and provide seemingly the same Dependency Injection (DI) functionality. If you enjoy this kind of structure and haven't yet done so I strongly recommend giving Angular a try ❤️.

After we have seen what Nest generated for us you can now go ahead and start that new app with `npm start` and browse to `http://localhost:3000` for a rewarding `Hello World!`.

# Serving Students
Let's customize and extend the generated code so that our server can serve students. We start by adding a dedicated new module: `StudentsModule`.

Similar to Angular, Nest provides a `generate` CLI functionality. We can create a new Nest module with `nest generate module students` (or shorter: `nest g mo students`). The new module will be placed at *src/students/students.module.ts* and will automatically be added to the list of imported modules in  `AppModule`.

#### *src/students/students.module.ts*
```ts
...

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class StudentsModule {}
```

## Model
To make sure controller and service both agree on what a `student` is, we need to define a model. We do so using an `interface` in a separate file *src/students/student.model.ts*. We will use this interface to pass students around internally or in a response or receive them via requests.

#### *src/students/students.model.ts*
```ts
export interface Student {
  matriculationNumber: number;
  name: string;
}
```

In a real life application this model definition would also need to fit into a database. This can be accomplished by using an already well established library like [TypeORM](https://github.com/typeorm/typeorm) that takes care of object-relational mapping and database connections. There is a [section in the nest documentation](https://docs.nestjs.com/techniques/database) regarding *TypeORM* as well as other means to store/manipulate data like using [MongoDB](https://www.mongodb.com/).

With this simplified model (defined as TypeScript interface) for students in place we can now start adding some functionality into our `StudentsModule` by creating a service to manage our students.

## Service
We can generate a new service by using Nest's CLI again: `nest g s students` (`s`ervice).
It will be added as *src/students/students.service.ts* and will also be appended to the list of provided services in `StudentsModule`.
We will also get unit test boilerplates "for free" 🎉

The service will manage the known students, i.e. will fetch students from a data source as well as allow to create, read, update and delete students (*CRUD*). *Persisting data will not be part of this blog post, for now we will simply keep any data in memory as long as our server is running.*

#### *src/students/students.service.ts*
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

To actually have some students to work with we can fetch some placeholder user data from [jsonplaceholder](https://jsonplaceholder.typicode.com):

#### *src/students/students.service.ts*
```ts
...

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

Nest provides an `HttpService` that we can use here. To get a hold of this service we make Nest pass an instance of the `HttpService` to our own `StudentsService`. For Nest to be able to properly provide the `HttpService` we also need to add Nest's `HttpModule` to the `imports` list of `StudentsModule`. We can use this `HttpService` to fetch students from a remote database.

Now. Nest *does* provide lifecycle hooks for you to hook into and execute some code when specific events passed or are about to pass. As shown in the code above it would be possible to fetch the data we need in some early lifecycle hook so it's available when it starts being used. It is, however, **considered bad practive to do API calls and other heavy lifting in lifecycle hooks** as not to slow down the startup process.

The usage of the `OnModuleInit` (in `class StudentsService implements OnModuleInit`) interface and the `onModuleInit()` function in the code above are merely there to showcase Nest's lifecycle hooks. `onModuleInit` gets executed as soon as the hosting module (`StudentsModule`) gets initialized.

Inside the `onModuleInit()` we retrieve `jsonplaceholder`s list of users and transform the response to only contain the properties we currently need. In the private function `_fetchStudents()` we initially receive an `Observable` from the `HttpService` which uses RxJS. If you don't know about RxJS I highly recommend you check it out: [RxJS Documentation](https://rxjs-dev.firebaseapp.com/guide/overview). Since we are working with `async/await` a lot we turn the `Observable` into a `Promise` with `.toPromise()`.

We can avoid the bad lifecycle hooking and can overall drastically improve the above service code by applying rough manual caching and some more of that sweet `async/await`:

#### *src/students/students.service.ts*
```ts
...

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

## Controller
Similarly to the service we just covered we can generate a new controller by using Nest's CLI: `nest g co students` (`co`ntroller).
It will be added as *src/students/students.controller.ts* and will also be appended to the list of known controllers in `StudentsModule` automatically.
The generator will also create unit test boilerplates as well.

Let's extend the empty controller so it looks like this:

#### *src/students/students.controller.ts*
```ts
...

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

Nest probably wouldn't strive like it does if it wasn't so beautifully intuitive to use. Using the decorator `@Controller('students')` we tell Nest to serve this controller at path `/students`. The controller exposes two functions:

**`async findAll()`** is decorated with `@Get()` (notice the empty parantheses). This tells Nest to respond to any GET request to `/students` (the controller's base path) with the result of `findAll()`.

**`async find(...)`** on the other hand is decorated with `@Get(':matriculationNumber')`, so Nest calls this function if it receives GET requests to paths like `/students/0`. Using the colon notation (`:matriculationNumber`) Nest will know that this part of the path is variable and generally interesting. To get a hold of the actual values of these placeholders we can add the `@Param()` decorator to the desired argument of our respective handler function. Inside the `@Param()` decorator we can specify which parameter we want to grab and can also add a pipe to automagically coerce the parameter. The `ParseIntPipe` in this case turns the received `string` (which all params are initially) into a `number` (Int).

**Note:**\
The name of the decorated function does not dictate the path to this controller. The path is defined by the argument given to the `@Get()` decorator function. You might as well rename `findAll()` to something like `foobar()` and the app would work the same as it did before (all else unchanged). Meaningful function names are nontheless very valuable when it comes to debugging and generally reading the code.

## Run it!
With module, service and controller written we can go ahead and fire up our server with `npm start` (or `npm run start:dev` if you want the server to recompile on file changes).
As soon as the server is running you can navigate to `http://localhost:3000/students` to receive a list of students (which are actually jsonplaceholder's users) or request `http://localhost:3000/students/1` to receive only one specific student identified by their matriculationNumber (`1` in this case).

So now we can request students both in their entirety and individuals. Wouldn't it be nice to also be able to add new students? Keep on reading...

# Adding students
To be able to send new students to our server we need to use a different HTTP method than we did before. The current handlers in our `StudentsController` all deal with GET requests which by definition cannot contain a body. We want to establish a new endpoint for POST requests to add new students (aiming for ReST compliance here). We will first extend `StudentsService`.

## Service
To allow adding new students in a (somewhat) failsafe way we add two new functions to our service:

#### *src/students/students.service.ts*
```ts
...

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

The new public function `addStudent()` accepts a `Partial<Student>` (if you don't know about `Partial` you might want to check out the [TypeScript documentation on Advanced Types](https://www.typescriptlang.org/docs/handbook/advanced-types.html)) since we can't rely on the client passing a valid student that fills all the required fields.
Inside of `addStudent()` we call the private function `_safeAddStudent()` that makes sure that our cache is setup and the passed object is a valid student.
If it's not a valid student we throw an `HttpException` (imported from `@nestjs/common`). This exception will be caught by Nest's global [Exception filters](https://docs.nestjs.com/exception-filters). Nest uses this filter layer to catch any uncaught exceptions and respond appropiately. In this case the response will have a status code of 400 (Bad Request) and will pass the error object we gave the `HttpException` in the response body.

## Controller
Now let's add a new endpoint to our `StudentsController` that makes use of the new service functionality:

#### *src/students/students.controller.ts*
```ts
...

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

To create this new POST endpoint we use the `@Post()` decorator (instead of the previous `@Get()`). Notice how it has empty parenthesis so we are listening for the controllers base path (i.e. `students`) but this time for `POST` requests. By default Nest responds to POST requests with 204. We introduce the `@HttpCode()` decorator to tell Nest to respond with a status code of 201 (i.e. "Created") to make our API slightly less self explaining.

For the `students/:id` endpoint we already made use of the `@Param()` decorator. For this new endpoint we use the similar `@Body()` decorator. This tells Nest to pass the request body to our handler. Once the body reaches our handler function it has already convienently been turned into a JS object and thus can easily be handled by us. We also state that we want to get a hold of the response object with the `@Res()` decorator. This decorator injects the underlying server framework's (`express` in this case) response object as opposed to a Nest wrapper (which we could get via `@Response()`). `Res` is imported from `@nestjs/common`, whereas the `Response` interface comes directly from `express`. We do this to be able to set the `Location` header... I wasn't able to find the Nest way of doing this.

## Try it out!
Using a tool that enables us to send POST requests we can now test this new functionality of adding students. I decided to use Postman to do this. We first do a GET request to `http://localhost:3000/students` to be able to verify that the student we are about to add is not yet on the list. We will receive the same 10 students we received earlier.

When we now trigger an empty POST request to `http://localhost:3000/students` and pass nothing as the request body we will receive the expected response with status code `400` that tells us that we did not send the correct data along with the request. If we however send a JSON formatted valid student (according to our model definition at least) we will receive a "201 Created" that tells us that the student got added to the service's list of students.

#### *valid student*
```json
{
  "name": "Tina Tester",
  "matriculationNumber": 42
}
```

To confirm that it worked we can again get all students with a GET request to `http://localhost:3000/students` like we did before.
The received list of students now contains Tina Tester.
We can also request `http://localhost:3000/students/42` to only receive this particular student that we just added.

# Birds Eye View on HTML Templates
Since Nest is "nothing more" than a framework built on top of other HTTP server frameworks the process of rendering HTML is specific to the underlying server framework that's being used. By default Nest uses `express` as the server framework. If you are already familiar with `express` and its view engines you should be fairly familiar with the setup.

There are various ways of handling interpolation in HTML.
For this post we will be using `Handlebars` as it's fairly easy to integrate and well established. Luckily there is a `handlebars` wrapper for `express` called `hbs` which we'll be using. This is what we will be left with when we are done:

![list of students](//images.ctfassets.net/r9k1fy8lu25c/4BuinSN8FSwXWhBgwqNe6C/a3a5c5e284e76e0a96ed378c0e6e92c7/newStudentForm.png)

To install `hbs` run `npm i hbs`. We then need to add `hbs` as rendering engine to our Nest app. To do so we need to slightly adjust our `bootstrap` function in `src/main.ts`:

#### *src/main.ts*
```ts
...

const PUBLIC_PATH = join(__dirname, '..', 'public');
const VIEWS_PATH = join(__dirname, '..', 'views');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(PUBLIC_PATH);
  app.setBaseViewsDir(VIEWS_PATH);
  app.setViewEngine('hbs');

  await app.listen(3000);
}
```

Let's now create a new template that allows us to respond to `GET /students` with an HTML rendered list of students in `src/views/students.hbs`:

#### *views/students.hbs*
```handlebars
<!DOCTYPE html>
<html lang='en'>
<head>
  ...
  <link rel='stylesheet' href='style.css'>
  <title>Students with Nest</title>
</head>
<body>
  <form action='students' method='POST'>
    <label>Matriculation number: <input type='number' name='matriculationNumber'></label>
    <label>Name: <input type='text' name='name'></label>
    <button type='submit'>Save</button>
  </form>

  <div class='students'>
    {{#each students}}
      <div>{{matriculationNumber}}</div>
      <div>{{name}}</div>
    {{/each}}
  </div>
</body>
</html>
```

You might have spotted the `style.css` in there. This is stored at `public/style.css` and contains a few lines to make the page slightly more pleasant to the eye:

#### *public/style.css*
```css
body {
  text-align: center;
  padding: 50px;
}

.students {
  display: inline-grid;
  grid-template-columns: 40px 1fr;
  text-align: left;
  margin: 50px;
}
```

In the handler for `GET /students` (`students.controller:findAll()`) we now need to do two things now:
- add a `@Render()` decorator with the path to the desired template
- provide the template with everything it needs to be rendered

#### *src/students/students.controller.ts*
```typescript
...

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Render('students')
  async findAll(): Promise<Object> {
    const students = await this.studentsService.findAll();
    return { students };
  }
  ...
}
```

This will now serve the HTML that handlebars renders from  at `GET /students`. Depending on the template engine of your choice you can now get more adavanced with layout files and other techniques to build more scalable HTML.

# Have a look at the code and start experimenting
You can download the code in this post from the [Github repository](https://github.com/fischeversenker/nestjs-test/) and play around with it.

There are various ways to enhance this code and to widen your gained knowledge: Have a look at [testing your Nest application](https://docs.nestjs.com/fundamentals/testing) or how to [integrate swagger API documentation](https://docs.nestjs.com/recipes/swagger). The official [Nest documentation](https://docs.nestjs.com/) is a great place to start and provides loads of well-written techniques and recipes. Bonus: To Angular developers the structure of the documentation should be fairly familiar. Now go ahead and get your hands dirty!

## Thank you for reading <3
