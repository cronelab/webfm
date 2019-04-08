//index
let loadBrain = async subject => {
    let brainPath = `/api/${subject}/brain`;
    let response = await fetch(brainPath);
    let resType = response.headers.get("content-type");
    let fmBrain = document.getElementById("fm-brain-2D");
  
    if (resType.includes("image/jpeg")) {
      let brain = await response.arrayBuffer();
      let base64Flag = "data:image/jpeg;base64,";
      let binary = "";
      let bytes = [].slice.call(new Uint8Array(brain));
      bytes.forEach(b => (binary += String.fromCharCode(b)));
  
      fmBrain.setAttribute("src", base64Flag + window.btoa(binary));
    }
    else{
      let brain = await response.text();
      fmBrain.setAttribute("src", brain);
    }
  };
  
  
  let loadGeometry = async subject => {
    let geometryPath = `api/${subject}/geometry`;
    const response = await fetch(geometryPath);
    const geometry = await response.json();
    return geometry;
  };
  
  //This only works if the data is in the metadata folder under sensorGeometry.
  // we actually only want to do this when we're creating the geometry
  let loadDots = geometry => {
    let brain = document.getElementById("fm-brain-2D");
    let dots = document.getElementById("electrode-dots");
    dots.style.position = "absolute";
    dots.width = brain.width; //fm-brain width
    dots.height = brain.height;
    let ctx = dots.getContext("2d");
    Object.values(geometry).map(electrodes => {
      ctx.beginPath();
      ctx.arc(
        brain.width * electrodes.u,
        brain.height * (1 - electrodes.v),
        3,
        0,
        Math.PI * 2,
        true
      );
      ctx.stroke();
      ctx.fillStyle = "green";
      ctx.fill();
    });
  };
  
  let loadStats = async (subject, record) => {
    let statPath = `api/${subject}/${record}/stats`;
    let timePath = `api/${subject}/${record}/times`;
  
    const statResponse = await fetch(statPath);
    const stats = await statResponse.json();
    const timeResponse = await fetch(timePath);
    const times = await timeResponse.json();
    let channels = Object.keys(stats.estimators.mean);
    let distributions = stats.distributions;
    let values = channels.map(ch => {
      let mean = stats.estimators.mean[ch];
      let variance = stats.estimators.variance[ch];
      let count = stats.estimators.count;
  
      let _m2 = mean.map((d, i) => {
        return count[i] > 1 && variance[i] !== undefined
          ? variance[i] * (count[i] - 1)
          : undefined;
      });
      let baselineMean = stats.baseline.mean[ch];
      let baselineVariance = stats.baseline.variance[ch];
      let baselineCount = stats.baseline.count;
      let baseline_m2 =
        baselineCount > 1 && baselineVariance !== undefined
          ? baselineVariance * (baselineCount - 1)
          : undefined;
      return {
        stats: { mean, variance, count, _m2 },
        baseline: {
          mean: baselineMean,
          variance: baselineVariance,
          count: baselineCount,
          _m2: baseline_m2
        }
      };
    });
    Object.keys(values).forEach(key => {
      let newKey = channels[key];
      values[newKey] = values[key];
      delete values[key];
    });
    values = { ...values, times };
    // console.log(values)
    return values;
  };
  
  export { loadGeometry, loadBrain, loadDots, loadStats };
  