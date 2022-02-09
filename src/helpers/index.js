import './questions-manager';
import './piping';
import './previous-link';
import SummaryManager from './summary-manager';

const summaryPlaceholder = document.querySelector('.js-summary');

if (summaryPlaceholder) {
  new SummaryManager(summaryPlaceholder);
}
