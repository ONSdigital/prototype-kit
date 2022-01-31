export default class SummaryManager {
  constructor(placeholder) {
    this.placeholder = placeholder;
    this.basePath = window.location.pathname
      .split('/')
      .filter(part => !part.includes('.html'))
      .join('/');

    this.config = [];
    this.html = [];
    this.setConfig();
    this.render();
  }

  setConfig() {
    // Filter out only session storage keys for this prototype
    const keys = Object.keys(sessionStorage).filter(key => key !== this.basePath && key.toLowerCase().includes(this.basePath));
    // Filter out questions with no answers and map questions
    const unsortedQuestions = keys
      .filter(key => {
        const data = JSON.parse(sessionStorage.getItem(key));
        const inputs = data.inputs.filter(input => input.label);
        return inputs.length;
      })
      .map(key => ({ key, ...JSON.parse(sessionStorage.getItem(key)) }));

    const firstQuestion = unsortedQuestions.find(question => !question.previousURL);
    const remainingUnsortedQuestions = unsortedQuestions.filter(question => question.previousURL).length;

    const questions = [firstQuestion];
    for (let i = 0; i < remainingUnsortedQuestions; i++) {
      const lastQuestionKey = questions[questions.length - 1].key;

      const nextQuestion = unsortedQuestions.find(question => question.previousURL === lastQuestionKey);

      questions.push(nextQuestion);
    }

    questions
      .filter(question => !question.hideFromSummary)
      .forEach(question => {
        let answers = question.inputs
          .filter(input => input.label && input.value)
          .map(input => (input.value === true ? input.label : input.value));
        let joinString;
        if (answers.length === 1) {
          const answer = answers[0];

          if (answer.includes('{pipe}')) {
            const templateParts = answer.replace('{/pipe}', '').split('{pipe}');

            const templatedAnswer = templateParts
              .map(part => {
                const pipedAnswer = sessionStorage.getItem(part);

                if (pipedAnswer) {
                  return JSON.parse(pipedAnswer).inputs.find(input => input.label).value;
                } else {
                  return part;
                }
              })
              .join('');

            answers = [templatedAnswer];
          } else {
            const pipedAnswer = sessionStorage.getItem(answer);

            if (pipedAnswer) {
              answers = JSON.parse(pipedAnswer)
                .inputs.filter(input => input.label && input.value)
                .map(input => (input.value === true ? input.label : input.value));
            }
          }
        }

        if (answers.length > 3 || question.inputs.find(input => input.checked === true)) {
          joinString = '<br>';
        } else {
          joinString = ' ';
        }

        const value = {
          text: answers.join(joinString)
        };

        if (!value.text) {
          value.text = 'No answer provided';
        }

        const row = {
          rowTitle: question.title,
          rowItems: [
            {
              valueList: [value],
              actions: [
                {
                  text: 'Change',
                  ariaLabel: 'Change answer',
                  url: `${question.key}?edit=true`
                }
              ]
            }
          ]
        };

        this.config.push(row);
      });
  }

  generateHTML() {
    this.config.forEach(row => {
      this.html.push(
        '<tbody class="ons-summary__item">' +
          '<tr class="ons-summary__row ons-summary__row--has-values">' +
          '<td class="ons-summary__item-title">' +
          `<div class="ons-summary__item--text">${row.rowTitle}</div>` +
          '</td>' +
          `<td class="ons-summary__values">${row.rowItems[0].valueList[0].text}</td>` +
          '<td class="ons-summary__actions">' +
          `<a href="${row.rowItems[0].actions[0].url}" class="ons-summary__button" aria-label="Change answer">Change</a>` +
          '</td>' +
          '</tr>' +
          '</tbody>'
      );
    });
    return this.html;
  }

  render() {
    const html = this.generateHTML();
    html.forEach(element => {
      this.placeholder.insertAdjacentHTML('beforeend', element);
    });

    const tableHeader =
      '<thead class="ons-u-vh">' + '<tr>' + '<th>Question</th>' + '<th>Answer given</th>' + '<th>Change answer</th>' + '</tr>' + '</thead>';

    this.placeholder.insertAdjacentHTML('afterBegin', tableHeader);
  }
}
