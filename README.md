<h1 align="center">initx ⚙️</h1>

<p align="center"><code>initx</code> A more convenient scripting engine</p>

<pre align="center">npx <b>initx &lt;something&gt;</b></pre>

# Plugins

## Git

```bash
npm install @initx-plugin/git -g
```

### Git Repository

Create a new repository or modify the remote repository address in the current directory

```bash
npx initx git@github.com:user/repository.git
```

### Git Branch

Specify a branch name

```bash
npx initx git@github.com:user/repository.git main
```

### Git User

Set git username and email

```bash
npx initx user mail@example.com your_name
```

### Git GPG

Select `Enable or disable GPG signing for git commits`, Set git commit signature

```bash
# npx initx gpg [true|false]
npx initx gpg true
```

## GPG

```bash
npm install @initx-plugin/gpg -g
```

Select `GPG key management`

### GPG import

Automatically read files ending with `publich.key` and `private.key` in the current directory

```bash
npx initx gpg import
```

### GPG export

Export the public key and private key to the current directory

```bash
# npx initx gpg export [filename]?
npx initx gpg export home
```

`home_public.key` and `home_private.key` will be created in the current directory

### GPG delete

Delete the public key and private key

```bash
# npx initx gpg delete [public|private]?
npx initx gpg delete
```

## Clipboard

```bash
npm install @initx-plugin/cp -g
```

Copy some text to clipboard

### SSH Public Key

```bash
npx initx cp ssh
```

# Acknowledgement

- [cac](https://github.com/cacjs/cac)
- [execa](https://github.com/sindresorhus/execa)
- [importx](https://github.com/antfu-collective/importx)
- [inquirer](https://github.com/SBoudrias/Inquirer.js)
- [picocolors](https://github.com/alexeyraspopov/picocolors)
- [which](https://github.com/npm/node-which)
