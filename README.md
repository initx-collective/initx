<h1 align="center">init 🛠</h1>

<p align="center"><code>initx</code> More convenient initialization tool</p>

<pre align="center">npx <b>initx &lt;something&gt;</b></pre>

## Git

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

The parameter position does not distinguish which one comes first, and you can append `--global` or any git option

```bash
npx initx user your_name mail@example.com --global
```

## Clipboard

Copy some text to clipboard

### SSH Public Key

```bash
npx initx cp ssh
```
