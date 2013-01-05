# Spectrum

Spectrum is a communication app built on AT&T's Alpha APIs:
- WebRTC (att.js)
- Address Book
- Messages

The application's purpose is two-fold:

1. Show the capabilities of the APIs
2. Be a useful communication tool

## Prerequisits

- Node.js 0.8 + 
- redis server
- npm

## Run

### Redis 2.6
Download and run redis server with default config: http://redis.io/download

### Node.js
Download/install node: http://nodejs.org/#download

### Clone Repo
```
git clone git@github.com:att-innovate/spectrum.git
cd spectrum
```

### Install Dependencies
```
npm install .
```

### Run Spectrum
```
node app.js
```



## How the code is structured

Client side code is all bundled into a single app.js file that is comprised of CommonJS modules. All those modules are stored in the `clientapp` folder at the root of the project. This is handled by a tool called Stitch. You can see how the package is built in `clientPackage.js` and used in `server.js`. You'll see `clientapp` and `clientmodules` specified as containing our CommonJS code and then a list of normal global includes (like jQuery).

This means that there are only a few globals within the browser `window` object. Anything that you want to use from another module within your code must be explicitly imported by requiring it like this:

```javascript
var ContactModel = require('models/contact');
```

### Application State
All state for the entire application is stored within Backbone.js models. None of it should exist in the DOM. This means the UI is completely reactive. It only responds to changes in underlying model state. This keeps us sane when dealing with larger single page apps, such as this.

In the main controller file `clientapp/spectrum.js` we create a single global called `app`. This is the root object that stores our other various components. The `app` object is itself a Backbone Model and thus serves as the main view state for app-level view items.


### Accessing the APIs
We authenticate using AT&T Alpha-Auth. Which is an OAuth2 implementation. 

In this app we use the `att-express-auth` middleware which does most of the hard work for us:

```js
app.use(attAuth.middleware({
    app: app,
    clientId: config.clientId,
    clientSecret: config.secret,
    scopes: ['profile', 'addessbook', 'locker', 'messages', 'geo', 'webrtc'],
    redirectUrl: config.baseUrl
}));
```

More detail and instructions on that can be found by doing an `npm install att-express-auth` and reading the `README.md` file.

Or just look at the OAuth instructions in API matrix: https://apimatrix.tfoundry.com/services/oauth for the details on the oauth implementation.

Once we have a properly scoped access token, we can use that to access the APIs that we want to talk to directly.

### WebRTC
If you look at `clientapp/callManager.js` you'll see where we use [att.js](https://js.att.io) to add phone functionality to the app.

### Views and templating
All html is templated in the client. Templates are sent to the client and cached using [ICanHaz.js](http://icanhazjs.com). 

Each widget (dom + behavior) within the app of any significance is rendered with a Backbone View and a mustache template. 

There are a few special views that are used to render entire sections of the app. These are in the `clientapp/pages` folder. These are rendered according to the URL. We're using a backbone router `clientapp/routers/main.js` that takes the curent url and uses that to determined which page view to render and what specific models and collections it needs to render.


### Code style

All code follows strict formatting guidelines. You can check your code against these standards by installing jshint and running it like this:

```
npm install jshint -g
jshint .
```

This will tell you if you code is compliant to the code styles as described in `.jshintrc` and not ingnored via `.jshintignore`.

## Credits

Built by [&yet](http://andyet.com) for [AT&T Foundry](https://foundry.att.com/).
