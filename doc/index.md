# Overall documentation

## Codebase Organization

The React frontend lives in the `app/` directory, everything else is based in the root. `index.js` is the entrypoint for the API, and uses file-based routing to route requests to the appropriate file living in the `/routes` directory. The API is built using Express.js. The file-based router is implemented on the `/api/*` path, so all API requests going to the router folder should be prefixed with `/api/`. The API is pretty self-documenting based on the file structure.

Data fetching is done primarily with the `authFetch` method from `/app/src/util/url.js`. This method is a wrapper around the `fetch` API that automatically attaches the JWT token to the request headers. It is otherwise called the same way as `fetch`. It returns the fetch promise. All data fetching should happen in hooks living in the `/app/src/hooks` directory. Hooks should all export `{ loading, error, refetch, data }` where data is the high-level data object. It should be named using the singular noun resource it fetches, e.g. `user`, `shop`, `project` etc. All hooks should be named `use{Resource}` where the resource is the same as data object's name, and the hook file should be named `use{Resource}.js`.

For the frontend, we use the React UI kit `tabler-react-2`.

Components live in the `/app/src/components` directory, and should be named using the noun of the resource they represent, e.g. `User`, `Shop`, `Shops`, `Project` etc. Components should be named using the PascalCase convention, and should be named the same as the file they live in. Components should be organized into folders based on the resource they represent, e.g. `/app/src/components/User`, `/app/src/components/Shop`, `/app/src/components/Project` etc. If components need custom CSS, the CSS file should be named the same as the component, but with a `.module.css` extension and live in the same folder. Component files should have the `.jsx` extension.

### Authentication

Authentication is handled on the frontend using the `authFetch` function, and should almost always be abstracted away from the developer. The API expects the JWT token to be in the `Authorization: bearer {token}` header, and will return a 401 if the token is invalid or missing. On the server, the auth flow is handled by a middleware that checks the JWT token, fetches the user object from the database, and attaches it to the request object. This user object is then available to all subsequent middleware and route handlers. Please note that you may not want to send the full user object to the client, as it may contain sensitive information. Instead, you should send only the necessary information to the client. This middleware function is called `verifyAuth` and is imported from `/app/util/verifyAuth.js`. An authenticated route should look like this:

```javascript
import { verifyAuth } from "../../util/verifyAuth.js";

export const get = [
  verifyAuth,
  (req, res) => {
    res.json({
      user: {
        id: req.user.id,
      },
    });
  },
];
```

## Auth flow

We use SAML to log into the app via SLU SSO. The configuration for saml lives in the `/config/saml-config.js` file, and uses the cert file in the root directory `/okta.cert`.

The auth flow API, accessible at `/api/auth/*` is responsible for handling the SAML auth flow and converting sessions into JWTs that are supplied to the client.

After login, the user is redirected back to the `/assertion` endpoint, which affiliates the user with the user's object living in our databse (or creates it if a user does not already exist). This then redirects the user to the frontend url with the JWT in the query string. From here, the frontend extracts the JWT (in the `useAuth` hook), stores it in local storage, and deletes it from the query string.

The auth flow has the following endpoints:

### GET `/api/auth/login`

This endpoint returns a JSON object with a `url` key that contains the URL to redirect the user to for SAML login. This endpoint does not require any auth or additional headers.

#### Response:

```json
{
  "url": "https://---.okta.com/app/dev----tform2_1/exkkf---Ogwg5d7/sso/saml"
}
```

### GET `/api/auth/me`

This endpoint returns a JSON object with a `user` key that contains the user's ID (This is generated by our application, not supplied by OKTA), the user's email, firstName, and lastName. This endpoint requires a valid JWT in the `Authorization` header.

#### Response:

```json
{
  "user": {
    "id": "cm2ceomc20000qrdmvld5p3s6",
    "email": "jack.crane@slu.edu",
    "firstName": "Jack",
    "lastName": "Crane"
  }
}
```

This information is exposed in the frontend by the `useAuth` hook, which returns the user object:

```javascript
const { user } = useAuth();
/*
> {
>   "id":"cm2ceomc20000qrdmvld5p3s6",
>   "email":"jack.crane@slu.edu",
>   "firstName":"Jack",
>   "lastName":"Crane"
> }
*/
```

## Testing

Vitest is used for testing the API. To run the tests, run `yarn test` from the api directory. Codecov is collected with `yarn coverage` but is not accurate. Tests are colocated with their respective routes in the `routes` directory in `tests` folders. To prevent the router from attempting to load test files, test file names must be prepended with an underscore. Tests should be called `_{route}.test.js` where `{route}` is the name of the route file being tested.

Here is an example test file:

```javascript
import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "#index";
import { gt } from "#gt";
import { prisma as mockPrisma } from "#mock-prisma";
import { prisma } from "#prisma";
import { tc } from "#setup";

describe("/users", () => {
  describe("GET", () => {
    it("Should return 403 if user is not a global admin", async () => {
      const res = await request(app)
        .get("/api/users")
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Unauthorized" });
      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
    });

    it("Should return a list of users if the user is a global admin", async () => {
      await prisma.user.update({
        where: {
          email: "test@email.com",
        },
        data: {
          admin: true,
        },
      });

      const res = await request(app)
        .get("/api/users")
        .set(...(await gt()))
        .send();

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);

      expect(res.body).toMatchSnapshot({
        users: [
          {
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        ],
      });
    });
  })
});
```

The integration test environment has Prisma mocked for spying on database calls, and has a local instance of Prisma and Postgres running in a Docker container allowing you to pollute the test db without affecting the development or production db. Running prisma operations as normal in test files will affect the test db. The test db is reset before each test is run and a default user with an email of `test@email.com` is created. The default user has no permissions.

### Imports

| Import | Description |
| --- | --- |
| `describe` | A function that creates a test suite. |
| `expect` | A function that creates an expectation. |
| `it` | A function that creates a test. |
| `request` | A function that creates a supertest request. It is a wrapper around the express app imported from `#index`. Calling request(app).{method}({endpoint}).send() will send a request to the express app as if it were a real request. |
| `app` | The express app. |
| `gt` | A function that generates and returns an array of auth headers for the test user. Looks like `['Authorization': 'Bearer {jwt}']`. Accepts options to set up the user at [gt() options](#gt-options). |
| `prisma` from `#mock-prisma` | The mocked prisma client to be used for function spying |
| `prisma` from `#prisma` | The real prisma client to be used for database operations |
| `tc` from `#setup` | An object containing generated test data. Looks like `{ globalUser<user>, shop<shop> }`. |

#### gt() options

| Option | Description | Default |
| --- | --- | --- |
| `ga` | Sets if the requesting user is a Global Admin | `false` |
| `suspended` | Sets if the requesting user is suspended | `false` |
| `sat` | (Shop Account Type) Sets the requesting user's account type. One of `CUSTOMER`, `OPERATOR`, `ADMIN`, `GROUP_ADMIN`. | `CUSTOMER` |
