export { Page1 } from './Page1';
export { Page2 } from './Page2';
export { Page3 } from './Page3';
export { Page4 } from './Page4';

export default {
  Page1: () => import('./Page1'),
  Page2: () => import('./Page2'),
  Page3: () => import('./Page3'),
  Page4: () => import('./Page4'),
};
