Personal site built with [Hugo](https://gohugo.io).

## Commands

| Command                            | Description                            |
| ---------------------------------- | -------------------------------------- |
| `hugo server -D`                   | Start dev server (includes drafts)     |
| `hugo new content posts/<slug>.md` | Create a new post                      |
| `hugo`                             | Build site to `./public/`              |
| `hugo --minify`                    | Build with minified output             |
| `hugo config`                      | Display resolved configuration         |
| `hugo list all`                    | List all content                       |
| `hugo list drafts`                 | List draft content                     |
| `hugo env`                         | Show Hugo version and environment info |

## Syntax highlighting

Code blocks use Chroma with class-based output (`noClasses = false` in `hugo.toml`). The active theme is **onedark** — colors are in `assets/css/syntax.css`.

To switch theme, regenerate that file:

```sh
hugo gen chromastyles --style=<theme> > assets/css/syntax.css
```

Browse available themes at https://xyproto.github.io/splash/docs/
