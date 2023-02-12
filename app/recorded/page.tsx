'use client'
import { Col, Container, Row } from 'react-bootstrap'
import Brain from '../../components/Recorded/Brain'
import Raster from '../../components/Recorded/Raster'

export const metadata = {
  title: 'Recorded',
}

export default function Page() {
  return (
    <>
      {/* 
    function saveValues() {
      let raster = document.getElementById("fm");
      let maxVals = [];
      let meanValues = [];
      let chNames = [];
      for (var i = 1; i < raster.children.length; i++) {
        var item = raster.children[i];
        maxVals.push(Math.max(...item.children[2].__data__.values));
        let sum = item.children[2].__data__.values.reduce(
          (previous, current) => (current += previous)
        );
        let avg = sum / item.children[2].__data__.values.length;
        meanValues.push(avg);
        chNames.push(item.children[2].__data__.channel);
      }

      let maxDict = {};
      let meanDict = {};

      for (let i = 0; i < maxVals.length; i++) {
        if (maxVals[i] > 0) {
          maxDict[`${chNames[i]}`] = maxVals[i];
        }
      }
      for (let i = 0; i < meanValues.length; i++) {
        if (meanValues[i] > 0) {
          meanDict[`${chNames[i]}`] = meanValues[i];
        }
      }
      var maxSortable = [];
      for (var valz in maxDict) {
        maxSortable.push([valz, maxDict[valz]]);
      }

      maxSortable.sort(function (a, b) {
        return a[1] - b[1];
      });
      var meanSortable = [];
      for (var valz in meanDict) {
        meanSortable.push([valz, meanDict[valz]]);
      }

      meanSortable.sort(function (a, b) {
        return a[1] - b[1];
      });
      // console.log("Maximum High Gamma Activity");
      // console.log(JSON.stringify(maxSortable));
      // console.log("Mean High Gamma Activity");
      // console.log(meanDict);
      // console.log(meanSortable);

      let meanObj = {};
      meanSortable.forEach((x, i) => {
        meanObj[x[0]] = x[1];
      });
      // console.log(JSON.stringify(meanObj));
      // let dataStr = JSON.stringify(meanSortable);
      // let dataUri =
      //   "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      // let exportFileDefaultName = "data.json";

      // let linkElement = document.createElement("a");
      // linkElement.setAttribute("href", dataUri);
      // linkElement.setAttribute("download", exportFileDefaultName);
      // linkElement.click();

      let csvStr = parseJSONToCSVStr(meanObj);
      let dataUri = "data:text/csv;charset=utf-8," + csvStr;

      let exportFileDefaultName =
        document.getElementsByclassNameName("fm-subject-name")[0].innerHTML +
        "_" +
        document.getElementsByclassNameName("fm-task-name")[0].innerHTML +
        ".csv";

      let linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    }

    function parseJSONToCSVStr(jsonData) {
      if (jsonData.length == 0) {
        return "";
      }

      let columnDelimiter = ",";
      let lineDelimiter = "\n";
      let csvColumnHeader = "Electrode, Activity (Least to greatest)";
      let csvStr = csvColumnHeader + lineDelimiter;
      let keys = Object.keys(jsonData);

      console.log(keys);
      console.log(jsonData);
      keys.forEach(x => {
        csvStr += x;
        csvStr += columnDelimiter;
        csvStr += jsonData[x];
        csvStr += lineDelimiter;
      });
      return encodeURIComponent(csvStr);
    }
  </script>

  <script type="text/javascript">
    var urlParams = new URLSearchParams(window.location.search);

    document.title = urlParams.get("view");
  </script>

  <script>
    function load(url, element) {
      req = new XMLHttpRequest();
      req.open("GET", url, false);
      req.send(null);
      element.innerHTML = req.responseText;
    }
  </script>
</head>

<body>
  <!-- Navbar -->
  <div id="navbar"></div>
  <!-- Modals -->
  <div id="modals"></div>

  <!-- Main content --> */}
      <Container fluid>
        <Row>
          <Col md={5} sm={5}>
            <Raster />
          </Col>
          <Col
            md={7}
            sm={7}
            className="hidden-xs"
            style={{ position: 'fixed', right: '0px' }}
          >
            <Brain />
          </Col>
        </Row>
      </Container>

      {/* <script>
    var twoDBrain = document.getElementById("fm-brain");
    var threeDBrain = document.getElementsByclassNameName("webgl-content");
    var rasterPlots = document.getElementById("fm");
    var linePlots = document.getElementById("lineChart");

    twoDBrain.style.visibility = "visible";
    // twoDBrain.style.width = "auto";
    // twoDBrain.style.height = "auto";
    twoDBrain.style.resize = "none";
    threeDBrain[0].style.visibility = "hidden";
    rasterPlots.style.visibility = "visible";
    linePlots.style.visibility = "hidden";

    function toggleBrain(perspective) {
      if (perspective == "2D") {
        var dots = document.getElementsByclassNameName("fm-brain-dots")[0];

        twoDBrain.style.visibility = "visible";
        threeDBrain[0].style.visibility = "hidden";
        dots.style.display = "block";
      } else {
        var dots = document.getElementsByclassNameName("fm-brain-dots")[0];

        twoDBrain.style.visibility = "hidden";
        threeDBrain[0].style.visibility = "visible";
        dots.style.display = "none";
      }
    }

    function toggleCharts(charts) {
      if (charts == "raster") {
        linePlots.style.display = "none";
        rasterPlots.style.display = "block";
      } else if (charts == "line") {
        rasterPlots.style.display = "none";
        linePlots.style.display = "block";
        linePlots.style.visibility = "visible";
      }
    }
  </script>

  <!-- <script>
    setTimeout(function () {
      let subjName = document.getElementsByclassNameName("fm-subject-name")[0]
        .innerHTML;
      console.log(subjName);
      var script = document.createElement("script");
      // script.src = `/webFM_Display/Build/${subjName}/UnityLoader.js`;
      var ref = document.querySelector("script");
      ref.parentNode.insertBefore(script, ref);
    }, 5000);
  </script> -->
  <!-- Footer -->

  <footer className="footer navbar-fixed-bottom">
    <div className="container-fluid">
      <p className="text-muted text-right">
        <span className="fm-trial-label">[n]</span>
        &emsp;&middot;&emsp; BCI2K:
        <span className="text-success fm-bci-status-label">Connected</span>
      </p>
    </div>

    // <script src="/js/app/map.js"></script>
    // <script>
    //   load("/navbar.html", document.getElementById("navbar"));
    //   load("/modals.html", document.getElementById("modals"));
    // </script>
    // <script type="text/javascript">
    //   document
    //     .getElementById("twoVsThree")
    //     .addEventListener("click", function (e) {
    //       e.target.parentElement.classNameList.remove("active");
    //       if (e.target.id == "twoDDrop") {
    //         toggleBrain("2D");
    //       } else if (e.target.id == "threeDDrop") {
    //         toggleBrain("3D");
    //       }
    //     });
    //   document
    //     .getElementById("graphViews")
    //     .addEventListener("click", function (e) {
    //       e.target.parentElement.classNameList.remove("active");
    //       if (e.target.id == "rasterView") {
    //         toggleCharts("raster");
    //       } else if (e.target.id == "chartView") {
    //         toggleCharts("line");
    //       }
    //     });
    // </script>
  </footer> */}
    </>
  )
}
