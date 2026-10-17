# grafiture-ui

The stencil studio for [grafiture](https://github.com/jimberry1/grafiture): upload an
image, pick a style and a palette, preview the result, and download cuttable sheets.

## Running

Start the API first (`lein server` in the grafiture repo), then:

```bash
npm install
npm start
```

Opens on http://localhost:3000 and talks to the API at http://localhost:8080. Set
`REACT_APP_API_URL` to point elsewhere.

```bash
npm test
npm run build
```

## Structure

- `src/design/`: the design system. `tokens.css` holds every colour, size and shadow
  for light and dark themes; `components.css` and `layout.css` build on them.
- `src/components/`: one component per step (image, style, colours, stencil), the
  stage with its eyedropper and loupe, and the sheets gallery.
- `src/api.js`: the API client. Jobs are submitted, then polled until done.
- `src/colours.js`: colour naming, pixel sampling and palette suggestion (k-means).
