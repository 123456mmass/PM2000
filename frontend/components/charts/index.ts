export { HarmonicChart } from './HarmonicChart';
export { PhasorDiagram } from './PhasorDiagram';

export default {
  HarmonicChart: () => import('./HarmonicChart'),
  PhasorDiagram: () => import('./PhasorDiagram'),
};
