var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import "./index.scss";
import "bootstrap";
import "@fortawesome/fontawesome-free/js/all";
import fmui from '../../shared/fmui';
import fmdata from '../../shared/fmdata';
import OnlineDataSource from './fmonline';
// import Worker from '../shared/source.worker.js';
// const myWorker = new Worker();
var dataset;
var uiManager;
var subject;
var task;
// import Worker from '../shared/dataIndex.worker';
import Worker from "../../shared/dataIndex.worker";
var dataIndexer = new Worker();
window.onload = function () { return __awaiter(void 0, void 0, void 0, function () {
    var request, config, sourceAddress, imageData, sensorGeometry, taskConfig;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetch("/config")];
            case 1:
                request = _a.sent();
                return [4 /*yield*/, request.json()];
            case 2:
                config = _a.sent();
                subject = localStorage.getItem('subject');
                task = localStorage.getItem('task');
                dataset = new fmdata();
                uiManager = new fmui();
                uiManager.setup();
                uiManager.raster.oncursormove = function (newTime) {
                    document.getElementsByClassName('fm-time-selected')[0].innerHTML = (newTime > 0 ? '+' : '') + newTime.toFixed(3) + ' s';
                    uiManager.brain.update(dataset.dataForTime(newTime));
                };
                uiManager.onsave = function (saveName) {
                    dataset.put("/api/data/" + subject + "/" + saveName, {
                        "import": './.metadata'
                    })
                        .then(function () { return updateRecordListForSubject(subject); })["catch"](function (reason) { return console.log(reason); });
                };
                uiManager.onoptionchange = function (option, newValue) {
                    if (option == 'stim-trial-start')
                        dataSource.updateTrialWindow({ start: newValue });
                    if (option == 'stim-trial-end')
                        dataSource.updateTrialWindow({ end: newValue });
                    if (option == 'stim-baseline-start') {
                        updateBaselineWindow({
                            start: newValue
                        });
                    }
                    if (option == 'stim-baseline-end') {
                        updateBaselineWindow({
                            end: newValue
                        });
                    }
                    if (option == 'stim-timing') {
                        if (newValue == 'state')
                            dataSource._stateTiming = true;
                        else
                            dataSource._stateTiming = false;
                    }
                    if (option == 'stim-channel') {
                        if (!newValue)
                            return;
                        dataSource._timingChannel = newValue;
                    }
                    if (option == 'state-name') {
                        if (!newValue)
                            return;
                        dataSource._timingState = newValue;
                    }
                    if (option == 'stim-off')
                        dataSource.threshold.offValue = parseInt(newValue);
                    if (option == 'stim-on')
                        dataSource.threshold.onValue = parseInt(newValue);
                };
                sourceAddress = localStorage.getItem('source-address');
                document.getElementsByClassName('fm-subject-name')[0].innerHTML = subject;
                document.getElementsByClassName('fm-subject-name')[1].innerHTML = subject;
                document.getElementsByClassName('fm-back')[0].setAttribute('href', "/#" + subject);
                document.getElementsByClassName('fm-task-name')[0].innerHTML = task;
                document.getElementById('fm-option-save-name').value = task;
                imageData = JSON.parse(localStorage.getItem('brain')).brain;
                sensorGeometry = JSON.parse(localStorage.getItem('geometry')).geometry;
                Object.assign(dataset.metadata, {
                    kind: 'high gamma power',
                    labels: ['timeseries'],
                    subject: subject,
                    brainImage: imageData,
                    'sensorGeometry': sensorGeometry,
                    setting: {
                        task: task
                    }
                });
                uiManager.brain.setup(imageData, sensorGeometry);
                taskConfig = JSON.parse(JSON.stringify(config.tasks["" + task] || config.tasks["default"]));
                if (taskConfig.trialWindow !== undefined)
                    dataSource.updateTrialWindow(taskConfig.trialWindow);
                if (taskConfig.baselineWindow !== undefined)
                    dataset.updateBaselineWindow(taskConfig.baselineWindow);
                dataSource.connect("ws://" + sourceAddress);
                return [2 /*return*/];
        }
    });
}); };
var dataSource = new OnlineDataSource();
dataSource.onproperties = function (properties) {
    dataset.setupChannels(properties.channels);
    uiManager.updateChannelNames(properties.channels);
};
dataSource.onBufferCreated = function () { return dataset.updateTimesFromWindow(dataSource.trialWindow, dataSource._trialBlocks); };
dataSource.onStartTrial = function () {
    document.getElementsByClassName('fm-transfer-icon')[0].style.display = '';
    document.getElementsByClassName('fm-trial-label')[0].classList.add('fm-trial-label-active');
};
dataSource.ontrial = function (trialData) {
    setTimeout(function () { return document.getElementsByClassName("fm-transfer-icon")[0].classList.add('d-none'); }, 500);
    document.getElementsByClassName("fm-working-icon")[0].style.display = '';
    dataset.ingest(trialData)
        .then(function () {
        updateDataDisplay();
        setTimeout(function () { return document.getElementsByClassName("fm-working-icon")[0].classList.add('d-none'); }, 500);
        uiManager.updateTrialCount(dataset.getTrialCount());
        document.getElementsByClassName('fm-trial-label')[0].classList.remove('fm-trial-label-active');
    });
};
dataSource.onRawSignal = function (rawSignal) { return uiManager.scope.update(rawSignal); };
var updateRecordListForSubject = function (theSubject) {
    fetch("/api/list/" + theSubject).then(function (response) { return response.json(); })
        .then(function (newRecords) {
        newRecords.sort();
        var recordsTable = document.getElementById('fm-cloud-records-table');
        while (recordsTable.hasChildNodes())
            recordsTable.removeChild(recordsTable.firstChild);
        newRecords.forEach(function (record) {
            var outer = $('<tr/>');
            var inner = $('<td/>', {
                text: record
            });
            inner.appendTo(outer);
            outer.appendTo('#fm-cloud-records-table');
        });
    });
};
var updateDataDisplay = function () {
    uiManager.raster.update(dataset.displayData);
    var dataWindow = {
        start: dataset.contents.times[0],
        end: dataset.contents.times[dataset.contents.times.length - 1]
    };
    dataIndexer.postMessage({
        displayData: dataset.displayData,
        newTime: uiManager.raster.cursorTime,
        dataWindow: dataWindow
    });
    dataIndexer.onmessage = function (e) {
        uiManager.brain.update(e.data);
        // uiManager.brain.update(dataset.dataForTime(uiManager.raster.cursorTime));
    };
    var timeBounds = dataset.getTimeBounds();
    if (!uiManager.raster.timeScale) {
        return;
    }
    uiManager.raster.timeScale.range([timeBounds.start, timeBounds.end]);
};
var updateBaselineWindow = function (newWindow) {
    document.getElementsByClassName("fm-working-icon")[0].style.display = '';
    dataset.updateBaselineWindow(newWindow)
        .then(function () {
        updateDataDisplay();
        setTimeout(function () { return document.getElementsByClassName("fm-working-icon")[0].classList.add('d-none'); }, 500);
    });
};
window.onresize = function (e) { return uiManager.didResize(); };
window.onbeforeunload = function () {
    if (!dataset._clean) {
        return "There are unsaved changes to your map. Are you sure you want to leave?";
    }
};
//# sourceMappingURL=main.js.map