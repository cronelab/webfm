import "./index.scss";
import "bootstrap";
import "@fortawesome/fontawesome-free/js/all";
import fmui from "../fmui";
import fmdata from "../fmdata";

let uiManager: any;
let dataset: any;
window.onload = async () => {
  let subjectName = localStorage.getItem("subject");
  let recordName = localStorage.getItem("record");

  let request = await fetch(`/config`);
  let data = await request.json();
  dataset = new fmdata();
  uiManager = new fmui();

  uiManager.config.ui = data;
  uiManager.setup();
  var urlParams = new URLSearchParams(window.location.search);

  let fetchRoute;
  if (urlParams.get("type") == "HG") {
    fetchRoute = `/api/data/${subjectName}/${recordName}/HG`;
  } else {
    fetchRoute = `/api/data/${subjectName}/${recordName}`;
  }
  fetch(fetchRoute)
    .then((response) => response.json())
    .then((data) => {
      dataset.get(data).then(() => {
        document.getElementsByClassName(
          "fm-subject-name"
        )[0].innerHTML = subjectName;
        document.getElementsByClassName(
          "fm-subject-name"
        )[1].innerHTML = subjectName;
        document.getElementsByClassName("fm-task-name")[0].innerHTML =
          dataset.metadata.setting.task;
        (<HTMLInputElement>(
          document.getElementById("fm-option-save-name")
        )).value = dataset.metadata.setting.task;
        uiManager.updateChannelNames(dataset.metadata.montage);
        uiManager.raster.update(dataset.displayData);
        uiManager.brain.setup(
          JSON.parse(localStorage.getItem("brain")).data,
          JSON.parse(localStorage.getItem("geometry")).data
        );
        uiManager.brain.update(
          dataset.dataForTime(uiManager.raster.cursorTime)
        );
        if (!uiManager.raster.timeScale) return;
        uiManager.raster.timeScale.range([
          dataset.getTimeBounds().start,
          dataset.getTimeBounds().end,
        ]);
      });
    });
  uiManager.raster.oncursormove = (newTime: number) => {
    document.getElementsByClassName("fm-time-selected")[0].innerHTML = `${
      newTime > 0 ? "+" : ""
    }${newTime.toFixed(3)} s`;
    uiManager.brain.update(dataset.dataForTime(newTime));
  };
};

document.getElementById("playButton").onclick = async (e) => {
  for (let i = 0; i < dataset.contents.times.length; i++) {
    let result = await new Promise((resolve, reject) => {
      setTimeout(
        () => resolve(dataset.dataForTime(dataset.contents.times[i])),
        250
      );
    });

    uiManager.brain.update(result);
    document.getElementsByClassName("fm-time-selected")[0].innerHTML = `${
      dataset.contents.times[i] > 0 ? "+" : ""
    }${dataset.contents.times[i].toFixed(3)} s`;
    uiManager.raster.updateCursor(dataset.contents.times[i]);
  }
};

window.onresize = () => uiManager.didResize();
