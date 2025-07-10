# Beam Analysis Tool

The **Beam Analysis Tool** is a React-based application designed for structural analysis of beams. It allows users to input beam properties, material properties, support configurations, and applied loads, and then visualize the beam's deformation, shear force, bending moment, torsion, and stress distribution.

## Features

- **Beam Properties**: Input beam length, height, and width.
- **Material Properties**: Define elastic modulus and shear modulus.
- **Support Configuration**: Configure start and end supports (pin, roller, or fixed) and their positions.
- **Applied Loads**: Add, update, and remove loads (point, distributed, moment, torsion).
- **Visualization**:
  - **Shear Force Diagram**: Visualize the shear force along the beam.
  - **Bending Moment Diagram**: Visualize the bending moment along the beam.
  - **Torsion Diagram**: Visualize the torsional moment along the beam.
  - **Stress Distribution**: Visualize normal stress, shear stress, torsional stress, and von Mises stress.
  - **Beam Deformation**: Visualize the deflection of the beam under the applied loads.
- **Results Summary**: Display maximum values for shear force, bending moment, deflection, and stresses.

## Installation

To run the Beam Analysis Tool locally, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Minn21/Beam_analysis_demo.git
   cd beam-analysis-demo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the application**:
   ```bash
   npm start
   ```

4. **Open the application**:
   Open your browser and navigate to `http://localhost:3000`.

## Usage

1. **Input Beam Properties**:
   - Enter the beam length, height, and width in the "Beam Properties" panel.

2. **Configure Material Properties**:
   - Enter the elastic modulus and shear modulus in the "Material Properties" panel.

3. **Set Support Configuration**:
   - Choose the type of support (pin, roller, or fixed) for the start and end of the beam.
   - Set the positions of the supports.

4. **Add Loads**:
   - Click "Add Load" to add a new load.
   - Choose the type of load (point, distributed, moment, torsion).
   - Enter the position and magnitude of the load.
   - For distributed loads, specify the length.
   - For moments, specify the direction (clockwise or anticlockwise).

5. **View Results**:
   - The application will automatically update the diagrams and results based on the input.
   - View the shear force, bending moment, torsion, and stress distribution diagrams.
   - Check the "Analysis Results" panel for maximum values and support reactions.

## Code Structure

- **`BeamDeformationVisualization.tsx`**: Component for visualizing beam deformation.
- **`calculations.ts`**: Contains the `BeamCalculator` class for performing structural calculations.
- **`types.ts`**: Defines TypeScript interfaces and types used across the application.
- **`BeamAnalysis.tsx`**: Main component that integrates all functionality and provides the user interface.

## Dependencies

- **React**: JavaScript library for building user interfaces.
- **Recharts**: Charting library for React.
- **Lucide React**: Icon library for React.

