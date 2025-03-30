<h1 align="center">initx ⚙️</h1>

<p align="center"><code>initx</code> A more convenient scripting engine</p>

<pre align="center">npx <b>initx &lt;something&gt;</b></pre>

# What is it?

`initx` can quickly execute some scripts through plug-ins to simplify complex functions

like ...

<details>
<summary>
  Set the git username and email address via <code>@initx-plugin/git</code> plugin
</summary>

```bash
# before
git config --global user.name "foo"
git config --global user.email "foo@example.com"

# after
initx user foo foo@example.com
```

</details>

<details>
<summary>
  Copy SSH or GPG public key via <code>@initx-plugin/cp</code> plugin
</summary>

```bash
# before
gpg -k # get the key id
gpg --armor --export <key-id> # export the key

# after
initx cp gpg

# before
# open ~/.ssh/id_rsa.pub or C:/Users/<username>/.ssh/id_rsa.pub and copy it

# after
initx cp ssh
```

</details>

<details>
<summary>
  Manage code projects using <code>@initx-plugin/pm</code>
</summary>

```bash
# before
# open github, copy clone url
# use terminal cd to ~/projects, git clone <url>
# maybe more steps

# after
initx pm add ~/projects # add projects directory, only need to do it once
initx create user/repo
# or initx create user/repo project-name
```

</details>

# Usage

Install it globally

```bash
npm i -g initx
```

Then you can ignore `npx`

```bash
initx <command> [options]
```

Use various functions by installing plugins

```bash
initx plugin add <plugin-name>
```

This will install the `@initx-plugin/git` plugin

```bash
initx plugin add git
```

# Plugins

- [@initx-plugin/git](https://github.com/initx-collective/initx-plugin-git)
- [@initx-plugin/gpg](https://github.com/initx-collective/initx-plugin-gpg)
- [@initx-plugin/cp](https://github.com/initx-collective/initx-plugin-cp)
- [@initx-plugin/pm](https://github.com/initx-collective/initx-plugin-pm)

Use [initx-plugin-starter](https://github.com/initx-collective/initx-plugin-starter) to get started

# Acknowledgement

- [cac](https://github.com/cacjs/cac)
- [ora](https://github.com/sindresorhus/ora)
- [defu](https://github.com/unjs/defu)
- [pathe](https://github.com/unjs/pathe)
- [tinyexec](https://github.com/tinylibs/tinyexec)
- [importx](https://github.com/antfu-collective/importx)
- [inquirer](https://github.com/SBoudrias/Inquirer.js)
- [picocolors](https://github.com/alexeyraspopov/picocolors)
- [which](https://github.com/npm/node-which)
