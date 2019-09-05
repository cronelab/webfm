const fetchAndStoreBrain = async subject => {
  let storedBrain = localStorage.getItem(`brain`);
  if (JSON.parse(storedBrain) != null && storedBrain.subject == subject) {
    return storedBrain.brain;
  } else {
    localStorage.removeItem("brain");
    let response = await fetch(`/api/brain/${subject}`);
    let resType = response.headers.get("content-type");
    let brain;
    if (resType.includes("image/jpeg")) {
      let brain = await response.arrayBuffer();
      let base64Flag = "data:image/jpeg;base64,";
      let binary = "";
      let bytes = [].slice.call(new Uint8Array(brain));
      bytes.forEach(b => (binary += String.fromCharCode(b)));
      brain = base64Flag + window.btoa(binary);
      localStorage.setItem(`brain`, JSON.stringify({
        subject: subject,
        data: brain
      }));
      return brain;
    } else {
      brain = await response.text();
      localStorage.setItem(`brain`, JSON.stringify({
        subject: subject,
        data: brain
      }));
      return brain;

    }

  }
};

const fetchAndStoreGeometry = async subject => {
  let storedGeometry = localStorage.getItem(`geometry`);
  if (JSON.parse(storedGeometry) != null && storedGeometry.subject == subject) {
    return storedGeometry.geometry;
  } else {
    localStorage.removeItem("geometry");
    let response = await fetch(`/api/geometry/${subject}`);
    let geometry = await response.json();
    localStorage.setItem(`geometry`, JSON.stringify({
      subject: subject,
      data: geometry
    }));
    return geometry;
  }
};

export {
  fetchAndStoreBrain,
  fetchAndStoreGeometry
};