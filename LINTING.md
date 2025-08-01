# Linting Guidelines for Beam Analysis Project

## ESLint Configuration

This project uses ESLint with the Next.js core web vitals configuration to ensure code quality and consistency. We've made some customizations to the default configuration to better suit our project needs.

### Custom Rules

- `react-hooks/exhaustive-deps`: Set to "warn" instead of "error" to prevent build failures while still highlighting potential issues

## Handling React Hook Dependency Warnings

When working with React Hooks like `useState`, `useEffect`, `useMemo`, and `useCallback`, it's important to properly manage dependencies to prevent unexpected behavior and performance issues.

### Best Practices

1. **Include all dependencies**: Always include all variables from the outer scope that are used inside the hook.

2. **Exclude stable values**: You can exclude values that are guaranteed to be stable (like dispatch from useReducer).

3. **Use the ESLint plugin**: The react-hooks/exhaustive-deps rule will help identify missing dependencies.

4. **When to ignore the rule**: In rare cases, you might need to ignore the rule. You can do this by adding a comment:

   ```javascript
   // eslint-disable-next-line react-hooks/exhaustive-deps
   ```

   Only do this when you're certain that the dependencies you're excluding won't cause issues.

### Example

Correct usage of `useMemo`:

```javascript
const memoizedValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]); // Include all dependencies
```

### Running Lint Checks

To check for linting issues:

```bash
npm run lint
```

To automatically fix linting issues where possible:

```bash
npm run lint:fix
```

## Common Issues and Solutions

### Unnecessary Dependencies

If you see a warning like:

```
React Hook useMemo has unnecessary dependencies: 'x' and 'y'. Either exclude them or remove the dependency array.
```

This means that `x` and `y` are included in the dependency array but are not used inside the hook function. You should remove them from the dependency array.

### Missing Dependencies

If you see a warning like:

```
React Hook useEffect has a missing dependency: 'z'. Either include it or remove the dependency array.
```

This means that `z` is used inside the hook function but is not included in the dependency array. You should add it to the dependency array.

## Resources

- [React Hooks Documentation](https://reactjs.org/docs/hooks-reference.html)
- [ESLint Plugin React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [Next.js ESLint Configuration](https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules)