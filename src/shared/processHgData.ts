import fmdata from "./fmdata";

let dataset = new fmdata();

const pullData = async (fetchRoute) => {
    let response = await fetch(fetchRoute);
    let data = await response.json();
    return await dataset.get(data);

}