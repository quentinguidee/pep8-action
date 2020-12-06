# PEP8 Action

This GitHub Action runs `pycodestyle` to ensure the code is well formatted.

## Inputs

### `arguments`

Give arguments to the pycodestyle command.

## Outputs

### `exit-code`

- 0 = success
- 1 = fail

### `output`

Output of the pycodestyle command. Shows formatting errors.

## Example

```
uses: quentinguidee/pep8-action@v1
with:
    arguments: '--max-line-length=120'
```
