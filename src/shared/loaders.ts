// loaders.ts
/**
 * This is the doc comment for shared/loaders
 * 
 * @packageDocumentation
 */


let loadValues = async (subject: any, record: any) => {
  let valuePath = `api/${subject}/${record}/values`;
  let timePath = `api/${subject}/${record}/times`;
  const valueResponse = await fetch(valuePath);
  const values = await valueResponse.json();
  const timeResponse = await fetch(timePath);
  const times = await timeResponse.json();
  let channels = Object.keys(values);
  return {
    ...values,
    times,
  };
};

let loadStats = async (subject: any, record: any) => {
  let statPath = `api/${subject}/${record}/stats`;
  let timePath = `api/${subject}/${record}/times`;

  const statResponse = await fetch(statPath);
  const stats = await statResponse.json();
  const timeResponse = await fetch(timePath);
  const times: any = await timeResponse.json();
  let channels = Object.keys(stats.estimators.mean);
  let distributions = stats.distributions;
  let values = channels.map((ch) => {
    let mean = stats.estimators.mean[ch];
    let variance = stats.estimators.variance[ch];
    let count = stats.estimators.count;

    let _m2 = mean.map((d: any, i: any) => {
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
      stats: {
        mean,
        variance,
        count,
        _m2,
      },
      baseline: {
        mean: baselineMean,
        variance: baselineVariance,
        count: baselineCount,
        _m2: baseline_m2,
      },
    };
  });
  Object.keys(values).forEach((key: any) => {
    let newKey: any = channels[key];
    values[newKey] = values[key];
    delete values[key];
  });
  values = {
    ...values,
    // times
  };
  // console.log(values)
  return values;
};

export {
  loadValues,
  loadStats,
};
