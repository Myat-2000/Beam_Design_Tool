# State Management Optimization for Beam Analysis

## Overview

This directory contains optimized hooks for the Beam Analysis application. The optimization focuses on:

1. **Separation of Concerns**: Each hook is responsible for a specific calculation or functionality.
2. **Memoization**: All calculations are memoized using `useMemo` to prevent unnecessary recalculations.
3. **Dependency Tracking**: Each hook only recalculates when its specific dependencies change.

## Hooks Structure

- `useSectionProperties.ts`: Calculates section properties based on width and height.
- `useStressAnalysis.ts`: Calculates stress analysis based on applied loads and section properties.
- `useCapacityAnalysis.ts`: Calculates capacity analysis based on section properties, reinforcement details, and applied loads.
- `useNominalMomentCapacity.ts`: Calculates nominal moment capacity based on section properties and reinforcement details.
- `useCompressionTensionAnalysis.ts`: Calculates compression/tension analysis based on applied loads and section properties.
- `useChartData.ts`: Generates data for stress distribution and compression/tension zone charts.

## Benefits

1. **Performance Improvement**: By memoizing calculations and only recalculating when necessary, the application's performance is significantly improved.
2. **Code Maintainability**: Each hook has a single responsibility, making the code easier to understand and maintain.
3. **Reusability**: The specialized hooks can be reused in other components if needed.
4. **Testability**: Smaller, focused hooks are easier to test.

## Usage

The hooks are used in the `useBeamSectionAnalysisOptimized.ts` file, which replaces the original `useBeamSectionAnalysis.ts` hook. The optimized hook provides the same interface as the original hook, so it can be used as a drop-in replacement.

```typescript
// Import the optimized hook
import { useBeamSectionAnalysis } from './calculations/useBeamSectionAnalysisOptimized';

// Use it in your component
const {
  sectionProps,
  stressAnalysis,
  capacityAnalysis,
  // ... other values
} = useBeamSectionAnalysis({ width, height, materialProps, loads });
```