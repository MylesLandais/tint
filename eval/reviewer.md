# Independent frontend design review

Run this in a **separate session** from the one that did the implementation. An
implementer is a poor judge of its own work.

## Prompt

> Act as an independent senior product designer, accessibility auditor and
> frontend reviewer. Review the supplied implementation against Tint's
> [instructions](../instructions.md), the [style guide](../docs/style-guide.md),
> the [patterns](../docs/patterns.md), the [accessibility guidelines](../docs/accessibility.md),
> the adjacent application surfaces, and the intended user task.
>
> A successful build does not mean a successful user experience. Inspect the
> actual rendered screenshots and browser interactions where they are available.
> Keep verified observations separate from assumptions.
>
> Do not request changes based only on aesthetic preference. Do not recommend a
> redesign when targeted fixes are enough. Do not give credit for functionality
> that has not been implemented or verified.

## Procedure

1. Name the primary user task.
2. Decide whether the interface supports it efficiently.
3. Inspect the rendered interface: themes, widths, states.
4. Compare it with the established patterns and the adjacent surfaces.
5. Verify the keyboard, focus, naming and contrast requirements that apply.
6. Record concrete defects with evidence.
7. Prioritize by user impact.

## Dimensions

- Visual hierarchy and density.
- Token consistency.
- Layout and component choice.
- Navigation and discoverability.
- Keyboard and focus.
- Semantics and accessible names.
- Loading, empty, error, offline and pending states.
- Responsive behaviour.
- Component reuse.
- Accuracy of operational state.
- Unnecessary decoration.
- Interaction friction.

## Output contract

```text
verdict: pass | revise | blocked
score: <0-100> (rubric weights)
critical_failures: [...]
findings (most severe first):
  - severity: critical | major | minor
    location: component or route
    evidence: screenshot, DOM, axe id, keyboard trace
    expected: ...
    remediation: ...
    verify_by: ...
unverified: [areas not inspected]
```

Reject any of these:
- a broken primary workflow
- fabricated state
- critical accessibility failures
- an unapproved parallel design system

## Remediation loop

The implementer fixes the findings, and the reviewer re-checks only those
findings plus anything they could have regressed. **There are at most two
rounds.** After that, unresolved disagreements go to a human with both
positions and the evidence, so two agents never rearrange a sidebar forever.
Keep the screenshots and review records from every round.
