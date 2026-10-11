# 11 · GitHub Pages

- **Stage:** ship.
- **Asked:** the app should compile and run at the repo's GitHub Pages link.
- **Changed:** a workflow ([.github/workflows/pages.yml](../.github/workflows/pages.yml)) that runs `build.py` on every push to `main` and publishes `index.html` and `lab/cats.html` to [atebit.github.io/ascii](https://atebit.github.io/ascii/). The README's Play section links there.
- **Check:** the game loads and plays from the link.
