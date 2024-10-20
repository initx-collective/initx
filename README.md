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

### Git GPG

Select `Enable or disable GPG signing for git commits`, Set git commit signature

```bash
# Enable
npx initx gpg true
# Disable
npx initx gpg false
```

## GPG

Select `Import or Export GPG key`

### GPG import

Automatically read files ending with `publich.key` and `private.key` in the current directory

```bash
npx initx gpg import
```

### GPG export

Export the public key and private key to the current directory

```bash
# npx initx gpg export key_id filename
npx initx gpg export 92038B3E14C0D332542FB082B851A3E43D739400 home
```

`home_public.key` and `home_private.key` will be created in the current directory

## Clipboard

Copy some text to clipboard

### SSH Public Key

```bash
npx initx cp ssh
```
