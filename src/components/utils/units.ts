export const convertUnits = {
    MPaToPa: (value: number) => value * 1e6,
    mToMm: (value: number) => value * 1000,
    kNmToNm: (value: number) => value * 1000,
  };
  
  export const formatUnits = {
    stress: (value: number) => `${value.toFixed(2)} MPa`,
    force: (value: number) => `${value.toFixed(2)} kN`,
    length: (value: number) => `${value.toFixed(2)} m`,
  };