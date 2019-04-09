export default class brainFM {
  constructor() {
    let dotMaxRadius = 0.03;
    let dotMaxRadius = 0.04;
    let dotColors = [
      "#313695",
      "#4575b4",
      "#74add1",
      "#abd9e9",
      "#000000",
      "#fee090",
      "#fdae61",
      "#f46d43",
      "#d73027"
    ];

    if (document.title == "WebFM: Map") {
      let dotMinRadius = 0.003; // u (horizontal) units
      let extent = 10.0; // TODO Expose
      let dotColorsDomain = [-9, -5, -2, -0.01, 0.0, 0.01, 2, 5, 9];
    } else {
      let dotMinRadius = 0.006; // u (horizontal) units
      let extent = 100.0; // TODO Expose
      let dotColorsDomain = [-450, -350, -100, -30, 0.0, 30, 100, 350, 450];
      let dotPowerThreshold = [
        this.dotColorsDomain[3],
        this.dotColorsDomain[5]
      ];
    }

    let extentBuffer = 10.0;                                                                                             LIVE
    let extentBufferInfinity = 180.0;                                                                                                LIVE
    let dotColorsDomainBuffer = [-5, -3.5, -2, -1, 0.0, 1, 2, 3.5, 5];
    let dotColorsDomainBufferInfinity = [
      -120,-80,-50,-20,0.0,20,50,80,120
    ];
    let dotPowerThresholdBuffer = [
      this.dotColorsDomainBuffer[3],
      this.dotColorsDomainBuffer[5]
    ];
    let dotPowerThresholdBufferInfinity = [
      this.dotColorsDomainBufferInfinity[3],
      this.dotColorsDomainBufferInfinity[5]
    ];
    let doDotPowerThreshold = true;
  }

  getBrainSizes = () => {
    let brain = document.getElementById('fm-brain')
    let width = brain.width;
    let height = brain.height;
    return [height,width]
  }
}
