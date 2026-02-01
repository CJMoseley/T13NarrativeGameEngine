import Workbench from './workbench/t13ne-workbench.js';

const workbench = new Workbench();
window.Workbench = workbench;
window.log = (msg, type) => workbench.log(msg, type);

workbench.init();

export default workbench;
