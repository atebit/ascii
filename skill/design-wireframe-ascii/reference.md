# design-wireframe-ascii: reference

Per-mode templates. Outer templates use four backticks so the inner ```` ```text ```` mock fence survives.

## Diverge

Divergence map, at the top of the catalog:

```text
| # | Concept | Organizing principle | Unit | Privileges |
|---|---------|----------------------|------|------------|
```

Concept:

````text
## Concept N: <name> (<principle>)

<one-line concept>

```text
<ASCII mock at declared width>
```

- **Privileges:** <the one thing it makes obvious>
- **Strength:** <…>  **Weakness:** <…>
````

## Stress-test

Stress axes to cover: light/baseline · high volume/scale · multi-role/team · firefight (many blocked) · empty/"all quiet" · batch (many same-state) · the edge signal the design under-serves · cross-boundary/hand-off · staleness/time · personal-scope filter in a big org.

Scenario:

````text
## S<n>: <name>

**Context:** <who, how many items, what states>

```text
<ASCII mock of the design under this condition>
```

**Exposes:** <the concrete design gap this scenario reveals>
````

## Detail

Glance flow:

```text
[ 1·Trigger ] › [ 2·Check ] › [ 3·Confirm ] › [ 4·Execute ] › [ 5·Done ]
                     └─(fail)→ [ 2b·Fix ] ⟲ back
```
