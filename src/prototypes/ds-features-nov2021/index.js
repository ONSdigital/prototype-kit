import './scripts/questions-manager';
import './scripts/piping';
import './scripts/previous-link';
import SummaryManager from './scripts/summary-manager';

const summaryPlaceholder = document.querySelector('.js-summary');

if (summaryPlaceholder) {
  new SummaryManager(summaryPlaceholder);
}
