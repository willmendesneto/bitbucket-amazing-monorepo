// Get query string params
const getQueryStringParams = (query) => {
    if (!query) {
        return {};
    }

    return (/^[?#]/.test(query) ? query.slice(1) : query)
        .split('&')
        .reduce((params, param) => {
            const [key, value] = param.split('=');
            // eslint-disable-next-line no-param-reassign
            params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
            return params;
        }, {});
};

const onPjaxSuccess = (filterBy) => {
    if (!filterBy && !window.location.search) {
        console.log('Nothing to filter');
    }

    const qs = filterBy || getQueryStringParams(window.location.search);
    const diffFiles = document.querySelectorAll('.commit-files-summary [data-file-identifier]');

    diffFiles.forEach((el) => {
        const filename = el.getAttribute('data-file-identifier');
        if (!filename.includes(qs.filterBy)) {
            // eslint-disable-next-line no-param-reassign
            el.style.display = 'none';
        } else if (el.style.display === 'none') {
            // eslint-disable-next-line no-param-reassign
            el.style.display = 'block';
        }
    });

    let timeoutID;
    let commitFilesSummary = document.querySelector('#commit-files-summary');

    const commitFilesSummaryHTML = commitFilesSummary.innerHTML;

    const onDOMNodeRemoved = () => {
        if (timeoutID) {
            clearTimeout(timeoutID);
        }

        timeoutID = setTimeout(() => {
            commitFilesSummary.removeEventListener('DOMNodeRemoved', onDOMNodeRemoved, true);
            commitFilesSummary.innerHTML = commitFilesSummaryHTML;
            commitFilesSummary = null;
            addCopyButton();
        }, 1000);
    };

    commitFilesSummary.addEventListener('DOMNodeRemoved', onDOMNodeRemoved, true);

    const compareDiffCounterSpan = document.querySelector('#compare-diff-content h1 span');
    let filesCounter = 0;
    document.querySelectorAll('section.bb-udiff')
        // eslint-disable-next-line complexity
        .forEach((el) => {
            const filename = el.getElementsByClassName('filename')[0] || {};
            const text = filename.innerText;
            if (!(text || '').includes(qs.filterBy)) {
                // eslint-disable-next-line no-param-reassign
                el.style.display = 'none';
            } else {
                if (el.style.display === 'none') {
                    // eslint-disable-next-line no-param-reassign
                    el.style.display = 'block';
                }
                const tryAgain = el.getElementsByClassName('load-diff')[0] || {};
                if (typeof tryAgain.click === 'function') {
                    tryAgain.click();
                }
                filesCounter += 1;
            }
        });

    compareDiffCounterSpan.innerText = `(${filesCounter})`;
};

const addCompareFilter = () => {
    const compareTabs = document.getElementById('compare-tabs').parentNode;
    const compareTabsParentDiv = compareTabs.parentNode;
    const container = document.createElement('div');
    container.className = 'compare-filter-file-changes-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Filter by folder in your monorepo';
    input.id = 'text';
    input.className = 'compare-filter-text'; // set the CSS class

    const button = document.createElement('button');
    button.id = 'compare-filter-text-button';
    button.innerHTML = 'FILTER NOW';
    button.addEventListener('click', () => {
        onPjaxSuccess({ filterBy: input.value });
    });

    container.appendChild(input);
    container.appendChild(button);

    // Adding input and button into page
    compareTabsParentDiv.insertBefore(container, compareTabs);
};

const copyToClipboard = (text) => {
    const clipboardTarget = document.createElement('input');
    document.body.appendChild(clipboardTarget);
    clipboardTarget.value = text;
    clipboardTarget.select();
    document.execCommand('copy');
    document.body.removeChild(clipboardTarget);
};

const addCopyButton = () => {
    document.querySelectorAll('section.bb-udiff')
        // eslint-disable-next-line complexity
        .forEach((el) => {
            const button = document.createElement('button');
            button.className = 'copy-file-path';
            button.innerHTML = ' COPY ';
            button.addEventListener('click', () => {
                const filename = el.getAttribute('data-path');
                console.log(`Copied ${filename} to clipboard`);
                button.innerHTML = ' COPIED ';

                copyToClipboard(filename);

                setTimeout(() => {
                    button.innerHTML = ' COPY ';
                }, 1000);
            });

            const diffFilename = el.getElementsByClassName('filename')[0];
            if (diffFilename) {
                diffFilename.appendChild(button);
            }
        });
};

const compareFilterFormExists = () => !!document.querySelector('.compare-filter-file-changes-wrapper');
const copyFileUrlExists = () => !!document.querySelector('section.bb-udiff .copy-file-path');
const diffFilesExist = () => !!document.querySelector('#compare-diff-content').hasChildNodes();
const compareTabsExist = () => !!document.getElementById('compare-tabs');

document.addEventListener('pjax:end', () => {
    console.log('PJAX FINISHED! CALLING INIT AGAIN');
    init();
});

const init = () => {
    console.log('CALLING INIT');

    if (!diffFilesExist() || !compareTabsExist()) {
        return setTimeout(init, 200);
    }

    if (!compareFilterFormExists()) {
        console.log('ADDING COMPARE FILTER');
        addCompareFilter();
    }

    if (!copyFileUrlExists()) {
        console.log('ADDING COPY BUTTON IN DIFF FILES');
        addCopyButton();
    }
};

init();
