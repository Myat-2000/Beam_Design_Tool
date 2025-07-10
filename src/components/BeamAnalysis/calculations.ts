// calculations.ts
'use strict';

import { Load, MaterialProperties, Reactions, SectionProperties, DiagramPoint } from './types';

export class BeamCalculator {
  private static readonly NEGLIGIBLE = 1e-9;
  private static readonly STRESS_TO_MPA = 1e-6;
  private static readonly DEFLECTION_TO_MM = 1000;
  private static readonly MAX_ITERATIONS = 1000;
  private static readonly CONVERGENCE_TOLERANCE = 1e-6;

  constructor(
    private beamLength: number,
    private beamHeight: number,
    private beamWidth: number,
    private materialProps: MaterialProperties,
    private startSupportPosition: number,
    private endSupportPosition: number,
    private startSupport: 'pin' | 'roller' | 'fixed' | 'free',
    private endSupport: 'pin' | 'roller' | 'fixed' | 'free',
    private loads: Load[]
  ) {
    this.validateInputs();
  }

  private validateInputs(): void {
    if (this.beamLength <= 0) throw new Error('Beam length must be positive');
    if (this.beamHeight <= 0) throw new Error('Beam height must be positive');
    if (this.beamWidth <= 0) throw new Error('Beam width must be positive');
    if (this.materialProps.elasticModulus <= 0) throw new Error('Elastic modulus must be positive');
    if (this.materialProps.shearModulus <= 0) throw new Error('Shear modulus must be positive');
    if (this.startSupportPosition < 0 || this.startSupportPosition > this.beamLength) {
      throw new Error('Start support position must be within beam length');
    }
    if (this.endSupportPosition < 0 || this.endSupportPosition > this.beamLength) {
      throw new Error('End support position must be within beam length');
    }
    if (this.startSupportPosition >= this.endSupportPosition) {
      throw new Error('Start support position must be less than end support position');
    }
    this.validateLoads();
  }

  private validateLoads(): void {
    this.loads.forEach(load => {
      if (load.position < 0 || load.position > this.beamLength) {
        throw new Error(`Load position must be within beam length (0 to ${this.beamLength})`);
      }
      if (load.magnitude === 0) {
        throw new Error('Load magnitude cannot be zero');
      }
      if (load.type === 'distributed' && load.length) {
        if (load.length <= 0) throw new Error('Distributed load length must be positive');
        if (load.position + load.length > this.beamLength) {
          throw new Error('Distributed load must be within beam length');
        }
      }
    });
  }

  private getEffectivePosition(load: Load): number {
    if (load.type === 'distributed' && load.length) {
      return load.position + load.length / 2;
    }
    return load.position;
  }

  private getLoadEffect(load: Load, x: number): number {
    if (x < load.position) return 0;

    switch (load.type) {
      case 'point':
        return load.magnitude;

      case 'distributed':
        if (!load.length) return 0;
        const end = load.position + load.length;
        if (x > end) return load.magnitude * load.length;
        return load.magnitude * (x - load.position);

      case 'moment':
        return 0;

      case 'torsion':
        return 0;

      default:
        return 0;
    }
  }

  public calculateSectionProperties(): SectionProperties {
    const area = this.beamHeight * this.beamWidth;
    const momentOfInertia = (this.beamWidth * Math.pow(this.beamHeight, 3)) / 12;
    const sectionModulus = momentOfInertia / (this.beamHeight / 2);

    // Torsional constant (Roark's formula for rectangular sections)
    const a = Math.max(this.beamWidth, this.beamHeight);
    const b = Math.min(this.beamWidth, this.beamHeight);
    const torsionalConstant = a * b ** 3 * (
      (1 / 3) - 0.21 * (b / a) * (1 - (b ** 4) / (12 * a ** 4)
    ));

    const polarMomentOfInertia = momentOfInertia * 2; // Example calculation, adjust as needed

    return {
      area: Math.max(BeamCalculator.NEGLIGIBLE, area),
      momentOfInertia: Math.max(BeamCalculator.NEGLIGIBLE, momentOfInertia),
      sectionModulus: Math.max(BeamCalculator.NEGLIGIBLE, sectionModulus),
      torsionalConstant: Math.max(BeamCalculator.NEGLIGIBLE, torsionalConstant),
      polarMomentOfInertia: Math.max(BeamCalculator.NEGLIGIBLE, polarMomentOfInertia),
    };
  }

  calculateReactions(): Reactions {
    const span = this.endSupportPosition - this.startSupportPosition;
    let RA = 0, RB = 0, MA = 0, MB = 0;

    // Handle free supports
    if (this.startSupport === 'free') {
      RA = 0;
      MA = 0;
    }
    if (this.endSupport === 'free') {
      RB = 0;
      MB = 0;
    }

    // If both supports are free, return zero reactions
    if (this.startSupport === 'free' && this.endSupport === 'free') {
      return { reactionA: 0, reactionB: 0, momentA: 0, momentB: 0 };
    }

    // Handle cantilever beam cases
    const isCantilever = (this.startSupport === 'fixed' && this.endSupport === 'free') || 
                        (this.startSupport === 'free' && this.endSupport === 'fixed');
    
    if (isCantilever) {
      const fixedEnd = this.startSupport === 'fixed' ? 'start' : 'end';
      const freeEnd = fixedEnd === 'start' ? 'end' : 'start';
      
      this.loads.forEach(load => {
        const effPos = this.getEffectivePosition(load);
        const a = effPos - this.startSupportPosition;
        const b = this.endSupportPosition - effPos;
        
        switch (load.type) {
          case 'point':
            if (fixedEnd === 'start') {
              RA += load.magnitude;
              MA += load.magnitude * a;
            } else {
              RB += load.magnitude;
              MB += load.magnitude * b;
            }
            break;
            
          case 'distributed':
            if (!load.length) break;
            const w = load.magnitude;
            if (fixedEnd === 'start') {
              RA += w * load.length;
              MA += w * load.length * (a + load.length / 2);
            } else {
              RB += w * load.length;
              MB += w * load.length * (b + load.length / 2);
            }
            break;
            
          case 'moment':
            const M = load.magnitude * (load.momentDirection === 'clockwise' ? 1 : -1);
            if (fixedEnd === 'start') {
              MA += M;
            } else {
              MB += M;
            }
            break;
        }
      });
      
      return {
        reactionA: Number(RA.toFixed(3)),
        reactionB: Number(RB.toFixed(3)),
        momentA: Number(MA.toFixed(3)),
        momentB: Number(MB.toFixed(3))
      };
    }

    // Regular beam calculations
    this.loads.forEach(load => {
      const effPos = this.getEffectivePosition(load);
      const a = effPos - this.startSupportPosition;
      const b = this.endSupportPosition - effPos;

      switch (load.type) {
        case 'point':
          if (this.startSupport === 'fixed' && this.endSupport === 'fixed') {
            // Standard formulas for fixed-fixed beam with point load at distance a from left, b from right
            // M_A = -Pab^2 / L^2
            // M_B = -Pa^2b / L^2
            // R_A = P b^2 (3a + b) / L^3
            // R_B = P a^2 (a + 3b) / L^3
            RA += load.magnitude * b * b * (3 * a + b) / Math.pow(span, 3);
            RB += load.magnitude * a * a * (a + 3 * b) / Math.pow(span, 3);
            MA += -load.magnitude * a * b * b / (span * span);
            MB += -load.magnitude * a * a * b / (span * span);
          } else if (this.startSupport === 'fixed') {
            RA += load.magnitude * b * b * (3 * span - b) / (2 * span ** 3);
            RB += load.magnitude * a * (3 * span ** 2 - a * (3 * span - a)) / (2 * span ** 3);
            MA += load.magnitude * a * b * b / (2 * span ** 2);
          } else if (this.endSupport === 'fixed') {
            RA += load.magnitude * b * (3 * span ** 2 - b * (3 * span - b)) / (2 * span ** 3);
            RB += load.magnitude * a * a * (3 * span - a) / (2 * span ** 3);
            MB += load.magnitude * a * a * b / (2 * span ** 2);
          } else {
            RA += load.magnitude * b / span;
            RB += load.magnitude * a / span;
          }
          break;

        case 'distributed':
          if (!load.length) break;
          const w = load.magnitude;
          if (this.startSupport === 'fixed' && this.endSupport === 'fixed') {
            // Standard formulas for fixed-fixed beam with uniform load over length l, starting at a from left
            // For full-span uniform load:
            // M_A = -wL^2/12
            // M_B = -wL^2/12
            // R_A = wL/2
            // R_B = wL/2
            if (load.length === span && load.position === this.startSupportPosition) {
              RA += w * span / 2;
              RB += w * span / 2;
              MA += -w * span * span / 12;
              MB += -w * span * span / 12;
            } else {
              // For partial uniform load, use influence lines or superposition (approximate by splitting into point loads at centroid)
              // Approximate as a point load at centroid for now
              const a_dist = (load.position + load.length / 2) - this.startSupportPosition;
              const b_dist = this.endSupportPosition - (load.position + load.length / 2);
              const P = w * load.length;
              RA += P * b_dist * b_dist * (3 * a_dist + b_dist) / Math.pow(span, 3);
              RB += P * a_dist * a_dist * (a_dist + 3 * b_dist) / Math.pow(span, 3);
              MA += -P * a_dist * b_dist * b_dist / (span * span);
              MB += -P * a_dist * a_dist * b_dist / (span * span);
            }
          } else if (this.startSupport === 'fixed') {
            RA += w * load.length * b * b * (3 * span - b) / (2 * span ** 3);
            RB += w * load.length * a * (3 * span ** 2 - a * (3 * span - a)) / (2 * span ** 3);
            MA += w * load.length * a * b * b / (2 * span ** 2);
          } else if (this.endSupport === 'fixed') {
            RA += w * load.length * b * (3 * span ** 2 - b * (3 * span - b)) / (2 * span ** 3);
            RB += w * load.length * a * a * (3 * span - a) / (2 * span ** 3);
            MB += w * load.length * a * a * b / (2 * span ** 2);
          } else {
            RA += w * load.length * b / span;
            RB += w * load.length * a / span;
          }
          break;

        case 'moment':
          const M = load.magnitude * (load.momentDirection === 'clockwise' ? 1 : -1);
          if (this.startSupport === 'fixed' && this.endSupport === 'fixed') {
            // For a moment applied at position a from left (b from right):
            // M_A = -M * b / L
            // M_B = M * a / L
            // R_A = M / L
            // R_B = -M / L
            RA += M / span;
            RB += -M / span;
            MA += -M * b / span;
            MB += M * a / span;
          } else if (this.startSupport === 'fixed') {
            RA += (3 * M * b) / (2 * span ** 2);
            RB -= (3 * M * b) / (2 * span ** 2);
            MA += M * (2 * b - span) / (2 * span);
          } else if (this.endSupport === 'fixed') {
            RA -= (3 * M * a) / (2 * span ** 2);
            RB += (3 * M * a) / (2 * span ** 2);
            MB += M * (2 * a - span) / (2 * span);
          } else {
            RA -= M / span;
            RB += M / span;
          }
          break;
      }
    });

    return {
      reactionA: Number(RA.toFixed(3)),
      reactionB: Number(RB.toFixed(3)),
      momentA: Number(MA.toFixed(3)),
      momentB: Number(MB.toFixed(3))
    };
  }

  calculateShear(x: number): number {
    if (x < 0 || x > this.beamLength) return 0;

    const R = this.calculateReactions();
    let shear = 0;

    if (x >= this.startSupportPosition) shear += R.reactionA;
    if (x >= this.endSupportPosition) shear += R.reactionB;

    this.loads.forEach(load => {
      if (x >= load.position) shear -= this.getLoadEffect(load, x);
    });

    return Number(shear.toFixed(3));
  }

  calculateMoment(x: number): number {
    if (x < 0 || x > this.beamLength) return 0;

    const R = this.calculateReactions();
    let moment = 0;

    // Check if it's a cantilever beam
    const isCantilever = (this.startSupport === 'fixed' && this.endSupport === 'free') || 
                        (this.startSupport === 'free' && this.endSupport === 'fixed');
    const fixedEnd = this.startSupport === 'fixed' ? 'start' : 'end';
    const fixedPos = fixedEnd === 'start' ? this.startSupportPosition : this.endSupportPosition;
    const freeEnd = fixedEnd === 'start' ? 'end' : 'start';
    const freePos = freeEnd === 'start' ? this.startSupportPosition : this.endSupportPosition;

    if (isCantilever) {
      // For cantilever beams, moment at x is sum of all load effects between x and the free end
      // (i.e., to the right of x if fixed at left, to the left if fixed at right)
      if (fixedEnd === 'start') {
        // Cantilever fixed at start (left), free at end (right)
        // Moment at x = sum of all loads between x and beamLength, taken about x
        this.loads.forEach(load => {
          if (load.type === 'point') {
            if (load.position > x) {
              // Downward load: negative moment
              moment -= load.magnitude * (load.position - x);
            }
          } else if (load.type === 'distributed' && load.length) {
            const loadStart = load.position;
            const loadEnd = load.position + load.length;
            // Only consider distributed load portions to the right of x
            if (loadEnd > x) {
              // The part of the distributed load to the right of x
              const a = Math.max(x, loadStart);
              const b = Math.min(this.beamLength, loadEnd);
              const l = b - a;
              if (l > 0) {
                // The resultant force is w*l, acts at center of segment
                const centroid = a + l/2;
                moment -= load.magnitude * l * (centroid - x);
              }
            }
          } else if (load.type === 'moment') {
            if (load.position > x) {
              // Clockwise moment: negative (by convention)
              moment -= load.magnitude * (load.momentDirection === 'clockwise' ? 1 : -1);
            }
          }
        });
      } else {
        // Cantilever fixed at end (right), free at start (left)
        // Moment at x = sum of all loads between 0 and x, taken about x
        this.loads.forEach(load => {
          if (load.type === 'point') {
            if (load.position < x) {
              moment += load.magnitude * (x - load.position);
            }
          } else if (load.type === 'distributed' && load.length) {
            const loadStart = load.position;
            const loadEnd = load.position + load.length;
            if (loadStart < x) {
              const a = Math.max(loadStart, 0);
              const b = Math.min(x, loadEnd);
              const l = b - a;
              if (l > 0) {
                const centroid = a + l/2;
                moment += load.magnitude * l * (x - centroid);
              }
            }
          } else if (load.type === 'moment') {
            if (load.position < x) {
              moment += load.magnitude * (load.momentDirection === 'clockwise' ? 1 : -1);
            }
          }
        });
      }
      // Moment at free end is always zero
      if (Math.abs(x - freePos) < 1e-8) return 0;
      return Number(moment.toFixed(3));
    }

    // For regular beams, calculate as before
    if (x >= this.startSupportPosition) {
      moment += -R.momentA - R.reactionA * (x - this.startSupportPosition);
    }
    if (x >= this.endSupportPosition) {
      moment += -R.momentB - R.reactionB * (x - this.endSupportPosition);
    }
    this.loads.forEach(load => {
      if (x <= load.position) return;
      switch (load.type) {
        case 'point':
          moment += load.magnitude * (x - load.position);
          break;
        case 'distributed':
          if (!load.length) break;
          const end = load.position + load.length;
          if (x <= end) {
            moment += load.magnitude * Math.pow(x - load.position, 2) / 2;
          } else {
            moment += load.magnitude * load.length * (x - load.position - load.length / 2);
          }
          break;
        case 'moment':
          moment += load.magnitude * (load.momentDirection === 'clockwise' ? 1 : -1);
          break;
      }
    });
    return Number(moment.toFixed(3));
  }

  calculateDeflection(x: number): number {
    if (x < 0 || x > this.beamLength) return 0;

    // Handle cantilever beam cases
    const isCantilever = (this.startSupport === 'fixed' && this.endSupport === 'free') || 
                        (this.startSupport === 'free' && this.endSupport === 'fixed');
    
    if (isCantilever) {
      const fixedEnd = this.startSupport === 'fixed' ? 'start' : 'end';
      const freeEnd = fixedEnd === 'start' ? 'end' : 'start';
      const fixedPos = fixedEnd === 'start' ? this.startSupportPosition : this.endSupportPosition;
      const freePos = freeEnd === 'start' ? this.startSupportPosition : this.endSupportPosition;
      
      // For cantilever beams, use the analytical solution
      const EI = this.materialProps.elasticModulus * this.calculateSectionProperties().momentOfInertia;
      let deflection = 0;
      
      this.loads.forEach(load => {
        const effPos = this.getEffectivePosition(load);
        const a = effPos - fixedPos;
        const b = freePos - effPos;
        
        switch (load.type) {
          case 'point':
            if (x >= effPos) {
              deflection += (load.magnitude * Math.pow(x - effPos, 2) * (3 * a - (x - effPos))) / (6 * EI);
            }
            break;
            
          case 'distributed':
            if (!load.length) break;
            const w = load.magnitude;
            const loadEnd = effPos + load.length;
            if (x >= effPos) {
              const x1 = Math.min(x, loadEnd);
              deflection += (w * Math.pow(x1 - effPos, 3) * (4 * a - (x1 - effPos))) / (24 * EI);
            }
            break;
            
          case 'moment':
            const M = load.magnitude * (load.momentDirection === 'clockwise' ? 1 : -1);
            if (x >= effPos) {
              deflection += (M * Math.pow(x - effPos, 2)) / (2 * EI);
            }
            break;
        }
      });
      
      return Number((deflection * BeamCalculator.DEFLECTION_TO_MM).toFixed(3));
    }

    // Regular beam calculations using FEM
    // Use a finer mesh for better accuracy
    const numElements = 50;
    const numNodes = numElements + 1;
    const dx = this.beamLength / numElements;
    const totalDOFs = numNodes * 2;

    // Initialize global stiffness matrix and force vector
    const K: number[][] = Array(totalDOFs).fill(0).map(() => Array(totalDOFs).fill(0));
    const F: number[] = Array(totalDOFs).fill(0);

    // Element stiffness matrix (Euler-Bernoulli beam)
    const EI = this.materialProps.elasticModulus * this.calculateSectionProperties().momentOfInertia;
    const l = dx;
    const factor = EI / Math.pow(l, 3);
    const ke: number[][] = [
      [12, 6 * l, -12, 6 * l],
      [6 * l, 4 * Math.pow(l, 2), -6 * l, 2 * Math.pow(l, 2)],
      [-12, -6 * l, 12, -6 * l],
      [6 * l, 2 * Math.pow(l, 2), -6 * l, 4 * Math.pow(l, 2)]
    ].map(row => row.map(value => value * factor));

    // Assemble global stiffness matrix
    for (let elem = 0; elem < numElements; elem++) {
      const node1 = elem;
      const node2 = elem + 1;
      const dofs = [node1 * 2, node1 * 2 + 1, node2 * 2, node2 * 2 + 1];
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          K[dofs[i]][dofs[j]] += ke[i][j];
        }
      }
    }

    // Apply boundary conditions
    const applyBC = (node: number, isFixed: boolean) => {
      if (node < 0 || node >= numNodes) return;
      const dispDOF = node * 2;
      const rotDOF = node * 2 + 1;
      if (isFixed) {
        K[dispDOF].fill(0); K[rotDOF].fill(0);
        K[dispDOF][dispDOF] = 1; K[rotDOF][rotDOF] = 1;
        F[dispDOF] = 0; F[rotDOF] = 0;
      } else {
        K[dispDOF].fill(0); K[dispDOF][dispDOF] = 1; F[dispDOF] = 0;
      }
    };

    const startNode = Math.max(0, Math.min(numNodes - 1, Math.round(this.startSupportPosition / dx)));
    const endNode = Math.max(0, Math.min(numNodes - 1, Math.round(this.endSupportPosition / dx)));

    // Handle free supports
    if (this.startSupport === 'free') {
      // No boundary conditions for free support
    } else if (this.startSupport === 'fixed') {
      applyBC(startNode, true);
    } else if (this.startSupport === 'pin' || this.startSupport === 'roller') {
      applyBC(startNode, false);
    }

    if (this.endSupport === 'free') {
      // No boundary conditions for free support
    } else if (this.endSupport === 'fixed') {
      applyBC(endNode, true);
    } else if (this.endSupport === 'pin' || this.endSupport === 'roller') {
      applyBC(endNode, false);
    }

    // Apply loads to the global force vector
    this.loads.forEach(load => {
      if (load.type === 'point') {
        // Find the element containing the load
        const elem = Math.max(0, Math.min(numElements - 1, Math.floor(load.position / dx)));
        const xLocal = load.position - elem * dx;
        const node1 = elem;
        const node2 = elem + 1;
        // Shape functions for point load at xLocal in element [0, l]
        const N1 = 1 - xLocal / l;
        const N2 = xLocal / l;
        if (node1 * 2 < totalDOFs) F[node1 * 2] += load.magnitude * N1;
        if (node2 * 2 < totalDOFs) F[node2 * 2] += load.magnitude * N2;
      } else if (load.type === 'distributed' && load.length) {
        // Distribute load to all affected elements
        let startElem = Math.max(0, Math.floor(load.position / dx));
        let endElem = Math.min(numElements - 1, Math.ceil((load.position + load.length) / dx) - 1);
        for (let elem = startElem; elem <= endElem; elem++) {
          // Overlap of distributed load with this element
          const elemStart = elem * dx;
          const elemEnd = (elem + 1) * dx;
          const overlapStart = Math.max(elemStart, load.position);
          const overlapEnd = Math.min(elemEnd, load.position + load.length);
          const overlap = Math.max(0, overlapEnd - overlapStart);
          if (overlap > 0) {
            const node1 = elem;
            const node2 = elem + 1;
            // Equivalent nodal forces for uniform load over overlap
            const w = load.magnitude;
            const L = elemEnd - elemStart;
            const a = (overlapStart - elemStart) / L;
            const b = (overlapEnd - elemStart) / L;
            // Integrate shape functions over [a, b]
            const f1 = w * L * (b - a) / 2;
            const f2 = w * L * (b * b - a * a) / 2;
            if (node1 * 2 < totalDOFs) F[node1 * 2] += f1;
            if (node2 * 2 < totalDOFs) F[node2 * 2] += f1;
            if (node1 * 2 + 1 < totalDOFs) F[node1 * 2 + 1] += f2 / 6;
            if (node2 * 2 + 1 < totalDOFs) F[node2 * 2 + 1] -= f2 / 6;
          }
        }
      } else if (load.type === 'moment') {
        // Apply moment to nearest node
        const node = Math.round(load.position / dx);
        const momentDOF = node * 2 + 1;
        if (momentDOF >= 0 && momentDOF < totalDOFs) {
          F[momentDOF] += load.magnitude * (load.momentDirection === 'clockwise' ? 1 : -1);
        }
      }
    });

    // Solve the system of equations
    const U = this.solveLinearSystem(K, F);

    // Interpolate deflection at x using shape functions
    const elem = Math.max(0, Math.min(numElements - 1, Math.floor(x / dx)));
    const xLocal = x - elem * dx;
    const node1 = elem;
    const node2 = elem + 1;
    const l_elem = dx;
    const xi = xLocal / l_elem;
    // Hermite shape functions
    const N1 = 1 - 3 * xi * xi + 2 * xi * xi * xi;
    const N2 = l_elem * (xi - 2 * xi * xi + xi * xi * xi);
    const N3 = 3 * xi * xi - 2 * xi * xi * xi;
    const N4 = l_elem * (-xi * xi + xi * xi * xi);
    let deflection = 0;
    if (node1 * 2 < totalDOFs) deflection += U[node1 * 2] * N1;
    if (node1 * 2 + 1 < totalDOFs) deflection += U[node1 * 2 + 1] * N2;
    if (node2 * 2 < totalDOFs) deflection += U[node2 * 2] * N3;
    if (node2 * 2 + 1 < totalDOFs) deflection += U[node2 * 2 + 1] * N4;

    // Return deflection in mm (downward positive)
    return Number((deflection * BeamCalculator.DEFLECTION_TO_MM).toFixed(3));
  }

  private solveLinearSystem(K: number[][], F: number[]): number[] {
    const n = F.length;
  
    // Validate input dimensions
    if (!K || !F) {
      throw new Error("Stiffness matrix (K) or force vector (F) is undefined.");
    }
    if (K.length !== n || K[0].length !== n) {
      throw new Error(`Stiffness matrix (K) must be an ${n} x ${n} matrix.`);
    }
  
    // Create a copy of the input matrices to avoid modifying the originals
    const augmented: number[][] = K.map(row => [...row]);
    const f = [...F];
  
    // Perform Gaussian elimination with partial pivoting
    for (let i = 0; i < n; i++) {
      // Find the row with the maximum element in the current column
      let maxRow = i;
      let maxVal = Math.abs(augmented[i][i]);
      for (let j = i + 1; j < n; j++) {
        const val = Math.abs(augmented[j][i]);
        if (val > maxVal) {
          maxVal = val;
          maxRow = j;
        }
      }
  
      // Swap rows if necessary
      if (maxRow !== i) {
        [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
        [f[i], f[maxRow]] = [f[maxRow], f[i]];
      }
  
      // Check for singular matrix
      if (Math.abs(augmented[i][i]) < BeamCalculator.NEGLIGIBLE) {
        throw new Error("Matrix is singular or nearly singular. Check support conditions and load application.");
      }
  
      // Eliminate column i from rows i+1 to n-1
      for (let j = i + 1; j < n; j++) {
        const factor = augmented[j][i] / augmented[i][i];
        f[j] -= factor * f[i];
        for (let k = i; k < n; k++) {
          augmented[j][k] -= factor * augmented[i][k];
        }
      }
    }
  
    // Back substitution
    const U: number[] = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = 0;
      for (let j = i + 1; j < n; j++) {
        sum += augmented[i][j] * U[j];
      }
      U[i] = (f[i] - sum) / augmented[i][i];
    }
  
    return U;
  }

  calculateTorsion(x: number): number {
    if (x < 0 || x > this.beamLength) return 0;

    let torsion = 0;
    this.loads.forEach(load => {
      if (load.type !== 'torsion' || x <= load.position) return;
      torsion += load.magnitude * (load.momentDirection === 'clockwise' ? 1 : -1);
    });

    return Number(torsion.toFixed(3));
  }

  calculateStresses(x: number): {
    normalStress: number;
    shearStress: number;
    torsionalStress: number;
    vonMisesStress: number;
  } {
    const { sectionModulus, torsionalConstant } = this.calculateSectionProperties();
    const moment = this.calculateMoment(x);
    const shear = this.calculateShear(x);
    const torsion = this.calculateTorsion(x);

    const normalStress = (moment / sectionModulus) * BeamCalculator.STRESS_TO_MPA;
    const shearStress = (3 * shear) / (2 * this.beamWidth * this.beamHeight) * BeamCalculator.STRESS_TO_MPA;
    const torsionalStress = (torsion * this.beamHeight) / (2 * torsionalConstant) * BeamCalculator.STRESS_TO_MPA;

    const vonMises = Math.sqrt(
      normalStress ** 2 + 3 * (shearStress ** 2 + torsionalStress ** 2)
    );

    return {
      normalStress: Number(normalStress.toFixed(3)),
      shearStress: Number(shearStress.toFixed(3)),
      torsionalStress: Number(torsionalStress.toFixed(3)),
      vonMisesStress: Number(vonMises.toFixed(3)),
    };
  }

  generateDiagramData(points: number = 100): DiagramPoint[] {
    const diagramPoints: DiagramPoint[] = [];
    const dx = this.beamLength / points;

    for (let x = 0; x <= this.beamLength; x += dx) {
      diagramPoints.push({
        position: Number(x.toFixed(6)),
        shear: this.calculateShear(x),
        moment: this.calculateMoment(x),
        torsion: this.calculateTorsion(x),
        deflection: this.calculateDeflection(x),
        ...this.calculateStresses(x),
      });
    }

    return diagramPoints;
  }
}