# donauwelle _<img src="./public/donauwelle.png" width="40" align="right"/>_

donauwelle is a small, open-source framework for writing web apps and
their server/backend code in one unified project. It is build for
[Bun](https://bun.sh) and uses [donau](https://npmjs.com/package/donau) for connectivity. It is configured to
be easily deployable as a docker container.
<br />
It's goal is ease-of-use. It's thus mainly suitable for small projects

#### For more information, check out the [demo](https://donauwelle.robbb.in)

### Screenshots

_<img src="./public/screenshot.png" width="300" />_

### Install

1. build your app on top of this template either:
   - using **`bun create donauwelle`** (or `npm init donauwelle`)
   - cloning this repository (and changing the name in `package.json`)
2. _(optional) adapt the configuration in the `.env` files_
3. run `bun run serve` to start in development mode

### Scripts

the following scripts are available for development and deployment:

- `bun run serve` - starts the app in development mode
- `bun run serve:prod` - starts the app in production mode
- `bun run build` - builds the app for production
- `bun run deploy` - builds the app and deploys it to the docker registry (defined in `.env.production`)

### contribute

- feel free to reach out if you find issues or have suggestions

Have a great day,<br>
Yours, Robin

[!["donate"](https://robbb.in/donate/widgets/btn_long_git.png)](https://robbb.in/donate)
