// ==UserScript==
// @name         atcoder-tools user script
// @namespace    https://github.com/kyuridenamida/atcoder-tools
// @version      1.0.0
// @description  write the code generated by atcoder-tools into the AtCoder's textbox
// @author       Kimiyuki Onaka
// @match        *://atcoder.jp/contests/*/tasks/*
// ==/UserScript==
function loadAllQualityResults() {
    const apiUrl = 'https://kyuridenamida.github.io/atcoder-tools/api/all.json';
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', apiUrl);
        xhr.responseType = 'json';
        xhr.onload = () => {
            if (xhr.status === 200) {
                const qualityResult = xhr.response;
                resolve(qualityResult);
            }
            else {
                reject(Error(xhr.statusText));
            }
        };
        xhr.onerror = () => {
            reject(Error("Network Error"));
        };
        xhr.send();
    });
}
function getContestIdAndProblemId() {
    const re = new RegExp('://atcoder\\.jp/contests/([^/]+)/tasks/([^/?&]+)');
    const found = window.location.href.match(re);
    if (found == null) {
        throw Error("failed to parse URL. something wrong");
    }
    const contestId = found[1];
    const problemId = found[2];
    return [contestId, problemId];
}
function getQualityResultForCurrentProblem(allQualityResults) {
    const [contestId, problemId] = getContestIdAndProblemId();
    for (const qualityResult of allQualityResults) {
        if (qualityResult.contest.contest_id === contestId && qualityResult.problem.problem_id === problemId) {
            return qualityResult;
        }
    }
    throw Error("QualityResult not found");
}
function getLanguageFromAtCoderDisplayName(languageName) {
    if (languageName.startsWith('C++')) {
        return 'cpp';
    }
    else if (languageName.startsWith('Java') && !languageName.startsWith('JavaScript')) {
        return 'java';
    }
    else if (languageName.startsWith('Rust')) {
        return 'rust';
    }
    else if (languageName.startsWith('Python3') || languageName.startsWith('PyPy3')) {
        return 'python';
    }
    else {
        return null;
    }
}
function isErasableCode(code, qualityResult) {
    if (!code.trim()) {
        return true;
    }
    for (const generatedCode of Object.values(qualityResult.codes)) {
        if (code.trim() === generatedCode.trim()) {
            return true;
        }
    }
    return false;
}
async function main() {
    const textarea = document.getElementsByName('sourceCode')[0];
    const languageId = document.getElementsByName('data.LanguageId')[0];
    if (textarea === undefined) {
        throw Error("textarea not found. are you logged in?");
    }
    const allQualityResults = await loadAllQualityResults();
    const qualityResult = getQualityResultForCurrentProblem(allQualityResults);
    console.log(`QualityResult: ${qualityResult}`);
    const editor = $(textarea).data('editor'); // of CodeMirror (https://codemirror.net/)
    const run = () => {
        if (isErasableCode(editor.getValue(), qualityResult)) {
            const languageName = languageId.options[languageId.selectedIndex].textContent;
            const language = languageName === null ? null : getLanguageFromAtCoderDisplayName(languageName);
            editor.setValue(language === null ? "" : qualityResult.codes[language]);
        }
    };
    run();
    editor.on('optionChange', run);
}
main();
